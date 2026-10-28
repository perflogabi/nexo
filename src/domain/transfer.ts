/**
 * Transferência agent ↔ analista e matriz de transições de Conversation.status.
 *
 * Motivos (I a partir do Anexo A): USER_REQUEST · CRITICAL · OVERDUE · LOW_CONFIDENCE
 * Score do LLM NÃO é critério único (requirements-resolution.md §2.1).
 * agentPaused permanece derivado — ver conversation-status.ts.
 *
 * Limpar transferSummary ao devolver = **Hipótese (H)** — não decidido aqui.
 */

import type { ConversationStatus, Priority, TransferReasonCode } from './types';
import { isOverdue } from './sla';

export type TransferSignals = {
  /** Pedido explícito do funcionário (intent / quick reply). */
  userRequestedTransfer?: boolean;
  /** Prioridade do chamado em contexto; CRITICAL dispara transferência. */
  priority?: Priority | null;
  slaDeadlineAt?: Date | null;
  now?: Date;
  /**
   * Sinais determinísticos de policy (intent ambíguo, tools conflitantes,
   * falha repetida, requiresHuman, etc.). Sem isso, modelConfidence sozinho NÃO transfere.
   */
  deterministicLowConfidence?: boolean;
  /**
   * Score interno do modelo (0–1). Auxiliar apenas.
   * HIPÓTESE: limiar opcional LOW_CONFIDENCE_SCORE_MAX — nunca sozinho.
   */
  modelConfidence?: number | null;
  /**
   * HIPÓTESE (H): limiar auxiliar; só conta se deterministicLowConfidence já for true
   * OU se `allowModelConfidenceAlone` (default false — não usar sozinho).
   */
  lowConfidenceScoreMax?: number;
  allowModelConfidenceAlone?: boolean;
};

export type TransferDecision =
  { transfer: false } | { transfer: true; reasonCode: TransferReasonCode };

/**
 * Ordem de precedência quando vários sinais batem (T):
 * USER_REQUEST > CRITICAL > OVERDUE > LOW_CONFIDENCE
 */
export function shouldTransfer(signals: TransferSignals): TransferDecision {
  if (signals.userRequestedTransfer) {
    return { transfer: true, reasonCode: 'USER_REQUEST' };
  }

  if (signals.priority === 'CRITICAL') {
    return { transfer: true, reasonCode: 'CRITICAL' };
  }

  const now = signals.now ?? new Date();
  if (signals.slaDeadlineAt != null && isOverdue(signals.slaDeadlineAt, now)) {
    return { transfer: true, reasonCode: 'OVERDUE' };
  }

  const scoreMax = signals.lowConfidenceScoreMax ?? 0.4;
  const scoreAlone =
    (signals.allowModelConfidenceAlone ?? false) &&
    signals.modelConfidence != null &&
    Number.isFinite(signals.modelConfidence) &&
    signals.modelConfidence <= scoreMax;

  if (signals.deterministicLowConfidence || scoreAlone) {
    return { transfer: true, reasonCode: 'LOW_CONFIDENCE' };
  }

  // Score baixo isolado → NÃO transfere (evita falso positivo do LLM).
  return { transfer: false };
}

/** Matriz válida data-model.md §2.2 (T alinhado ao PRD). */
const VALID_TRANSITIONS: ReadonlyArray<readonly [ConversationStatus, ConversationStatus]> = [
  ['WITH_AGENT', 'WAITING_ANALYST'],
  ['WITH_AGENT', 'CLOSED'],
  ['WAITING_ANALYST', 'WITH_ANALYST'],
  ['WAITING_ANALYST', 'WITH_AGENT'],
  ['WAITING_ANALYST', 'CLOSED'],
  ['WITH_ANALYST', 'WITH_AGENT'],
  ['WITH_ANALYST', 'CLOSED'],
];

export function canTransitionConversation(
  from: ConversationStatus,
  to: ConversationStatus,
): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS.some(([a, b]) => a === from && b === to);
}

export type TransferTransitionRequirements = {
  requiresTransferSummary: boolean;
  assignedAnalystIdMustBeNull: boolean;
};

/** Invariantes ao entrar em WAITING_ANALYST (E/T). */
export function transferTransitionRequirements(
  to: ConversationStatus,
): TransferTransitionRequirements {
  if (to === 'WAITING_ANALYST') {
    return { requiresTransferSummary: true, assignedAnalystIdMustBeNull: true };
  }
  return { requiresTransferSummary: false, assignedAnalystIdMustBeNull: false };
}
