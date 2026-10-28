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
