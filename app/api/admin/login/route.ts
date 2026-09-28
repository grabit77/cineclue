import { NextResponse } from 'next/server';
import { adminConfigured, adminCookieName, adminPassword, adminToken } from '@/app/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Imposta ADMIN_PASSWORD in .env.local (almeno 8 caratteri) e riavvia il server.' },
      { status: 503 }
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.password !== adminPassword()) {
    return NextResponse.json({ error: 'Password non corretta.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, adminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });
  return response;
}
