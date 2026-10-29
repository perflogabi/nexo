/**
 * Rate limit em memória (sliding window) — MVP para login e turnos do agent.
 * Em serverless multi-instância o contador não é global; documentado como hipótese.
 * Sem Redis (evitar dependência extra nesta fase).
 */

export type RateLimitResult =
  { ok: true; remaining: number } | { ok: false; retryAfterSec: number; remaining: number };

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Máximo de eventos na janela. */
  max: number;
  /** Janela em ms. */
  windowMs: number;
  /** Agora (testes). */
  now?: number;
};

function prune(timestamps: number[], windowStart: number): number[] {
  return timestamps.filter((t) => t > windowStart);
}

/**
 * Registra um hit. Retorna ok=false quando o limite foi excedido (hit não conta).
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const windowStart = now - options.windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = prune(bucket.timestamps, windowStart);

  if (bucket.timestamps.length >= options.max) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: Math.max(0, options.max - bucket.timestamps.length) };
}

/** Só para testes. */
export function resetRateLimitStore(): void {
  buckets.clear();
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Login: default 10 / 60s por IP. */
export function loginRateLimitConfig(
  env: Record<string, string | undefined> = process.env,
): RateLimitOptions {
  return {
    max: readPositiveInt(env.RATE_LIMIT_LOGIN_MAX, 10),
    windowMs: readPositiveInt(env.RATE_LIMIT_LOGIN_WINDOW_MS, 60_000),
  };
}

/** Turno do agent (POST messages / confirm): default 30 / 60s por usuário+IP. */
export function agentRateLimitConfig(
  env: Record<string, string | undefined> = process.env,
): RateLimitOptions {
  return {
    max: readPositiveInt(env.RATE_LIMIT_AGENT_MAX, 30),
    windowMs: readPositiveInt(env.RATE_LIMIT_AGENT_WINDOW_MS, 60_000),
  };
}
