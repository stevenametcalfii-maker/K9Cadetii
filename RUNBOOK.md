# United Pets Deployment Runbook

This runbook describes how to configure and deploy the United Pets application using a static export of the Next.js frontend on a traditional web host (for example, SiteGround) while leveraging Supabase for all dynamic functionality and Stripe for payments.

## 1. Supabase Setup

### 1.1 Create a Supabase Project

1.  Log in to your [Supabase dashboard](https://app.supabase.com/).  Create a new project and note the **API URL**, **anon/public key** and **service role key**.
2.  In the SQL editor, paste and execute the contents of `supabase/schema.sql`.  This will create the tables used by the application and establish row level security (RLS) policies.  Review the policies to ensure they align with your business rules.

### 1.2 Storage Buckets

Create two private storage buckets via the Supabase dashboard:

* `gallery` – For client pet photos displayed after admin approval.
* `pet-avatars` – For storing thumbnail avatars for pets.

Set appropriate file size limits.  These buckets are private by default; files are accessed via signed URLs or through your own API.

### 1.3 Edge Functions

Install the Supabase CLI (see Supabase docs) and log into your project:

```sh
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

Then deploy the provided functions from this repository:

```sh
cd supabase/functions
supabase functions deploy create-checkout-session
supabase functions deploy sign-upload
supabase functions deploy available-slots
```

After deployment, configure the following secrets for your functions via the Supabase dashboard or CLI:

- `STRIPE_SECRET_KEY` – Your Stripe secret key for server‑side API requests.
- `SITE_URL` – The base URL of your deployed site (for checkout redirects).
- `SUPABASE_SERVICE_ROLE_KEY` – The service role key allows functions to bypass RLS when necessary.

Depending on your needs, you may extend these functions with additional logic (for example, verifying appointment availability or generating signed URLs for file uploads).

## 2. Stripe Configuration

1.  Create a product in your Stripe dashboard to represent an appointment deposit or service fee, or plan to use dynamic amounts from your database.
2.  In the **Developers → Webhooks** section, add a webhook that points to a Supabase Edge Function or other server endpoint.  For example, you could create a separate `stripe-webhook` function to update invoice records when a checkout session completes.
3.  Store the `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the secrets management area of your functions.

## 3. Frontend Configuration

### 3.1 Environment Variables

Within the `frontend/` directory, copy `.env.example` to `.env.local` and fill in the following values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-publishable-key>
```

These variables are exposed to the browser so **do not** include your service role key or Stripe secret key here.

### 3.2 Running Locally

Install dependencies and start the development server:

```sh
cd frontend
npm install
npm run dev
```

The application runs at `http://localhost:3000`.  You may implement your pages under the `pages/` directory and import the `supabase` client from `lib/supabase.js`.

### 3.3 Building and Exporting

To build a production bundle and export it to static files, run:

```sh
npm run build:static
```

This generates an `out/` directory containing HTML, JavaScript and assets.  Upload the **contents** of `out/` to your hosting provider’s document root (for example, `public_html` on SiteGround).  Do not upload the `out/` folder itself; only its contents.

## 4. Deploying on SiteGround

1.  Log into your SiteGround account and navigate to **Site Tools** for your domain or subdomain.
2.  Ensure SSL/TLS is configured via **Security → SSL Manager**.  Install a Let’s Encrypt certificate if necessary.
3.  Use the **File Manager** (or FTP/SFTP) to upload the contents of the `out/` directory to your `public_html` folder.  Delete any default `index.html` file that SiteGround may have created.
4.  Visit your domain in a browser to verify that the static site loads.  Forms and dynamic components should make requests to your Supabase functions and storage.

## 5. Admin and Client Features

* **Authentication** – Use Supabase Auth (email/password or third‑party providers) to allow clients and staff to sign up and log in.  The `users_profile` table stores profile metadata and roles.
* **Pets** – CRUD operations on the `pet` table allow clients to manage their pets.  Use row level security to ensure users can only access their own records.
* **Appointments** – When a client books an appointment, create a row in the `appointment` table.  Staff can view and update appointments.  Use the `available-slots` function to restrict choices to free time slots.
* **Payments** – Create an `invoice` row for each booking.  Call the `create-checkout-session` function to generate a Stripe Checkout session URL and redirect the client.  Use webhooks to mark invoices as paid when a session completes.
* **Gallery Uploads** – Clients upload images to your private `gallery` bucket via a signed URL from the `sign-upload` function.  Insert a row into `gallery_image` with status `PENDING`.  Admins approve or reject images; only `APPROVED` images are publicly visible.

## 6. Extending the Starter

This starter is intentionally minimal.  You should build out React components for your pages (services, adoption listings, blog, gallery, team, contact, admin dashboard, etc.), implement additional Supabase functions, and integrate more robust error handling and notifications (for example, with Resend or Postmark for email).  The table definitions and policies provided in `schema.sql` serve as a foundation; feel free to modify them to suit your specific requirements.
