import { NextResponse } from 'next/server';
import { createServerClient } from '@/app/lib/authServer';
import { isGuestId, parseWins, saveAccountWins, saveGuestWins } from '@/app/lib/scoreStore';
import { isSupabaseServerReady } from '@/app/lib/supabaseServer';
import type { DatedWin } from '@/app/lib/scoreStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSupabaseServerReady()) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 503 });
  }

  let body: { date?: unknown; attempts?: unknown; won?: unknown; wins?: unknown; guestId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const wins: DatedWin[] = parseWins(body.wins);
  if (wins.length === 0 && body.won !== false && typeof body.date === 'string') {
    const single = parseWins([{ date: body.date, attempts: Number(body.attempts) }]);
    wins.push(...single);
  }
  if (body.won === false || wins.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  try {
    if (user) {
      const meta = user.user_metadata ?? {};
      const fromMeta = (meta.username ?? meta.full_name ?? meta.name) as string | undefined;
      await saveAccountWins(user.id, typeof fromMeta === 'string' ? fromMeta : null, wins);
    } else if (isGuestId(body.guestId)) {
      await saveGuestWins(body.guestId, wins);
    } else {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
