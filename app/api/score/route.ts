import { NextResponse } from 'next/server';
import { createServerClient } from '@/app/lib/authServer';
import { isGuestId, parseWins, saveAccountPlay, saveAccountWins, saveGuestWins } from '@/app/lib/scoreStore';
import { isSupabaseServerReady } from '@/app/lib/supabaseServer';
import type { DatedWin } from '@/app/lib/scoreStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSupabaseServerReady()) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 503 });
  }

  let body: {
    date?: unknown;
    attempts?: unknown;
    won?: unknown;
    outcome?: unknown;
    wins?: unknown;
    guestId?: unknown;
    guesses?: unknown;
  };
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
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const username = (() => {
    const meta = user?.user_metadata ?? {};
    const fromMeta = (meta.username ?? meta.full_name ?? meta.name) as string | undefined;
    return typeof fromMeta === 'string' ? fromMeta : null;
  })();

  const outcome =
    body.outcome === 'playing' || body.outcome === 'won' || body.outcome === 'lost' ? body.outcome : null;

  if (
    user &&
    outcome &&
    outcome !== 'won' &&
    typeof body.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.date)
  ) {
    const attempts = Number(body.attempts);
    if (Number.isInteger(attempts) && attempts >= 1 && attempts <= 6) {
      try {
        await saveAccountPlay(user.id, username, {
          date: body.date,
          outcome,
          attempts,
          guesses: body.guesses
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Errore sconosciuto';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (wins.length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (user) {
      await saveAccountWins(user.id, username, wins);
      for (const win of wins) {
        await saveAccountPlay(user.id, username, {
          date: win.date,
          outcome: 'won',
          attempts: win.attempts,
          guesses: win.date === body.date ? body.guesses : []
        });
      }
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
