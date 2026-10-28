/**
 * Contratos de estado da conversa.
 * agentPaused é DERIVADO — não existe campo persistido (data-model.md / architecture.md).
 */

import type { ConversationStatus } from './types';

export type { ConversationStatus };

export function isAgentPaused(status: ConversationStatus): boolean {
  return status === 'WAITING_ANALYST' || status === 'WITH_ANALYST';
}
