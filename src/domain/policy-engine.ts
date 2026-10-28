/**
 * PolicyEngine — fachada do domínio (Fases 2.1–2.2).
 *
 * Independente de Prisma, UI e Gemini.
 * Não executa mutações; não substitui Authorization no serviço de aplicação.
 *
 * Hipóteses explícitas (não requisitos PRD):
 * - DEFAULT_JACCARD_THRESHOLD = 0.5
 * - Reopen a partir de APPROVED (default bloqueado)
 * - Limiar auxiliar modelConfidence (nunca sozinho)
 * - DEFAULT_PENDING_CONFIRMATION_TTL_MS = 30 min
 * - Limpeza de transferSummary ao devolver (não implementada aqui)
 */

export * from './types';
export * from './errors';
export * from './conversation-status';
export * from './sla';
export * from './duplicity';
export * from './reopen';
export * from './transfer';
export * from './authorization-scope';
export * from './ti-scope';
export * from './confirmation-gate';
