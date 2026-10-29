import { NextResponse } from 'next/server';

export function rateLimitedResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisições. Tente novamente em instantes.',
        retryAfterSec,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
