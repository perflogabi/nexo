import { NextResponse, type NextRequest } from 'next/server';
import { homePathForRole, SESSION_COOKIE_NAME, verifySession } from '@/lib/session';

const PUBLIC_PATHS = new Set(['/login']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth/login')) return true;
  if (pathname.startsWith('/api/auth/logout')) return true;
  // assets
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token, secret);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', reason: 'UNAUTHENTICATED' } },
        { status: 401 },
      );
    }
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL(homePathForRole(session.role), request.url));
  }

  if (session.role === 'EMPLOYEE') {
    if (pathname.startsWith('/analyst') || pathname.startsWith('/api/analyst')) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  if (session.role === 'ANALYST') {
    if (
      pathname.startsWith('/chat') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/api/chat') ||
      pathname.startsWith('/api/conversations')
    ) {
      return NextResponse.redirect(new URL('/analyst', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
