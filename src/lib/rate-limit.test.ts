import { afterEach, describe, expect, it } from 'vitest';
import {
  agentRateLimitConfig,
  clientIpFromRequest,
  consumeRateLimit,
  loginRateLimitConfig,
  resetRateLimitStore,
} from '@/lib/rate-limit';

describe('consumeRateLimit', () => {
  afterEach(() => {
    resetRateLimitStore();
  });

  it('permite até max hits na janela', () => {
    const key = 'test:a';
    const opts = { max: 3, windowMs: 60_000, now: 1_000 };
    expect(consumeRateLimit(key, opts).ok).toBe(true);
    expect(consumeRateLimit(key, { ...opts, now: 1_100 }).ok).toBe(true);
    expect(consumeRateLimit(key, { ...opts, now: 1_200 }).ok).toBe(true);
    const blocked = consumeRateLimit(key, { ...opts, now: 1_300 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('libera de novo após a janela', () => {
    const key = 'test:b';
    expect(consumeRateLimit(key, { max: 1, windowMs: 100, now: 0 }).ok).toBe(true);
    expect(consumeRateLimit(key, { max: 1, windowMs: 100, now: 50 }).ok).toBe(false);
    expect(consumeRateLimit(key, { max: 1, windowMs: 100, now: 101 }).ok).toBe(true);
  });
});

describe('clientIpFromRequest', () => {
  it('usa o primeiro IP de x-forwarded-for', () => {
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(clientIpFromRequest(req)).toBe('1.2.3.4');
  });
});

describe('config env', () => {
  it('lê limites de login/agent com defaults', () => {
    expect(loginRateLimitConfig({}).max).toBe(10);
    expect(agentRateLimitConfig({ RATE_LIMIT_AGENT_MAX: '5' }).max).toBe(5);
  });
});
