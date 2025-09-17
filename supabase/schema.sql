--
-- Database schema for the United Pets application.
--
-- This script creates tables for users, pets, services, appointments, invoices,
-- gallery images, newsletter subscribers and staff availability.  It also
-- defines row level security (RLS) policies so that clients, staff and
-- administrators can access only the appropriate data.

-- Enable extensions required for UUIDs and cryptographic functions
create extension if not exists "uuid-ossp";

-- Users profile table (metadata for auth.users)
create table if not exists public.users_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','staff','admin')),
  full_name text,
  phone text,
  address jsonb,
  newsletter_opt_in boolean default false,
  created_at timestamptz default now()
);

-- Pet information owned by clients
create table if not exists public.pet (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text,
  breed text,
  sex text,
  weight_kg numeric(5,2),
  dob date,
  microchip text,
  notes text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Services offered (e.g. veterinary, grooming, adoption)
create table if not exists public.service (
  id serial primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
  duration_mins int not null default 60,
  base_price_cents int not null default 0,
  image_url text,
  is_active boolean default true,
  sort int default 0
);

-- Appointments booked by clients
create table if not exists public.appointment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  pet_id uuid references public.pet(id) on delete set null,
  service_id int not null references public.service(id) on delete restrict,
  staff_id uuid references auth.users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','CANCELLED','COMPLETED')),
  intake jsonb,
  created_at timestamptz default now()
);

-- Invoices associated with appointments and payments
create table if not exists public.invoice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  appointment_id uuid references public.appointment(id),
  stripe_payment_intent text,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'DUE' check (status in ('DUE','PAID','REFUNDED')),
  issued_at timestamptz default now(),
  paid_at timestamptz
);

-- Gallery images uploaded by clients and moderated by staff
create table if not exists public.gallery_image (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pet(id) on delete set null,
  storage_path text not null,
  caption text,
  alt text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz default now(),
  reviewed_by uuid references auth.users(id)
);

-- Newsletter subscribers collected via forms or client portal
create table if not exists public.newsletter_subscriber (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'FORM',
  status text default 'subscribed'
);

-- Staff availability schedule for appointment booking
create table if not exists public.staff_availability (
  id serial primary key,
  staff_id uuid not null references auth.users(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_local time not null,
  end_local time not null
);

-- Enable row level security on the tables
alter table public.users_profile enable row level security;
alter table public.pet enable row level security;
alter table public.appointment enable row level security;
alter table public.invoice enable row level security;
alter table public.gallery_image enable row level security;
alter table public.newsletter_subscriber enable row level security;
alter table public.service enable row level security;
alter table public.staff_availability enable row level security;

-- Helper functions to determine user roles from JWT
create or replace function public.is_admin()
returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'user_metadata' ->> 'role') in ('staff','admin'), false);
$$;

-- RLS policies

-- Users profile: users can read and update their own profile; admins can read and update any
create policy if not exists profile_self_read on public.users_profile
  for select using (auth.uid() = user_id or public.is_admin());

create policy if not exists profile_self_write on public.users_profile
  for update using (auth.uid() = user_id or public.is_admin());

-- Pet: owners and staff can read; owners can insert/update their own pets; staff can manage all
create policy if not exists pet_owner_read on public.pet
  for select using (owner_id = auth.uid() or public.is_staff());

create policy if not exists pet_owner_insert on public.pet
  for insert with check (owner_id = auth.uid());

create policy if not exists pet_owner_update on public.pet
  for update using (owner_id = auth.uid() or public.is_staff());

-- Service: public read; staff can manage
create policy if not exists service_public_read on public.service
  for select using (true);

create policy if not exists service_staff_write on public.service
  for all using (public.is_staff());

-- Appointment: clients and staff can read; clients can insert their own; staff can update
create policy if not exists appt_owner_read on public.appointment
  for select using (user_id = auth.uid() or public.is_staff());

create policy if not exists appt_owner_insert on public.appointment
  for insert with check (user_id = auth.uid());

create policy if not exists appt_owner_update on public.appointment
  for update using (user_id = auth.uid() or public.is_staff());

-- Invoice: clients and staff can read; clients can insert; staff can update
create policy if not exists invoice_owner_read on public.invoice
  for select using (user_id = auth.uid() or public.is_staff());

create policy if not exists invoice_owner_insert on public.invoice
  for insert with check (user_id = auth.uid());

create policy if not exists invoice_staff_update on public.invoice
  for update using (public.is_staff());

-- Gallery images: public can read approved; clients read their own and staff read all; clients can insert their own; clients can update their own pending; staff can update to approve/reject
create policy if not exists gallery_read_public_approved on public.gallery_image
  for select using (status = 'APPROVED' or user_id = auth.uid() or public.is_staff());

create policy if not exists gallery_client_insert on public.gallery_image
  for insert with check (user_id = auth.uid());

create policy if not exists gallery_client_update_own_pending on public.gallery_image
  for update using (user_id = auth.uid() and status = 'PENDING');

create policy if not exists gallery_staff_moderate on public.gallery_image
  for update using (public.is_staff());

-- Newsletter: anyone can subscribe; staff can view
create policy if not exists newsletter_insert on public.newsletter_subscriber
  for insert with check (true);

create policy if not exists newsletter_staff_read on public.newsletter_subscriber
  for select using (public.is_staff());

-- Staff availability: public read; staff manage
create policy if not exists availability_read on public.staff_availability
  for select using (true);

create policy if not exists availability_staff_write on public.staff_availability
  for all using (public.is_staff());
