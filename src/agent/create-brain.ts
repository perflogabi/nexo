/**
 * Cria o brain do agent conforme resolveAgentLlmMode.
 * - mock: apenas mock (E2E / demo / CI).
 * - gemini: apenas Gemini — sem fallback silencioso para mock.
 */

import { resolveAgentLlmMode } from '@/agent/llm-mode';
import { createMockAgentBrain } from '@/agent/mock-brain';
import type { AgentBrain, AgentReplyDraft, AgentTurnInput } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import { safeErrorMessage } from '@/lib/redact-secrets';

/** Tempo máximo para a cadeia Gemini. */
const DEFAULT_GEMINI_TIMEOUT_MS = 20_000;

function geminiTimeoutMs(env: Record<string, string | undefined> = process.env): number {
  const raw = env.GEMINI_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_GEMINI_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GEMINI_TIMEOUT_MS;
}

function isUsableReply(draft: AgentReplyDraft): boolean {
  return Boolean(draft.content?.trim());
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class AgentLlmUnavailableError extends Error {
  readonly code = 'AGENT_LLM_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'AgentLlmUnavailableError';
  }
}

/**
 * Brain Gemini sem fallback para mock.
 * @deprecated Prefer createAgentBrain — mantido só para testes unitários do caminho Gemini.
 */
export function createGeminiOnlyBrain(
  getContext: () => AgentToolContext,
  options?: { timeoutMs?: number },
): AgentBrain {
  const timeoutMs = options?.timeoutMs ?? geminiTimeoutMs();

  return {
    async generateReply(input: AgentTurnInput): Promise<AgentReplyDraft> {
      try {
        const { createGeminiAgentBrain } = await import('@/agent/gemini-brain');
        const gemini = createGeminiAgentBrain(getContext);
        const draft = await withTimeout(gemini.generateReply(input), timeoutMs, 'gemini');
        if (!isUsableReply(draft)) {
          throw new AgentLlmUnavailableError('Gemini devolveu resposta vazia.');
        }
        return draft;
      } catch (e) {
        if (e instanceof AgentLlmUnavailableError) throw e;
        const reason = safeErrorMessage(e) || 'gemini_error';
        throw new AgentLlmUnavailableError(`Gemini indisponível: ${reason}`);
      }
    },
  };
}

/** @deprecated Use createGeminiOnlyBrain — nome antigo removido do fallback. */
export const createGeminiWithMockFallbackBrain = createGeminiOnlyBrain;

export function createAgentBrain(getContext: () => AgentToolContext): AgentBrain {
  const mode = resolveAgentLlmMode();
  if (mode === 'mock') {
    return createMockAgentBrain(getContext);
  }
  return createGeminiOnlyBrain(getContext);
}
