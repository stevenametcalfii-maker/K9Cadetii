//
// create-checkout-session edge function
//
// This function receives a JSON payload containing an `invoice_id` and
// returns a Stripe Checkout Session URL for the client to complete
// payment.  The implementation here is intentionally minimal; you
// should extend it to validate the invoice and amount, create or
// retrieve a product in Stripe, and handle errors appropriately.

import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';
import Stripe from 'https://esm.sh/stripe?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js?target=deno';

// Pull secrets from the environment
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { invoice_id } = await req.json();
  if (!invoice_id) {
    return new Response(JSON.stringify({ error: 'Missing invoice_id' }), { status: 400 });
  }

  // Fetch invoice details from Supabase
  const { data: invoice, error } = await supabase
    .from('invoice')
    .select('id, amount_cents, currency')
    .eq('id', invoice_id)
    .single();
  if (error || !invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
  }

  try {
    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: invoice.currency,
            product_data: { name: `Invoice ${invoice.id}` },
            unit_amount: invoice.amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/client/payments?success=1`,
      cancel_url: `${SITE_URL}/client/payments?cancelled=1`,
      metadata: { invoice_id: invoice.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), { status: 500 });
  }
});
