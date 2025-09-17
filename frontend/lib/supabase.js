import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client configured with your project's public URL and anon key.
 *
 * The values for these environment variables are defined in `.env.local`.
 * See the Supabase docs for more information:
 * https://supabase.com/docs/guides/with-nextjs
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
