/**
 * Sessão demo assinada (HMAC-SHA256) — compatível com Edge middleware (Web Crypto).
 * Payload: employeeId + role (+ email/name). Qualquer senha no login; sem passwordHash.
 */

import type { Role } from '@/domain/types';

export const SESSION_COOKIE_NAME = 'nexo_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type SessionPayload = {
  employeeId: string;
  role: Role;
  email: string;
  name: string;
  exp: number; // unix seconds
};

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]!);
  const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(arr).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const b64 = padded + pad;
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(
  payload: Omit<SessionPayload, 'exp'> & { exp?: number },
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  if (!secret) throw new Error('AUTH_SECRET is required');
  const body: SessionPayload = {
    ...payload,
    exp: payload.exp ?? nowSec + SESSION_TTL_SECONDS,
  };
  const bodyPart = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bodyPart));
  return `${bodyPart}.${toBase64Url(sig)}`;
}

export async function verifySession(
  token: string | undefined | null,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  const [bodyPart, sigPart] = token.split('.');
  if (!bodyPart || !sigPart) return null;

  const key = await importHmacKey(secret);
  const signature = fromBase64Url(sigPart);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    signature.buffer.slice(
      signature.byteOffset,
      signature.byteOffset + signature.byteLength,
    ) as ArrayBuffer,
    new TextEncoder().encode(bodyPart),
  );
  if (!ok) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(bodyPart));
    const payload = JSON.parse(json) as SessionPayload;
    if (
      typeof payload.employeeId !== 'string' ||
      (payload.role !== 'EMPLOYEE' && payload.role !== 'ANALYST') ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    if (payload.exp < nowSec) return null;
    return payload;
  } catch {
    return null;
  }
}

export function homePathForRole(role: Role): string {
  return role === 'ANALYST' ? '/analyst' : '/chat';
}
