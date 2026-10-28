import { cookies } from 'next/headers';
import { getAuthSecret } from '@/lib/auth-secret';
import { SESSION_COOKIE_NAME, verifySession, type SessionPayload } from '@/lib/session';

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token, getAuthSecret());
}

export function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  };
}
