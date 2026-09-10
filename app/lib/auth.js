import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'dw_admin_session';

function digest(value) {
  return createHash('sha256').update(value || '').digest('hex');
}

export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value || '';
  const expected = digest(`david-writes:${password}`);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function signIn(password) {
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  if (!expectedPassword || password !== expectedPassword) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, digest(`david-writes:${expectedPassword}`), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });
  return true;
}

export async function signOut() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
