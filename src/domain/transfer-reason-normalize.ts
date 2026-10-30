/**
 * Normaliza reasonCode livre do LLM para TransferReasonCode do domínio/Prisma.
 */

import type { TransferReasonCode } from '@/domain/types';

const VALID: ReadonlySet<string> = new Set([
  'USER_REQUEST',
  'CRITICAL',
  'OVERDUE',
  'LOW_CONFIDENCE',
]);

export function normalizeTransferReasonCode(raw: unknown): TransferReasonCode {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (VALID.has(s)) return s as TransferReasonCode;

  if (s.includes('CRITIC')) return 'CRITICAL';
  if (s.includes('OVERDUE') || s.includes('VENCID') || s.includes('SLA')) return 'OVERDUE';
  if (s.includes('CONFIDENCE') || s.includes('CONFIANCA') || s.includes('INCERT')) {
    return 'LOW_CONFIDENCE';
  }

  // FUNCIONARIO_SOLICITOU_ANALISTA, USER_ASKED, etc.
  return 'USER_REQUEST';
}
