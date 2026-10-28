import { describe, expect, it } from 'vitest';
import { homePathForRole, signSession, verifySession } from '@/lib/session';

describe('session HMAC', () => {
  const secret = 'test-secret-for-unit';

  it('signs and verifies payload', async () => {
    const token = await signSession(
      {
        employeeId: 'emp-a',
        role: 'EMPLOYEE',
        email: 'ana@nexo.local',
        name: 'Ana',
      },
      secret,
      1_700_000_000,
    );
    const session = await verifySession(token, secret, 1_700_000_000);
    expect(session).toMatchObject({
      employeeId: 'emp-a',
      role: 'EMPLOYEE',
      email: 'ana@nexo.local',
    });
  });

  it('rejects tampered token and expired session', async () => {
    const token = await signSession(
      {
        employeeId: 'emp-a',
        role: 'EMPLOYEE',
        email: 'ana@nexo.local',
        name: 'Ana',
        exp: 1_700_000_100,
      },
      secret,
      1_700_000_000,
    );
    expect(await verifySession(token + 'x', secret, 1_700_000_000)).toBeNull();
    expect(await verifySession(token, secret, 1_700_000_200)).toBeNull();
  });

  it('maps role homes', () => {
    expect(homePathForRole('EMPLOYEE')).toBe('/chat');
    expect(homePathForRole('ANALYST')).toBe('/analyst');
  });
});
