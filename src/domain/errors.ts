/**
 * Erros de domínio/serviço com código estável para API/UI.
 * Não usar 500 genérico para falhas de regra de negócio.
 */

export type ConfirmationInvalidReason =
  | 'NOT_FOUND'
  | 'WRONG_EMPLOYEE'
  | 'ALREADY_CONSUMED'
  | 'EXPIRED'
  | 'CONVERSATION_MISMATCH'
  | 'CONVERSATION_NOT_OWNED'
  | 'CONVERSATION_CLOSED'
  | 'AGENT_PAUSED'
  | 'TICKET_REQUIRED'
  | 'TICKET_OWNER_MISMATCH'
  | 'OPERATION_NOT_ELIGIBLE'
  | 'REOPEN_NOT_ELIGIBLE';

export class ConfirmationInvalidError extends Error {
  readonly code = 'CONFIRMATION_INVALID' as const;
  readonly reason: ConfirmationInvalidReason;

  constructor(reason: ConfirmationInvalidReason, message?: string) {
    super(message ?? `Confirmation invalid: ${reason}`);
    this.name = 'ConfirmationInvalidError';
    this.reason = reason;
  }
}

export class TicketAccessDeniedError extends Error {
  readonly code = 'TICKET_ACCESS_DENIED' as const;

  constructor(message = 'Ticket access denied') {
    super(message);
    this.name = 'TicketAccessDeniedError';
  }
}

export class TicketNotFoundError extends Error {
  readonly code = 'TICKET_NOT_FOUND' as const;

  constructor(message = 'Ticket not found') {
    super(message);
    this.name = 'TicketNotFoundError';
  }
}

/** PRD: serviço de chamados legado instável — falha intermitente tipada. */
export class TicketServiceUnavailableError extends Error {
  readonly code = 'TICKET_SERVICE_UNAVAILABLE' as const;

  constructor(message = 'Ticket service temporarily unavailable') {
    super(message);
    this.name = 'TicketServiceUnavailableError';
  }
}

export class MessageLimitExceededError extends Error {
  readonly code = 'MESSAGE_LIMIT_EXCEEDED' as const;

  constructor(message = 'Conversation message limit reached (30)') {
    super(message);
    this.name = 'MessageLimitExceededError';
  }
}

export class AuthError extends Error {
  readonly code = 'AUTH_ERROR' as const;
  readonly reason: 'INVALID_CREDENTIALS' | 'UNAUTHENTICATED' | 'FORBIDDEN';

  constructor(reason: AuthError['reason'], message?: string) {
    super(message ?? reason);
    this.name = 'AuthError';
    this.reason = reason;
  }
}

export class ConversationAccessDeniedError extends Error {
  readonly code = 'CONVERSATION_ACCESS_DENIED' as const;

  constructor(message = 'Conversation access denied') {
    super(message);
    this.name = 'ConversationAccessDeniedError';
  }
}

export class ConversationNotFoundError extends Error {
  readonly code = 'CONVERSATION_NOT_FOUND' as const;

  constructor(message = 'Conversation not found') {
    super(message);
    this.name = 'ConversationNotFoundError';
  }
}

export class AgentPausedError extends Error {
  readonly code = 'AGENT_PAUSED' as const;

  constructor(message = 'Agent is paused for this conversation') {
    super(message);
    this.name = 'AgentPausedError';
  }
}
