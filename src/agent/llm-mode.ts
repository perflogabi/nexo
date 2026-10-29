/**
 * CI e testes usam mock — nunca Gemini real sem chave explícita.
 * AGENT_LLM=mock|gemini força o modo; default: mock se CI ou sem GEMINI_API_KEY.
 */

import { getGeminiApiKey } from '@/lib/gemini-api-key';

export type AgentLlmMode = 'mock' | 'gemini';

export function resolveAgentLlmMode(
  env: Record<string, string | undefined> = process.env,
): AgentLlmMode {
  const forced = env.AGENT_LLM?.trim().toLowerCase();
  if (forced === 'mock') return 'mock';
  if (forced === 'gemini') return 'gemini';
  if (env.CI === 'true' || env.CI === '1') return 'mock';
  if (!getGeminiApiKey(env)) return 'mock';
  return 'gemini';
}
