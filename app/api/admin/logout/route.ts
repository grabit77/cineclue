import { NextResponse } from 'next/server';
import { adminCookieName } from '@/app/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
