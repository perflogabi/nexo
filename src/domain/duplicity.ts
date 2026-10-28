/**
 * Duplicidade por similaridade de título (Jaccard).
 *
 * - Escopo por ownerEmployeeId + category (+ type quando ambos conhecidos) → E/T
 * - Normalização e Jaccard → Técnica
 * - Limiar padrão 0.5 → **Hipótese (H)** calibrável — NÃO é requisito do PRD
 *
 * Esta etapa NÃO funde nem altera chamados; só avalia candidatos.
 * Ver requirements-resolution.md §2.2.
 */

import type { Category, TicketStatus, TicketType } from './types';
import { OPEN_TICKET_STATUSES } from './types';

/**
 * HIPÓTESE TÉCNICA (H): limiar Jaccard ≥ 0.5.
 * Calibrável via parâmetro; não tratar como exigência do PRD.
 */
export const DEFAULT_JACCARD_THRESHOLD = 0.5;

export function normalizeTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeTitle(title: string): Set<string> {
  const normalized = normalizeTitle(title);
  if (!normalized) return new Set();
  const tokens = normalized.split(' ').filter((t) => t.length > 2);
  return new Set(tokens);
}

/**
 * Jaccard entre conjuntos de tokens.
 * Títulos idênticos (após normalização) com tokens vazios → 1 (iguais).
 * Um vazio e outro não → 0.
 */
export function jaccardSimilarity(titleA: string, titleB: string): number {
  const a = tokenizeTitle(titleA);
  const b = tokenizeTitle(titleB);
  if (a.size === 0 && b.size === 0) {
    return normalizeTitle(titleA) === normalizeTitle(titleB) ? 1 : 0;
  }
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type DuplicateCandidateTicket = {
  id: string;
  ownerEmployeeId: string;
  category: Category;
  type: TicketType;
  status: TicketStatus;
  title: string;
  updatedAt: Date;
  resolvedAt: Date | null;
};

export type DuplicateDraft = {
  ownerEmployeeId: string;
  category: Category;
  /** Se omitido/null, não filtra por type (T). */
  type?: TicketType | null;
  title: string;
};

export type DuplicateMatchKind = 'UPDATE' | 'REOPEN';

export type DuplicateMatch = {
  ticketId: string;
  kind: DuplicateMatchKind;
  score: number;
};

export type FindDuplicateOptions = {
  /** HIPÓTESE (H) — default 0.5 */
  jaccardThreshold?: number;
  now?: Date;
  /** Janela reopen em ms; default 7 dias (E). */
  reopenWindowMs?: number;
  /**
   * HIPÓTESE (H): reopen a partir de APPROVED.
   * Default false — não tratar como regra definitiva do PRD.
   */
  allowReopenFromApproved?: boolean;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isOpenStatus(status: TicketStatus): boolean {
  return (OPEN_TICKET_STATUSES as readonly TicketStatus[]).includes(status);
}

function typeCompatible(draft: DuplicateDraft, ticket: DuplicateCandidateTicket): boolean {
  if (draft.type == null) return true;
  return draft.type === ticket.type;
}

/**
 * Entre candidatos já carregados pelo serviço (mesmo owner filtrado na query),
 * escolhe o melhor match UPDATE ou REOPEN. Cross-owner nunca deve ser passado aqui;
 * o serviço continua obrigado a filtrar por ownerEmployeeId.
 */
export function findDuplicateOrReopenCandidate(
  draft: DuplicateDraft,
  candidates: readonly DuplicateCandidateTicket[],
  options: FindDuplicateOptions = {},
): DuplicateMatch | null {
  const threshold = options.jaccardThreshold ?? DEFAULT_JACCARD_THRESHOLD;
  const now = options.now ?? new Date();
  const reopenWindowMs = options.reopenWindowMs ?? SEVEN_DAYS_MS;
  const allowApproved = options.allowReopenFromApproved ?? false;

  const scoped = candidates.filter(
    (t) =>
      t.ownerEmployeeId === draft.ownerEmployeeId &&
      t.category === draft.category &&
      typeCompatible(draft, t),
  );

  const scored: DuplicateMatch[] = [];

  for (const ticket of scoped) {
    const score = jaccardSimilarity(draft.title, ticket.title);
    if (score < threshold) continue;

    if (isOpenStatus(ticket.status)) {
      scored.push({ ticketId: ticket.id, kind: 'UPDATE', score });
      continue;
    }

    if (ticket.status === 'APPROVED') {
      if (!allowApproved) continue;
      // Hipótese: se habilitado, exige resolvedAt na janela como demais.
    }

    const reopenEligibleStatus =
      ticket.status === 'RESOLVED' ||
      ticket.status === 'CLOSED' ||
      (ticket.status === 'APPROVED' && allowApproved);

    if (!reopenEligibleStatus) continue;
    if (ticket.resolvedAt == null) continue;
    if (now.getTime() - ticket.resolvedAt.getTime() > reopenWindowMs) continue;

    scored.push({ ticketId: ticket.id, kind: 'REOPEN', score });
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = scoped.find((t) => t.id === a.ticketId)!;
    const tb = scoped.find((t) => t.id === b.ticketId)!;
    return tb.updatedAt.getTime() - ta.updatedAt.getTime();
  });

  return scored[0] ?? null;
}
