/**
 * Acesso controlado à chave Gemini — só servidor.
 * Nunca expor via NEXT_PUBLIC_* nem retornar em JSON de API.
 */

export function getGeminiApiKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const key = env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function assertGeminiApiKey(env: Record<string, string | undefined> = process.env): string {
  const key = getGeminiApiKey(env);
  if (!key) {
    throw new Error('GEMINI_API_KEY required for gemini brain');
  }
  return key;
}
