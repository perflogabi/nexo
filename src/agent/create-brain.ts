/**
 * Preferência: Gemini (@google/genai). Se falhar/timeout/sem resposta → mock.
 * CI / AGENT_LLM=mock: só mock (sem rede).
 */

import { resolveAgentLlmMode } from '@/agent/llm-mode';
import { createMockAgentBrain } from '@/agent/mock-brain';
import type { AgentBrain, AgentReplyDraft, AgentTurnInput } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import { safeErrorMessage } from '@/lib/redact-secrets';

/** Tempo para a cadeia de modelos + tools; depois cai no mock. */
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

/**
 * Gemini primeiro; qualquer falha/timeout/resposta vazia → mock no mesmo turno.
 */
export function createGeminiWithMockFallbackBrain(
  getContext: () => AgentToolContext,
  options?: { timeoutMs?: number; onFallback?: (reason: string) => void },
): AgentBrain {
  const mock = createMockAgentBrain(getContext);
  const timeoutMs = options?.timeoutMs ?? geminiTimeoutMs();

  return {
    async generateReply(input: AgentTurnInput): Promise<AgentReplyDraft> {
      // Seleção da lista de chamados: mock determinístico (card + quick replies).
      if (
        /\b(?:INC|REQ)-\d+\b/i.test(input.employeeMessage) &&
        input.employeeMessage.includes('·')
      ) {
        return mock.generateReply(input);
      }
      try {
        const { createGeminiAgentBrain } = await import('@/agent/gemini-brain');
        const gemini = createGeminiAgentBrain(getContext);
        const draft = await withTimeout(gemini.generateReply(input), timeoutMs, 'gemini');
        if (!isUsableReply(draft)) {
          options?.onFallback?.('empty_reply');
          return mock.generateReply(input);
        }
        return draft;
      } catch (e) {
        const reason = safeErrorMessage(e) || 'gemini_error';
        options?.onFallback?.(reason);
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[agent] Gemini indisponível — usando mock:', reason);
        }
        return mock.generateReply(input);
      }
    },
  };
}

export function createAgentBrain(getContext: () => AgentToolContext): AgentBrain {
  const mode = resolveAgentLlmMode();
  if (mode === 'mock') {
    return createMockAgentBrain(getContext);
  }
  // gemini (default com chave): tenta Gemini e cai no mock se não responder
  return createGeminiWithMockFallbackBrain(getContext);
}
