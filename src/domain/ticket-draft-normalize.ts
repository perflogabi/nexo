/**
 * Normaliza campos livres do LLM para enums do domínio (INC/REQ, Category, Priority).
 * Evita PrismaClientValidationError quando o modelo manda "INCIDENT", "Rede e Conectividade", etc.
 */

import type { Category, Priority, TicketType } from '@/domain/types';

function fold(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function normalizeTicketType(raw: unknown): TicketType {
  const s = fold(raw);
  if (
    s === 'REQ' ||
    s === 'REQUEST' ||
    s === 'REQUISICAO' ||
    s === 'SERVICE_REQUEST' ||
    s === 'SR' ||
    s.includes('REQUIS')
  ) {
    return 'REQ';
  }
  // INC, INCIDENT, INCIDENTE, ou default seguro para abertura
  return 'INC';
}

export function normalizeCategory(raw: unknown): Category {
  const s = fold(raw);
  if (s === 'ACESSO' || s.includes('ACESSO') || s.includes('PERMISSAO') || s.includes('LOGIN')) {
    return 'ACESSO';
  }
  if (
    s === 'REDE_VPN' ||
    s.includes('VPN') ||
    s.includes('REDE') ||
    s.includes('CONECTIV') ||
    s.includes('NETWORK') ||
    s.includes('WIFI') ||
    s.includes('WI-FI')
  ) {
    return 'REDE_VPN';
  }
  if (
    s === 'HARDWARE' ||
    s.includes('HARDWARE') ||
    s.includes('NOTEBOOK') ||
    s.includes('MONITOR')
  ) {
    return 'HARDWARE';
  }
  if (
    s === 'SOFTWARE' ||
    s.includes('SOFTWARE') ||
    s.includes('APLICATIVO') ||
    s.includes('APP ')
  ) {
    return 'SOFTWARE';
  }
  if (s === 'EMAIL' || s.includes('EMAIL') || s.includes('OUTLOOK') || s.includes('E-MAIL')) {
    return 'EMAIL';
  }
  if (s === 'OUTROS') return 'OUTROS';
  return 'OUTROS';
}

export function normalizePriority(raw: unknown): Priority {
  const s = fold(raw);
  if (s === 'CRITICAL' || s === 'CRITICA' || s === 'CRITICO' || s.includes('CRITIC')) {
    return 'CRITICAL';
  }
  if (s === 'HIGH' || s === 'ALTA' || s === 'ALTO') return 'HIGH';
  if (s === 'LOW' || s === 'BAIXA' || s === 'BAIXO') return 'LOW';
  if (s === 'MEDIUM' || s === 'MEDIA' || s === 'MEDIO') return 'MEDIUM';
  return 'MEDIUM';
}

export function normalizeTicketDraftFields(input: {
  type: unknown;
  category: unknown;
  priority: unknown;
}): { type: TicketType; category: Category; priority: Priority } {
  return {
    type: normalizeTicketType(input.type),
    category: normalizeCategory(input.category),
    priority: normalizePriority(input.priority),
  };
}
