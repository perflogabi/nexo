/**
 * Escopo de autorização no domínio (funções puras de decisão).
 *
 * NÃO substitui checks obrigatórios no serviço de aplicação / handlers.
 * ownerEmployeeId governa privacidade do funcionário (E).
 * affectedEmployeeId NÃO concede acesso de owner (E/T).
 * Analista: tickets só do employeeId da conversa em contexto (I).
 *
 * Ver architecture.md §Autorização e data-model.md §8.
 */

import type { ConversationStatus, Role } from './types';

export type EmployeeTicketAccessInput = {
  employeeId: string;
  ownerEmployeeId: string;
  /** Presente só para deixar explícito que NÃO autoriza. */
  affectedEmployeeId?: string;
};

/** Funcionário só acessa tickets em que é owner. */
export function canEmployeeAccessTicket(input: EmployeeTicketAccessInput): boolean {
  return input.employeeId === input.ownerEmployeeId;
}

export type AnalystConversationAccessInput = {
  analystId: string;
  role: Role;
  status: ConversationStatus;
  assignedAnalystId: string | null;
};

/**
 * Analista (console / leitura):
 * - Fila: qualquer WAITING_ANALYST (claim atômico fica no serviço)
 * - Atendimento: WITH_ANALYST e assignedAnalystId = self
 * - Visão “Com o agent” / resolvidas: WITH_AGENT e CLOSED (somente leitura no console;
 *   mutações continuam restritas nas rotas de claim/return/close/send)
 */
export function canAnalystAccessConversation(input: AnalystConversationAccessInput): boolean {
  if (input.role !== 'ANALYST') return false;
  if (input.status === 'WAITING_ANALYST') return true;
  if (input.status === 'WITH_ANALYST' && input.assignedAnalystId === input.analystId) {
    return true;
  }
  if (input.status === 'WITH_AGENT' || input.status === 'CLOSED') return true;
  return false;
}

export type AnalystTicketAccessInput = {
  analystId: string;
  role: Role;
  /** employeeId dono da Conversation em contexto (obrigatório para escopo). */
  conversationEmployeeId: string | null;
  conversationStatus: ConversationStatus;
  assignedAnalystId: string | null;
  ticketOwnerEmployeeId: string;
};

/**
 * Analista só vê tickets do funcionário da conversa em contexto.
 * Sem conversa em contexto → negado (não lista a empresa inteira).
 */
export function canAnalystAccessTicket(input: AnalystTicketAccessInput): boolean {
  if (
    !canAnalystAccessConversation({
      analystId: input.analystId,
      role: input.role,
      status: input.conversationStatus,
      assignedAnalystId: input.assignedAnalystId,
    })
  ) {
    return false;
  }
  if (input.conversationEmployeeId == null) return false;
  return input.ticketOwnerEmployeeId === input.conversationEmployeeId;
}
