import { describe, expect, it } from 'vitest';
import {
  addBusinessHours,
  computeSlaDeadline,
  defaultSlaCalendar,
  getZonedParts,
  isOverdue,
  shouldRecalculateSla,
  snapToBusinessStart,
  zonedTimeToUtc,
  type SlaCalendar,
} from '@/domain/sla';

/** Sexta 2026-03-13 17:30 America/Sao_Paulo */
const FRI_1730 = zonedTimeToUtc({
  year: 2026,
  month: 3,
  day: 13,
  hour: 17,
  minute: 30,
  second: 0,
});

/** Sexta 2026-03-13 17:00 America/Sao_Paulo */
const FRI_1700 = zonedTimeToUtc({
  year: 2026,
  month: 3,
  day: 13,
  hour: 17,
  minute: 0,
  second: 0,
});

describe('computeSlaDeadline — CRITICAL (corrida)', () => {
  it('adds 1 elapsed hour even on Friday evening', () => {
    const deadline = computeSlaDeadline('CRITICAL', FRI_1730);
    expect(deadline.toISOString()).toBe(
      zonedTimeToUtc({
        year: 2026,
        month: 3,
        day: 13,
        hour: 18,
        minute: 30,
        second: 0,
      }).toISOString(),
    );
  });
});

describe('computeSlaDeadline — business hours', () => {
  it('HIGH opened Friday 17:00 → Monday 11:00 SP (4 business hours)', () => {
    const deadline = computeSlaDeadline('HIGH', FRI_1700);
    const parts = getZonedParts(deadline);
    expect(parts).toMatchObject({
      year: 2026,
      month: 3,
      day: 16, // Monday
      hour: 11,
      minute: 0,
    });
  });

  it('MEDIUM crosses the weekend (3 business days = 30h)', () => {
    const mondayMorning = zonedTimeToUtc({
      year: 2026,
      month: 3,
      day: 13,
      hour: 9,
      minute: 0,
      second: 0,
    });
    // Friday 09:00 + 30h úteis → Wed 09:00 next week? Fri 9→18 = 9h, Mon 8→18 = 10h (19), Tue 8→18 = 10h (29), Wed 8→9 = 1h → Wed 09:00
    const deadline = computeSlaDeadline('MEDIUM', mondayMorning);
    const parts = getZonedParts(deadline);
    expect(parts).toMatchObject({
      year: 2026,
      month: 3,
      day: 18,
      hour: 9,
      minute: 0,
    });
  });

  it('snapToBusinessStart moves Saturday to Monday 08:00', () => {
    const saturday = zonedTimeToUtc({
      year: 2026,
      month: 3,
      day: 14,
      hour: 12,
      minute: 0,
      second: 0,
    });
    const snapped = snapToBusinessStart(saturday);
    expect(getZonedParts(snapped)).toMatchObject({
      year: 2026,
      month: 3,
      day: 16,
      hour: 8,
      minute: 0,
    });
  });
});

describe('injectable calendar (holiday extension)', () => {
  it('skips a marked non-business day', () => {
    const calendar: SlaCalendar = {
      isBusinessDay: (parts) => {
        if (parts.year === 2026 && parts.month === 3 && parts.day === 16) return false; // “feriado” na segunda
        return defaultSlaCalendar.isBusinessDay(parts);
      },
    };
    const from = zonedTimeToUtc({
      year: 2026,
      month: 3,
      day: 13,
      hour: 17,
      minute: 0,
      second: 0,
    });
    // 4h úteis: sex 17–18 (1h) → pula seg feriado → ter 08–11
    const deadline = addBusinessHours(from, 4, calendar);
    expect(getZonedParts(deadline)).toMatchObject({
      year: 2026,
      month: 3,
      day: 17,
      hour: 11,
      minute: 0,
    });
  });
});

describe('isOverdue / shouldRecalculateSla', () => {
  it('is overdue only when now > deadline', () => {
    const deadline = zonedTimeToUtc({
      year: 2026,
      month: 3,
      day: 13,
      hour: 12,
      minute: 0,
      second: 0,
    });
    expect(
      isOverdue(
        deadline,
        zonedTimeToUtc({ year: 2026, month: 3, day: 13, hour: 12, minute: 0, second: 0 }),
      ),
    ).toBe(false);
    expect(
      isOverdue(
        deadline,
        zonedTimeToUtc({ year: 2026, month: 3, day: 13, hour: 12, minute: 0, second: 1 }),
      ),
    ).toBe(true);
  });

  it('recalculates on CREATE/REOPEN/complement/priority, not status-only', () => {
    expect(shouldRecalculateSla('CREATE')).toBe(true);
    expect(shouldRecalculateSla('REOPEN')).toBe(true);
    expect(shouldRecalculateSla('COMPLEMENT_UPDATE')).toBe(true);
    expect(shouldRecalculateSla('PRIORITY_CHANGE')).toBe(true);
    expect(shouldRecalculateSla('STATUS_ONLY_CHANGE')).toBe(false);
    expect(shouldRecalculateSla('COSMETIC_OR_INTERNAL')).toBe(false);
  });
});
