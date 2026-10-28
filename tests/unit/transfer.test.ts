import { describe, expect, it } from 'vitest';
import { isAgentPaused } from '@/domain/conversation-status';
import {
  canTransitionConversation,
  shouldTransfer,
  transferTransitionRequirements,
} from '@/domain/transfer';
import { zonedTimeToUtc } from '@/domain/sla';
import type { ConversationStatus } from '@/domain/types';

const NOW = zonedTimeToUtc({
  year: 2026,
  month: 5,
  day: 4,
  hour: 10,
  minute: 0,
  second: 0,
});

describe('shouldTransfer', () => {
  it('transfers for each reason in isolation', () => {
    expect(shouldTransfer({ userRequestedTransfer: true })).toEqual({
      transfer: true,
      reasonCode: 'USER_REQUEST',
    });
    expect(shouldTransfer({ priority: 'CRITICAL' })).toEqual({
      transfer: true,
      reasonCode: 'CRITICAL',
    });
    expect(
      shouldTransfer({
        slaDeadlineAt: zonedTimeToUtc({
          year: 2026,
          month: 5,
          day: 4,
          hour: 9,
          minute: 0,
          second: 0,
        }),
        now: NOW,
      }),
    ).toEqual({ transfer: true, reasonCode: 'OVERDUE' });
    expect(shouldTransfer({ deterministicLowConfidence: true })).toEqual({
      transfer: true,
      reasonCode: 'LOW_CONFIDENCE',
    });
  });

  it('does not let high modelConfidence block CRITICAL/OVERDUE', () => {
    expect(shouldTransfer({ priority: 'CRITICAL', modelConfidence: 0.99 })).toEqual({
      transfer: true,
      reasonCode: 'CRITICAL',
    });
    expect(
      shouldTransfer({
        slaDeadlineAt: new Date(NOW.getTime() - 1000),
        now: NOW,
        modelConfidence: 0.99,
      }),
    ).toEqual({ transfer: true, reasonCode: 'OVERDUE' });
  });

  it('does not transfer on low modelConfidence alone', () => {
    expect(shouldTransfer({ modelConfidence: 0.1, now: NOW })).toEqual({
      transfer: false,
    });
  });

  it('prefers USER_REQUEST over CRITICAL when both present', () => {
    expect(shouldTransfer({ userRequestedTransfer: true, priority: 'CRITICAL' })).toEqual({
      transfer: true,
      reasonCode: 'USER_REQUEST',
    });
  });
});

describe('canTransitionConversation', () => {
  const valid: Array<[ConversationStatus, ConversationStatus]> = [
    ['WITH_AGENT', 'WAITING_ANALYST'],
    ['WITH_AGENT', 'CLOSED'],
    ['WAITING_ANALYST', 'WITH_ANALYST'],
    ['WAITING_ANALYST', 'WITH_AGENT'],
    ['WAITING_ANALYST', 'CLOSED'],
    ['WITH_ANALYST', 'WITH_AGENT'],
    ['WITH_ANALYST', 'CLOSED'],
  ];

  it.each(valid)('allows %s → %s', (from, to) => {
    expect(canTransitionConversation(from, to)).toBe(true);
  });

  it('rejects WITH_AGENT → WITH_ANALYST (must queue)', () => {
    expect(canTransitionConversation('WITH_AGENT', 'WITH_ANALYST')).toBe(false);
  });

  it('rejects CLOSED → any', () => {
    expect(canTransitionConversation('CLOSED', 'WITH_AGENT')).toBe(false);
    expect(canTransitionConversation('CLOSED', 'WAITING_ANALYST')).toBe(false);
  });

  it('rejects WITH_ANALYST → WAITING_ANALYST (MVP)', () => {
    expect(canTransitionConversation('WITH_ANALYST', 'WAITING_ANALYST')).toBe(false);
  });

  it('requires transferSummary when entering WAITING_ANALYST', () => {
    expect(transferTransitionRequirements('WAITING_ANALYST')).toEqual({
      requiresTransferSummary: true,
      assignedAnalystIdMustBeNull: true,
    });
  });
});

describe('isAgentPaused (derived)', () => {
  it('remains derived from status only', () => {
    expect(isAgentPaused('WAITING_ANALYST')).toBe(true);
    expect(isAgentPaused('WITH_ANALYST')).toBe(true);
    expect(isAgentPaused('WITH_AGENT')).toBe(false);
    expect(isAgentPaused('CLOSED')).toBe(false);
  });
});
