import type { APIRequestContext, Page } from '@playwright/test';
import { request as playwrightRequest } from '@playwright/test';

let loginSeq = 0;

/** IP TEST-NET distinto por login — evita 429 do rate limit em memória. */
function nextLoginIp(): string {
  loginSeq += 1;
  const n = loginSeq % 200;
  return `203.0.113.${(n % 200) + 1}`;
}

export async function loginViaUi(page: Page, email: string, password = 'demo') {
  await page.goto('/login');
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/^senha$/i).fill(password);
  // Aguardar navegação junto com o clique — evita corrida se o teste fizer goto em seguida.
  await Promise.all([
    page.waitForURL(/\/(chat|analyst)(\/|$|\?)/),
    page.getByRole('button', { name: /^entrar$/i }).click(),
  ]);
}

/**
 * Login API em contexto isolado (cookie jar próprio).
 * Retorna o context autenticado — use-o nas chamadas seguintes.
 */
export async function loginApiContext(
  email: string,
  password = 'demo',
): Promise<APIRequestContext> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
  const ctx = await playwrightRequest.newContext({ baseURL });
  const res = await ctx.post('/api/auth/login', {
    data: { email, password },
    headers: { 'X-Forwarded-For': nextLoginIp() },
  });
  if (!res.ok()) {
    const text = await res.text();
    await ctx.dispose();
    throw new Error(`login failed ${res.status()} ${text}`);
  }
  return ctx;
}

/** @deprecated prefer loginApiContext — mantido para specs simples de um usuário */
export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password = 'demo',
): Promise<void> {
  const res = await request.post('/api/auth/login', {
    data: { email, password },
    headers: { 'X-Forwarded-For': nextLoginIp() },
  });
  if (!res.ok()) {
    throw new Error(`login failed ${res.status()} ${await res.text()}`);
  }
}
