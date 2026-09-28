import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'cineclue_admin';

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? '';
}

export function adminConfigured(): boolean {
  return adminPassword().length >= 8;
}

function expectedToken(): string {
  return createHmac('sha256', adminPassword()).update('cineclue-admin').digest('hex');
}

export function adminToken(): string {
  return expectedToken();
}

export function isAdminRequest(): boolean {
  if (!adminConfigured()) return false;
  const got = cookies().get(COOKIE)?.value ?? '';
  const expected = expectedToken();
  if (got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export const adminCookieName = COOKIE;
