/**
 * Authz de conversa para rotas do analista (domain canAnalystAccessConversation).
 */

import { canAnalystAccessConversation } from '@/domain/authorization-scope';
import type { ConversationStatus } from '@/domain/types';

export function analystMayAccessConversation(input: {
  analystId: string;
  status: ConversationStatus;
  assignedAnalystId: string | null;
}): boolean {
  return canAnalystAccessConversation({
    analystId: input.analystId,
    role: 'ANALYST',
    status: input.status,
    assignedAnalystId: input.assignedAnalystId,
  });
}
