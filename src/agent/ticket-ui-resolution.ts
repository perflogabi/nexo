/**
 * Resolve listagem vs detalhe de chamado para o /chat (dados reais do TicketService).
 */

import { isPoliteDismiss } from '@/agent/chat-followups';
import type { TicketRecord } from '@/services/tickets/types';

const OPENISH = new Set(['OPEN', 'WAITING_ANALYST', 'IN_PROGRESS', 'APPROVED']);

/** Tokens genéricos demais para casar título (evita “quero” / “saber” sozinhos). */
const WEAK_TITLE_TOKENS = new Set([
  'quero',
  'saber',
  'sobre',
  'desse',
  'desta',
  'esse',
  'esta',
  'este',
  'meu',
  'minha',
  'chamado',
  'ticket',
  'status',
  'apenas',
  'so',
  'só',
  'do',
  'da',
  'de',
  'um',
  'uma',
  'o',
  'a',
]);

export function ticketNumberInText(text: string): string | null {
  const m = text.match(/\b((?:INC|REQ)-\d+)\b/i);
  return m?.[1]?.toUpperCase() ?? null;
}

export function openishTickets(tickets: readonly TicketRecord[]): TicketRecord[] {
  const open = tickets.filter((t) => OPENISH.has(t.status));
  return (open.length > 0 ? open : [...tickets]).slice(0, 5);
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchTicketByTitleHint(
  tickets: readonly TicketRecord[],
  employeeMessage: string,
): TicketRecord | null {
  const msg = fold(employeeMessage);
  if (msg.length < 2) return null;

  const hits = tickets.filter((t) => {
    const title = fold(t.title);
    if (title.includes(msg) || msg.includes(title)) return true;
    const tokens = msg.split(' ').filter((w) => w.length >= 3 && !WEAK_TITLE_TOKENS.has(w));
    return tokens.some((w) => title.includes(w));
  });

  return hits.length === 1 ? (hits[0] ?? null) : null;
}

/**
 * Escolhe um chamado para o TicketDetailCard.
 * Não usa “mensagem curta ⇒ único chamado” (quebrava “Não, obrigado”).
 */
export function resolveTicketForDetail(
  tickets: readonly TicketRecord[],
  employeeMessage: string,
): TicketRecord | null {
  if (tickets.length === 0) return null;
  if (isPoliteDismiss(employeeMessage)) return null;

  const number = ticketNumberInText(employeeMessage);
  if (number) {
    return tickets.find((t) => t.number.toUpperCase() === number) ?? null;
  }

  return matchTicketByTitleHint(tickets, employeeMessage);
}

/** Listagem: se só há 1 aberto, preferir detalhe (sem perguntar “qual?”). */
export function shouldShowDetailInsteadOfList(
  tickets: readonly TicketRecord[],
): TicketRecord | null {
  const pool = openishTickets(tickets);
  return pool.length === 1 ? (pool[0] ?? null) : null;
}
