/**
 * Tipos de domínio alinhados a memory-bank/data-model.md §7.
 * Independentes do Prisma — o schema espelha estes contratos.
 */

export type Role = 'EMPLOYEE' | 'ANALYST';

export type ConversationStatus = 'WITH_AGENT' | 'WAITING_ANALYST' | 'WITH_ANALYST' | 'CLOSED';

export type TransferReasonCode = 'USER_REQUEST' | 'CRITICAL' | 'OVERDUE' | 'LOW_CONFIDENCE';

export type TicketType = 'INC' | 'REQ';

export type Category = 'ACESSO' | 'REDE_VPN' | 'HARDWARE' | 'SOFTWARE' | 'EMAIL' | 'OUTROS';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TicketStatus =
  'OPEN' | 'WAITING_ANALYST' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'APPROVED';

export type PendingOperation = 'CREATE' | 'UPDATE' | 'REOPEN';

/** Domínios usados em isInTiScope — fora do enum Category do ticket. */
export type RequestDomain = 'TI' | 'RH' | 'FINANCEIRO' | 'FACILITIES' | 'OTHER_NON_TI';

/** Status “aberto” elegíveis a update por duplicidade (T). */
export const OPEN_TICKET_STATUSES: readonly TicketStatus[] = [
  'OPEN',
  'WAITING_ANALYST',
  'IN_PROGRESS',
] as const;

/** Status elegíveis a reopen por janela de 7 dias (E+T). APPROVED é hipótese separada. */
export const REOPEN_BASE_STATUSES: readonly TicketStatus[] = ['RESOLVED', 'CLOSED'] as const;
