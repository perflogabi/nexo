import { describe, expect, it } from 'vitest';
import {
  assertConfirmationGate,
  computePendingExpiresAt,
  DEFAULT_PENDING_CONFIRMATION_TTL_MS,
  evaluateConfirmationGate,
  evaluateTokenConsumption,
  type ConversationSnapshot,
  type PendingConfirmationSnapshot,
  type TicketSnapshot,
} from '@/domain/confirmation-gate';
import { ConfirmationInvalidError } from '@/domain/errors';

const NOW = new Date('2026-06-15T15:00:00.000Z');

function pending(
  overrides: Partial<PendingConfirmationSnapshot> = {},
): PendingConfirmationSnapshot {
  return {
    token: 'tok-1',
    employeeId: 'emp-a',
    conversationId: 'conv-1',
    operation: 'CREATE',
    payload: {},
    expiresAt: computePendingExpiresAt(NOW),
    consumedAt: null,
    ...overrides,
  };
}

function conversation(overrides: Partial<ConversationSnapshot> = {}): ConversationSnapshot {
  return {
    id: 'conv-1',
    employeeId: 'emp-a',
    status: 'WITH_AGENT',
    ...overrides,
  };
}

function ticket(overrides: Partial<TicketSnapshot> = {}): TicketSnapshot {
  return {
    id: 't-1',
    ownerEmployeeId: 'emp-a',
    status: 'OPEN',
    resolvedAt: null,
    ...overrides,
  };
}

describe('computePendingExpiresAt (TTL hipótese H)', () => {
  it('defaults to 30 minutes from now', () => {
    const expires = computePendingExpiresAt(NOW);
    expect(expires.getTime() - NOW.getTime()).toBe(DEFAULT_PENDING_CONFIRMATION_TTL_MS);
    expect(DEFAULT_PENDING_CONFIRMATION_TTL_MS).toBe(30 * 60 * 1000);
  });

  it('accepts injectable TTL for tests', () => {
    const expires = computePendingExpiresAt(NOW, 60_000);
    expect(expires.getTime()).toBe(NOW.getTime() + 60_000);
  });
});

describe('evaluateTokenConsumption', () => {
  it('accepts valid token for the session employee', () => {
    expect(
      evaluateTokenConsumption({
        pending: pending(),
        sessionEmployeeId: 'emp-a',
        now: NOW,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects missing token', () => {
    expect(
      evaluateTokenConsumption({
        pending: null,
        sessionEmployeeId: 'emp-a',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('rejects token belonging to another employee', () => {
    expect(
      evaluateTokenConsumption({
        pending: pending({ employeeId: 'emp-b' }),
        sessionEmployeeId: 'emp-a',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'WRONG_EMPLOYEE' });
  });

  it('rejects already consumed token', () => {
    expect(
      evaluateTokenConsumption({
        pending: pending({ consumedAt: NOW }),
        sessionEmployeeId: 'emp-a',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'ALREADY_CONSUMED' });
  });

  it('rejects expired token (clock injectable)', () => {
    expect(
      evaluateTokenConsumption({
        pending: pending({
          expiresAt: new Date(NOW.getTime() - 1),
        }),
        sessionEmployeeId: 'emp-a',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'EXPIRED' });
  });

  it('rejects reuse after conceptual consumption (second evaluation)', () => {
    const row = pending();
    const first = evaluateTokenConsumption({
      pending: row,
      sessionEmployeeId: 'emp-a',
      now: NOW,
    });
    expect(first.ok).toBe(true);

    const afterConsume = { ...row, consumedAt: NOW };
    const second = evaluateTokenConsumption({
      pending: afterConsume,
      sessionEmployeeId: 'emp-a',
      now: NOW,
    });
    expect(second).toEqual({ ok: false, reason: 'ALREADY_CONSUMED' });
  });
});

describe('evaluateConfirmationGate', () => {
  it('allows CREATE with valid token and WITH_AGENT conversation', () => {
    expect(
      evaluateConfirmationGate({
        pending: pending({ operation: 'CREATE' }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        now: NOW,
      }),
    ).toEqual({ ok: true });
  });

  it('allows UPDATE when ticket is open and owned by session', () => {
    expect(
      evaluateConfirmationGate({
        pending: pending({
          operation: 'UPDATE',
          payload: { ticketId: 't-1' },
        }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        ticket: ticket({ status: 'IN_PROGRESS' }),
        now: NOW,
      }),
    ).toEqual({ ok: true });
  });

  it('allows REOPEN within 7-day window', () => {
    const resolvedAt = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(
      evaluateConfirmationGate({
        pending: pending({
          operation: 'REOPEN',
          payload: { ticketId: 't-1' },
        }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        ticket: ticket({ status: 'RESOLVED', resolvedAt }),
        now: NOW,
      }),
    ).toEqual({ ok: true });
  });

  it('denies UPDATE/REOPEN when ticket belongs to another owner', () => {
    expect(
      evaluateConfirmationGate({
        pending: pending({
          operation: 'UPDATE',
          payload: { ticketId: 't-1' },
        }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        ticket: ticket({ ownerEmployeeId: 'emp-b' }),
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'TICKET_OWNER_MISMATCH' });
  });

  it('denies when agent is paused (WAITING_ANALYST / WITH_ANALYST)', () => {
    expect(
      evaluateConfirmationGate({
        pending: pending(),
        sessionEmployeeId: 'emp-a',
        conversation: conversation({ status: 'WAITING_ANALYST' }),
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'AGENT_PAUSED' });
  });

  it('denies REOPEN outside window', () => {
    const resolvedAt = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000);
    expect(
      evaluateConfirmationGate({
        pending: pending({
          operation: 'REOPEN',
          payload: { ticketId: 't-1' },
        }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        ticket: ticket({ status: 'CLOSED', resolvedAt }),
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'REOPEN_NOT_ELIGIBLE' });
  });

  it('denies REOPEN from APPROVED by default (hypothesis H)', () => {
    expect(
      evaluateConfirmationGate({
        pending: pending({
          operation: 'REOPEN',
          payload: { ticketId: 't-1' },
        }),
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        ticket: ticket({
          status: 'APPROVED',
          resolvedAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
        }),
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'REOPEN_NOT_ELIGIBLE' });
  });

  it('assertConfirmationGate throws ConfirmationInvalidError', () => {
    expect(() =>
      assertConfirmationGate({
        pending: null,
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        now: NOW,
      }),
    ).toThrow(ConfirmationInvalidError);

    try {
      assertConfirmationGate({
        pending: null,
        sessionEmployeeId: 'emp-a',
        conversation: conversation(),
        now: NOW,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ConfirmationInvalidError);
      expect((e as ConfirmationInvalidError).code).toBe('CONFIRMATION_INVALID');
      expect((e as ConfirmationInvalidError).reason).toBe('NOT_FOUND');
    }
  });
});
