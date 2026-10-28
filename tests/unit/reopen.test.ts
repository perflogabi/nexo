import { describe, expect, it } from 'vitest';
import { canReopen } from '@/domain/reopen';
import { zonedTimeToUtc } from '@/domain/sla';

const NOW = zonedTimeToUtc({
  year: 2026,
  month: 4,
  day: 10,
  hour: 12,
  minute: 0,
  second: 0,
});

describe('canReopen', () => {
  it('allows RESOLVED within 7 days', () => {
    const resolvedAt = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000);
    expect(canReopen({ status: 'RESOLVED', resolvedAt, now: NOW })).toEqual({
      eligible: true,
      reason: 'ELIGIBLE',
    });
  });

  it('rejects outside 7-day window', () => {
    const resolvedAt = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000);
    expect(canReopen({ status: 'CLOSED', resolvedAt, now: NOW })).toEqual({
      eligible: false,
      reason: 'OUTSIDE_REOPEN_WINDOW',
    });
  });

  it('rejects open statuses', () => {
    expect(canReopen({ status: 'OPEN', resolvedAt: null, now: NOW })).toEqual({
      eligible: false,
      reason: 'STATUS_NOT_REOPENABLE',
    });
  });

  it('rejects missing resolvedAt', () => {
    expect(canReopen({ status: 'RESOLVED', resolvedAt: null, now: NOW })).toEqual({
      eligible: false,
      reason: 'MISSING_RESOLVED_AT',
    });
  });

  it('blocks APPROVED by default (hypothesis H)', () => {
    const resolvedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(canReopen({ status: 'APPROVED', resolvedAt, now: NOW })).toEqual({
      eligible: false,
      reason: 'APPROVED_BLOCKED_BY_HYPOTHESIS',
    });
  });

  it('allows APPROVED only when hypothesis flag is enabled', () => {
    const resolvedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(
      canReopen({
        status: 'APPROVED',
        resolvedAt,
        now: NOW,
        allowReopenFromApproved: true,
      }),
    ).toEqual({ eligible: true, reason: 'ELIGIBLE' });
  });
});
