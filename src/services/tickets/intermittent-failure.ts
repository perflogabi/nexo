import { TicketServiceUnavailableError } from '@/domain/errors';

/**
 * Simula instabilidade do “legado” (PRD).
 * failureRate ∈ [0, 1]; 0 = estável (default produção/dev).
 */
export type IntermittentFailurePolicy = {
  maybeFail: () => void;
};

export function createIntermittentFailurePolicy(options: {
  failureRate?: number;
  random?: () => number;
}): IntermittentFailurePolicy {
  const rate = options.failureRate ?? 0;
  const random = options.random ?? Math.random;

  if (rate < 0 || rate > 1) {
    throw new Error('failureRate must be between 0 and 1');
  }

  return {
    maybeFail() {
      if (rate > 0 && random() < rate) {
        throw new TicketServiceUnavailableError();
      }
    },
  };
}
