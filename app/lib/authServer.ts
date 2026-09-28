'server only';

import { cookies } from 'next/headers';
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Client Supabase server-side legato ai cookie di sessione del browser.
 * Consente di verificare l'utente autenticato nei route handler.
 */
export function createServerClient() {
  const cookieStore = cookies();
  return createSSRClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chiamato durante la renderizzazione di una pagina Server Component:
          // il cookie può essere scritto solo in un Server Action o Route Handler.
        }
      }
    }
  });
}