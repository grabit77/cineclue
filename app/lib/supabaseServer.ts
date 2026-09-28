'server only';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function isSupabaseServerReady(): boolean {
  return !!url && !!serviceKey;
}

/**
 * Client Supabase con service role key: da usare SOLO nei route handler.
 * Non importare mai questo modulo in componenti client.
 */
export function getSupabaseAdmin() {
  if (!isSupabaseServerReady()) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' })
    }
  });
}