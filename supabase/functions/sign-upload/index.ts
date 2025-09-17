//
// sign-upload edge function
//
// This function generates a unique storage path for a client to upload a file
// into a private bucket (e.g. `gallery` or `pet-avatars`).  In a complete
// implementation you would verify the user's identity and generate a
// signed upload URL via the Supabase Storage API.  For simplicity this
// version merely returns a path for the client to use with the Supabase
// JS client; access is controlled by bucket policies and RLS.

import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { bucket, file_extension, pet_id } = await req.json();
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'Missing bucket' }), { status: 400 });
  }

  // Extract the JWT from the Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Get the user ID from the JWT using the service role key
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Generate a random filename
  const ext = file_extension ? `.${file_extension.replace(/^[.]/, '')}` : '';
  const filename = crypto.randomUUID() + ext;
  const path = `${bucket}/${user.id}/${filename}`;

  // In a real implementation you would call supabase.storage.createSignedUploadUrl
  // and return the signed URL along with the path.
  return new Response(JSON.stringify({ path }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
