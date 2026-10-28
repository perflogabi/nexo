/**
 * Elegibilidade de reabertura (7 dias).
 *
 * - RESOLVED/CLOSED + resolvedAt ≤ 7 dias → Explícito + Técnica
 * - APPROVED → **Hipótese (H)**: default NÃO elegível; flag explícita se o produto mudar
 * - Authz de owner NÃO é substituída aqui — o serviço deve checar ownerEmployeeId
 *
 * Ver data-model.md §5.
 */

import type { TicketStatus } from './types';
import { REOPEN_BASE_STATUSES } from './types';

export const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ReopenEligibilityInput = {
  status: TicketStatus;
  resolvedAt: Date | null;
  now: Date;
  /**
   * HIPÓTESE (H): permitir reopen a partir de APPROVED.
   * Default false — não promover a regra definitiva sem decisão registrada.
   */
  allowReopenFromApproved?: boolean;
  /** Override da janela (testes); default 7 dias (E). */
  reopenWindowMs?: number;
};

export type ReopenEligibilityResult = {
  eligible: boolean;
  reason:
    | 'ELIGIBLE'
    | 'STATUS_NOT_REOPENABLE'
    | 'APPROVED_BLOCKED_BY_HYPOTHESIS'
    | 'MISSING_RESOLVED_AT'
    | 'OUTSIDE_REOPEN_WINDOW';
};

export function canReopen(input: ReopenEligibilityInput): ReopenEligibilityResult {
  const allowApproved = input.allowReopenFromApproved ?? false;
  const windowMs = input.reopenWindowMs ?? REOPEN_WINDOW_MS;

  if (input.status === 'APPROVED' && !allowApproved) {
    return { eligible: false, reason: 'APPROVED_BLOCKED_BY_HYPOTHESIS' };
  }

  const statusOk =
    (REOPEN_BASE_STATUSES as readonly TicketStatus[]).includes(input.status) ||
    (input.status === 'APPROVED' && allowApproved);

  if (!statusOk) {
    return { eligible: false, reason: 'STATUS_NOT_REOPENABLE' };
  }

  if (input.resolvedAt == null) {
    return { eligible: false, reason: 'MISSING_RESOLVED_AT' };
  }

  const elapsed = input.now.getTime() - input.resolvedAt.getTime();
  if (elapsed < 0 || elapsed > windowMs) {
    return { eligible: false, reason: 'OUTSIDE_REOPEN_WINDOW' };
  }

  return { eligible: true, reason: 'ELIGIBLE' };
}
