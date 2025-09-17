# K9Cadet

This repository contains a static [Next.js](https://nextjs.org/) frontend that is designed to be exported as a set of static files and hosted on a traditional web host.  The dynamic portions of the application—authentication, database operations, file uploads, appointment scheduling, and payments—are powered by [Supabase](https://supabase.com) and [Stripe](https://stripe.com).

The goal of this starter is to provide a clear foundation for building a pet services website similar to the one described in the project brief.  You can deploy the static site to any host (such as SiteGround) while keeping your server‑side logic in Supabase Edge Functions.

## Contents

* `frontend/` – A minimal Next.js app configured for static export.  Update this folder to build your pages and connect to Supabase via the client SDK.
* `supabase/schema.sql` – SQL definitions for your database tables and row level security (RLS) policies.
* `supabase/functions/` – Example Supabase Edge Functions for payment checkout, signed uploads and appointment slot computation.  You should flesh these out to suit your business logic.
* `RUNBOOK.md` – A high‑level guide describing how to set up Supabase, deploy your Edge Functions, configure Stripe and host the exported site.

## Getting Started

1.  Clone this repository and install dependencies in the `frontend/` directory:

    ```sh
    cd frontend
    npm install
    ```

2.  Copy the example environment file and configure it with your Supabase and Stripe details:

    ```sh
    cp .env.example .env.local
    # then edit .env.local
    ```

3.  Build and export the site:

    ```sh
    npm run build:static
    ```

    The static files will be generated in the `out/` directory.  Upload these files to your web host.

4.  Create your database and tables in Supabase by running the SQL in `supabase/schema.sql` through the Supabase SQL editor.

5.  Deploy the Edge Functions in `supabase/functions/` using the Supabase CLI:

    ```sh
    supabase functions deploy create-checkout-session
    supabase functions deploy sign-upload
    supabase functions deploy available-slots
    ```

Refer to `RUNBOOK.md` for detailed instructions on each of these steps and suggestions for extending the starter.
