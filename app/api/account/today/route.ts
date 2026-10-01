import { NextResponse } from 'next/server';
import { createServerClient } from '@/app/lib/authServer';
import { readAccountPlay } from '@/app/lib/scoreStore';
import { isValidPuzzleDate } from '@/app/lib/dates';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date');
  if (!date || !isValidPuzzleDate(date)) {
    return NextResponse.json({ error: 'Data non valida' }, { status: 400 });
  }

  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ played: false });

  try {
    const play = await readAccountPlay(user.id, date);
    if (!play) return NextResponse.json({ played: false });
    return NextResponse.json({ played: true, ...play });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
