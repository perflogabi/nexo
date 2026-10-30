import { cookies } from 'next/headers';
import { getAuthSecret } from '@/lib/auth-secret';
import { SESSION_COOKIE_NAME, verifySession, type SessionPayload } from '@/lib/session';

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token, getAuthSecret());
}

export function sessionCookieOptions(maxAgeSec: number) {
  // Secure só em deploy real (NEXO_ENV=production). E2E/demo usam http://localhost.
  const secure =
    process.env.COOKIE_SECURE === '1' ||
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NEXO_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: maxAgeSec,
  };
}
