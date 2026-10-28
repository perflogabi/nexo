import { describe, expect, it } from 'vitest';
import { AuthError } from '@/domain/errors';
import { createAuthService, createInMemoryEmployeeDirectory } from '@/services/auth';

describe('AuthService demo', () => {
  const directory = createInMemoryEmployeeDirectory([
    {
      id: 'emp_ana',
      email: 'ana@nexo.local',
      name: 'Ana',
      role: 'EMPLOYEE',
      department: 'Engenharia',
    },
    {
      id: 'emp_analista',
      email: 'analista@nexo.local',
      name: 'Carla',
      role: 'ANALYST',
      department: 'Service Desk',
    },
  ]);
  const auth = createAuthService(directory);
  const secret = 'unit-secret';

  it('accepts any non-empty password for known email and returns server role', async () => {
    const result = await auth.login({
      email: 'Ana@Nexo.Local',
      password: 'qualquer-coisa',
      secret,
      nowSec: 1_700_000_000,
    });
    expect(result.employee.role).toBe('EMPLOYEE');
    expect(result.session.role).toBe('EMPLOYEE');
    expect(result.token.includes('.')).toBe(true);
  });

  it('rejects unknown email and empty password', async () => {
    await expect(
      auth.login({ email: 'x@nexo.local', password: 'x', secret }),
    ).rejects.toBeInstanceOf(AuthError);
    await expect(
      auth.login({ email: 'ana@nexo.local', password: '', secret }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});
