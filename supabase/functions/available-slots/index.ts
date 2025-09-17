//
// available-slots edge function
//
// A placeholder function that returns a list of available appointment slots
// for a given service and date.  In a real implementation you would
// consult the `staff_availability` and existing `appointment` rows in
// your database to compute open times.

import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { service_id, date } = await req.json();
  if (!service_id || !date) {
    return new Response(JSON.stringify({ error: 'Missing service_id or date' }), { status: 400 });
  }

  // TODO: Query staff availability and appointments to compute slots
  // This placeholder returns a set of half‑hour slots between 09:00 and 17:00
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 17;
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return new Response(JSON.stringify({ slots }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
