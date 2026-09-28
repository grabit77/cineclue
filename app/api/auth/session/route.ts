import { NextResponse } from 'next/server';
import { createServerClient } from '@/app/lib/authServer';

export const dynamic = 'force-dynamic';

/**
 * Sincronizza la sessione Supabase (localStorage del browser) nei cookie
 * di sessione usati dai route handler server-side. Richiamata dal client
 * dopo un login con email/password, così /api/score riconosce l'utente.
 */
export async function POST(request: Request) {
  let body: { access_token?: unknown; refresh_token?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { access_token, refresh_token } = body;
  if (typeof access_token !== 'string' || typeof refresh_token !== 'string') {
    return NextResponse.json({ ok: false, error: 'Token mancanti' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}