/**
 * Contratos de estado da conversa (bootstrap).
 * agentPaused é DERIVADO — não existe campo persistido (data-model.md / architecture.md).
 */

export type ConversationStatus = 'WITH_AGENT' | 'WAITING_ANALYST' | 'WITH_ANALYST' | 'CLOSED';

export function isAgentPaused(status: ConversationStatus): boolean {
  return status === 'WAITING_ANALYST' || status === 'WITH_ANALYST';
}
