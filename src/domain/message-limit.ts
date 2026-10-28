/**
 * Limite de 30 mensagens por Conversation (E texto PRD).
 * Contam EMPLOYEE + AGENT; não contam ANALYST / SYSTEM (I — requirements §2.3).
 */

import type { AuthorType } from './types';

export const MESSAGE_LIMIT_PER_CONVERSATION = 30;

export function countsTowardMessageLimit(authorType: AuthorType): boolean {
  return authorType === 'EMPLOYEE' || authorType === 'AGENT';
}

/** Aceita nova mensagem que conta se messageCount atual < 30. */
export function canAcceptCountableMessage(messageCount: number): boolean {
  return messageCount < MESSAGE_LIMIT_PER_CONVERSATION;
}
