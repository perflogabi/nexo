/**
 * Evita vazar GEMINI_API_KEY / AUTH_SECRET em logs e mensagens de erro.
 * Chaves só existem em env no servidor — nunca em NEXT_PUBLIC_*.
 */

export function redactSecrets(
  text: string,
  env: Record<string, string | undefined> = process.env,
): string {
  let out = text;
  for (const name of ['GEMINI_API_KEY', 'AUTH_SECRET', 'DATABASE_URL', 'DIRECT_URL'] as const) {
    const value = env[name]?.trim();
    if (!value || value.length < 8) continue;
    out = out.split(value).join(`[REDACTED_${name}]`);
  }
  return out;
}

/** Mensagem segura para log (nunca inclui o valor cru da chave). */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return redactSecrets(error.message);
  return redactSecrets(String(error));
}
