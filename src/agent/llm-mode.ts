/**
 * Resolução do modo do agent.
 *
 * - Produção (NEXO_ENV=production ou NODE_ENV=production sem NEXO_ENV demo/dev/test/e2e):
 *   apenas gemini; AGENT_LLM=mock é rejeitado.
 * - test | e2e | development | demo: AGENT_LLM=mock|gemini explícito; default mock sem chave.
 * - Sem fallback silencioso Gemini→mock (ver create-brain).
 */

import { getGeminiApiKey } from '@/lib/gemini-api-key';

export type AgentLlmMode = 'mock' | 'gemini';

export type NexoRuntimeEnv = 'production' | 'development' | 'demo' | 'test' | 'e2e';

const NON_PROD = new Set(['development', 'demo', 'test', 'e2e']);

export class AgentLlmConfigError extends Error {
  readonly code = 'AGENT_LLM_CONFIG';
  constructor(message: string) {
    super(message);
    this.name = 'AgentLlmConfigError';
  }
}

export function resolveNexoRuntimeEnv(
  env: Record<string, string | undefined> = process.env,
): NexoRuntimeEnv {
  const explicit = env.NEXO_ENV?.trim().toLowerCase();
  if (
    explicit === 'production' ||
    explicit === 'development' ||
    explicit === 'demo' ||
    explicit === 'test' ||
    explicit === 'e2e'
  ) {
    return explicit;
  }
  if (env.NODE_ENV === 'test') return 'test';
  if (env.NODE_ENV === 'production') return 'production';
  return 'development';
}

export function isProductionRuntime(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return resolveNexoRuntimeEnv(env) === 'production';
}

/**
 * Resolve o modo LLM. Em produção, mock é sempre rejeitado.
 */
export function resolveAgentLlmMode(
  env: Record<string, string | undefined> = process.env,
): AgentLlmMode {
  const runtime = resolveNexoRuntimeEnv(env);
  const forced = env.AGENT_LLM?.trim().toLowerCase();

  if (runtime === 'production') {
    if (forced === 'mock') {
      throw new AgentLlmConfigError(
        'AGENT_LLM=mock não é permitido em produção (NEXO_ENV/NODE_ENV=production).',
      );
    }
    if (forced === 'gemini' || forced === undefined || forced === '') {
      if (!getGeminiApiKey(env)) {
        throw new AgentLlmConfigError(
          'Produção exige GEMINI_API_KEY quando AGENT_LLM=gemini (ou omitido).',
        );
      }
      return 'gemini';
    }
    throw new AgentLlmConfigError(`AGENT_LLM inválido em produção: ${forced}`);
  }

  // Ambientes autorizados para mock (dev/demo/test/e2e)
  if (!NON_PROD.has(runtime)) {
    throw new AgentLlmConfigError(`NEXO_ENV não suportado: ${runtime}`);
  }

  if (forced === 'mock') return 'mock';
  if (forced === 'gemini') {
    if (!getGeminiApiKey(env)) {
      throw new AgentLlmConfigError('AGENT_LLM=gemini exige GEMINI_API_KEY.');
    }
    return 'gemini';
  }

  // Default não-produção: mock se CI ou sem chave
  if (env.CI === 'true' || env.CI === '1') return 'mock';
  if (!getGeminiApiKey(env)) return 'mock';
  return 'gemini';
}
