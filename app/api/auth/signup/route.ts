import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { ANON_USERNAME } from '@/app/lib/scoreStore';
import { getSupabaseAdmin, isSupabaseServerReady } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function displayNameFrom(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 24) return null;
  if (name.includes('@')) return null;
  if (name.toLowerCase() === ANON_USERNAME.toLowerCase()) return null;
  return name;
}

async function findUserByEmail(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string
): Promise<User | null> {
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function POST(request: Request) {
  if (!isSupabaseServerReady()) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown; displayName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName = displayNameFrom(body.displayName);
  if (!displayName) {
    return NextResponse.json(
      { error: 'Scegli un nome da 2 a 24 caratteri, senza usare l’email.' },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Email non valida.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La password deve avere almeno 6 caratteri.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase non configurato' }, { status: 503 });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: displayName, full_name: displayName }
  });

  if (!created.error && created.data.user) {
    await admin.from('users').upsert({ id: created.data.user.id, username: displayName }, { onConflict: 'id' });
    return NextResponse.json({ ok: true });
  }

  const message = created.error?.message ?? '';
  const alreadyExists = /already|registered|exists/i.test(message);
  if (!alreadyExists) {
    return NextResponse.json({ error: message || 'Registrazione non riuscita.' }, { status: 400 });
  }

  try {
    const existing = await findUserByEmail(admin, email);
    if (!existing) {
      return NextResponse.json(
        { error: 'Esiste già un account con questa email. Prova ad accedere.' },
        { status: 409 }
      );
    }
    if (existing.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Esiste già un account con questa email. Prova ad accedere.' },
        { status: 409 }
      );
    }
    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { username: displayName, full_name: displayName }
    });
    if (updated.error) {
      return NextResponse.json({ error: updated.error.message }, { status: 400 });
    }
    await admin.from('users').upsert({ id: existing.id, username: displayName }, { onConflict: 'id' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const text = err instanceof Error ? err.message : 'Registrazione non riuscita.';
    return NextResponse.json({ error: text }, { status: 500 });
  }
}
