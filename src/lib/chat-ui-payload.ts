/**
 * Payloads estruturados da mensagem AGENT → componentes do /chat
 * (TicketSelectList / TicketDetailCard / TicketDraftCard), sem markdown cru.
 *
 * Módulo neutro (sem Gemini/env) — seguro para import no client.
 */

import type { TicketSelectItem } from '@/components/chat/TicketSelectList';
import type { TicketStatus, TicketStatusTone } from '@/components/chat/ticket-status';
import type { Category, PendingOperation, Priority, TicketType } from '@/domain/types';
import type { TicketRecord } from '@/services/tickets/types';

export type TicketSelectPayload = {
  type: 'ticket_select';
  items: TicketSelectItem[];
};

export type TicketDetailPayload = {
  type: 'ticket_detail';
  number: string;
  status: TicketStatus;
  title: string;
  description: string;
  meta: {
    category: string;
    priority: string;
    openedAt: string;
    lastUpdateHighlight: string;
    lastUpdateRest: string;
  };
  quickReplies?: string[];
};

export type TicketDraftPayloadUi = {
  type: 'ticket_draft';
  operation: PendingOperation;
  headerLabel: string;
  status: TicketStatus;
  title: string;
  description: string;
  meta: {
    type: string;
    category: string;
    priority: string;
  };
  confirmationToken: string;
  expiresAt: string;
};

export type AgentChatUiPayload = TicketSelectPayload | TicketDetailPayload | TicketDraftPayloadUi;

const CATEGORY_LABEL: Record<string, string> = {
  ACESSO: 'Acesso',
  REDE_VPN: 'Rede › VPN',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  EMAIL: 'E-mail',
  OUTROS: 'Outros',
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const TYPE_LABEL: Record<string, string> = {
  INC: 'Incidente',
  REQ: 'Requisição',
};

const OPERATION_HEADER: Record<PendingOperation, string> = {
  CREATE: 'Novo chamado • Rascunho',
  UPDATE: 'Atualizar chamado • Rascunho',
  REOPEN: 'Reabrir chamado • Rascunho',
};

function statusUi(status: string): TicketStatus {
  switch (status) {
    case 'WAITING_ANALYST':
      return { label: 'Aguardando analista', tone: 'waiting' };
    case 'IN_PROGRESS':
    case 'OPEN':
      return { label: status === 'OPEN' ? 'Aberto' : 'Em andamento', tone: 'progress' };
    case 'APPROVED':
      return { label: 'Aprovado', tone: 'approved' };
    case 'RESOLVED':
    case 'CLOSED':
      return { label: status === 'RESOLVED' ? 'Resolvido' : 'Encerrado', tone: 'neutral' };
    default:
      return { label: status, tone: 'neutral' as TicketStatusTone };
  }
}

function dateLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace(/\./g, '').trim();
  return `${day} ${month}`;
}

export function mapTicketsToSelectPayload(tickets: TicketRecord[]): TicketSelectPayload {
  const items: TicketSelectItem[] = tickets.map((t) => ({
    id: t.id,
    number: t.number,
    title: t.title,
    status: statusUi(t.status),
    dateLabel: dateLabel(t.createdAt),
  }));
  return { type: 'ticket_select', items };
}

export function mapTicketToDetailPayload(ticket: TicketRecord): TicketDetailPayload {
  const opened = ticket.createdAt;
  const updated = ticket.updatedAt;
  const days = Math.max(0, Math.floor((Date.now() - updated.getTime()) / (24 * 60 * 60 * 1000)));
  return {
    type: 'ticket_detail',
    number: ticket.number,
    status: statusUi(ticket.status),
    title: ticket.title,
    description: ticket.description,
    meta: {
      category: CATEGORY_LABEL[ticket.category] ?? ticket.category,
      priority: PRIORITY_LABEL[ticket.priority] ?? ticket.priority,
      openedAt: opened.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      lastUpdateHighlight: days === 0 ? 'hoje' : `há ${days} dia${days > 1 ? 's' : ''}`,
      lastUpdateRest: '',
    },
  };
}

export function mapTicketDraftPayload(input: {
  operation: PendingOperation;
  type: TicketType;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  confirmationToken: string;
  expiresAt: string;
}): TicketDraftPayloadUi {
  return {
    type: 'ticket_draft',
    operation: input.operation,
    headerLabel: OPERATION_HEADER[input.operation],
    status: { label: 'Aguardando confirmação', tone: 'waiting' },
    title: input.title,
    description: input.description,
    meta: {
      type: TYPE_LABEL[input.type] ?? input.type,
      category: CATEGORY_LABEL[input.category] ?? input.category,
      priority: PRIORITY_LABEL[input.priority] ?? input.priority,
    },
    confirmationToken: input.confirmationToken,
    expiresAt: input.expiresAt,
  };
}

export function isTicketSelectPayload(value: unknown): value is TicketSelectPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as TicketSelectPayload).type === 'ticket_select' &&
    Array.isArray((value as TicketSelectPayload).items)
  );
}

export function isTicketDetailPayload(value: unknown): value is TicketDetailPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as TicketDetailPayload).type === 'ticket_detail'
  );
}

export function isTicketDraftPayload(value: unknown): value is TicketDraftPayloadUi {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as TicketDraftPayloadUi).type === 'ticket_draft' &&
    typeof (value as TicketDraftPayloadUi).confirmationToken === 'string'
  );
}
