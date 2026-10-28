import { NextResponse } from 'next/server';
import { AuthError } from '@/domain/errors';
import { getAuthSecret } from '@/lib/auth-secret';
import { getAuthService } from '@/lib/services';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/session';
import { sessionCookieOptions } from '@/lib/server-session';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

    const auth = getAuthService();
    const result = await auth.login({
      email,
      password,
      secret: getAuthSecret(),
    });

    const response = NextResponse.json({
      employee: {
        id: result.employee.id,
        email: result.employee.email,
        name: result.employee.name,
        role: result.employee.role,
        department: result.employee.department,
      },
    });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      result.token,
      sessionCookieOptions(SESSION_TTL_SECONDS),
    );
    return response;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { error: { code: e.code, reason: e.reason, message: e.message } },
        { status: 401 },
      );
    }
    throw e;
  }
}
