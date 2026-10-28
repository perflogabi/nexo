import { NextResponse } from 'next/server';
import { AuthError } from '@/domain/errors';
import { getAuthService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'UNAUTHENTICATED' } },
      { status: 401 },
    );
  }

  const employee = await getAuthService().getSessionEmployee(session);
  if (!employee) {
    throw new AuthError('UNAUTHENTICATED');
  }

  return NextResponse.json({
    employee: {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      department: employee.department,
    },
  });
}
