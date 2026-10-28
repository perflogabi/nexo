/**
 * SLA — PolicyEngine
 *
 * Classificação:
 * - Crítica = 1h corrida 24/7 → Interpretação (PRD “1 hora” sem “úteis” + plantão Anexo B)
 * - Alta/Média/Baixa em horário útil → Explícito (“úteis”) + Técnica (calendário)
 * - Calendário v1: seg–sex 08–18 America/Sao_Paulo, sem feriados → Técnica
 * - Recálculo seletivo (CREATE/REOPEN/complemento/prioridade sim; só status não) → Técnica, não E
 *
 * Ver requirements-resolution.md §2.4 e data-model.md §6.
 */

import type { Priority } from './types';

export const SLA_TIMEZONE = 'America/Sao_Paulo';
export const BUSINESS_DAY_START_HOUR = 8;
export const BUSINESS_DAY_END_HOUR = 18;
/** Horas úteis por dia útil no calendário v1 (08–18). */
export const BUSINESS_HOURS_PER_DAY = BUSINESS_DAY_END_HOUR - BUSINESS_DAY_START_HOUR;

export type SlaCalendar = {
  /** Default v1: seg–sex. Injetável para feriados em testes/extensão. */
  isBusinessDay: (parts: ZonedDateParts) => boolean;
};

export type ZonedDateParts = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Sun … 6=Sat (Date.getUTCDay-style)
};

export type SlaRecalcTrigger =
  | 'CREATE'
  | 'REOPEN'
  | 'COMPLEMENT_UPDATE'
  | 'PRIORITY_CHANGE'
  | 'STATUS_ONLY_CHANGE'
  | 'COSMETIC_OR_INTERNAL';

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const defaultSlaCalendar: SlaCalendar = {
  isBusinessDay: (parts) => parts.weekday >= 1 && parts.weekday <= 5,
};

/** Prazos em unidades do calendário v1 (T). */
export function businessDurationForPriority(priority: Priority): {
  kind: 'elapsed' | 'business';
  hours: number;
} {
  switch (priority) {
    case 'CRITICAL':
      return { kind: 'elapsed', hours: 1 };
    case 'HIGH':
      return { kind: 'business', hours: 4 };
    case 'MEDIUM':
      return { kind: 'business', hours: 3 * BUSINESS_HOURS_PER_DAY };
    case 'LOW':
      return { kind: 'business', hours: 5 * BUSINESS_HOURS_PER_DAY };
  }
}

export function getZonedParts(date: Date, timeZone: string = SLA_TIMEZONE): ZonedDateParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_TO_INDEX[map.weekday] ?? 0,
  };
}

/** Instant UTC correspondente a um horário civil em America/Sao_Paulo (offset fixo −03 desde 2019). */
export function zonedTimeToUtc(
  parts: Omit<ZonedDateParts, 'weekday'>,
  timeZone: string = SLA_TIMEZONE,
): Date {
  if (timeZone !== SLA_TIMEZONE) {
    throw new Error(`Only ${SLA_TIMEZONE} is supported in v1 without a TZ database`);
  }
  // Brasil sem horário de verão desde 2019: UTC−3 o ano todo.
  const iso = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}-03:00`;
  return new Date(iso);
}

function addCalendarDays(parts: ZonedDateParts, days: number): ZonedDateParts {
  const utc = zonedTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: 12,
    minute: 0,
    second: 0,
  });
  utc.setUTCDate(utc.getUTCDate() + days);
  return getZonedParts(utc);
}

function isWithinBusinessHours(parts: ZonedDateParts, calendar: SlaCalendar): boolean {
  if (!calendar.isBusinessDay(parts)) return false;
  const minutes = parts.hour * 60 + parts.minute;
  const start = BUSINESS_DAY_START_HOUR * 60;
  const end = BUSINESS_DAY_END_HOUR * 60;
  return minutes >= start && minutes < end;
}

/** Próximo instante útil (início do próximo slot aberto), inclusive se já estiver útil. */
export function snapToBusinessStart(from: Date, calendar: SlaCalendar = defaultSlaCalendar): Date {
  let parts = getZonedParts(from);
  if (isWithinBusinessHours(parts, calendar)) {
    return from;
  }

  // Depois do expediente ou fim de semana → próximo dia útil 08:00
  if (
    calendar.isBusinessDay(parts) &&
    parts.hour * 60 + parts.minute < BUSINESS_DAY_START_HOUR * 60
  ) {
    return zonedTimeToUtc({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: BUSINESS_DAY_START_HOUR,
      minute: 0,
      second: 0,
    });
  }

  let guard = 0;
  do {
    parts = addCalendarDays(parts, 1);
    guard += 1;
    if (guard > 370) throw new Error('snapToBusinessStart: calendar loop');
  } while (!calendar.isBusinessDay(parts));

  return zonedTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: BUSINESS_DAY_START_HOUR,
    minute: 0,
    second: 0,
  });
}

/**
 * Adiciona `hours` de tempo útil a partir de `from` (minuto a minuto em slots 08–18).
 * Determinístico; calendário injetável para feriados.
 */
export function addBusinessHours(
  from: Date,
  hours: number,
  calendar: SlaCalendar = defaultSlaCalendar,
): Date {
  if (hours < 0) throw new Error('hours must be >= 0');
  if (hours === 0) return new Date(from.getTime());

  let remainingMs = hours * 60 * 60 * 1000;
  let cursor = snapToBusinessStart(from, calendar);

  let guard = 0;
  while (remainingMs > 0) {
    guard += 1;
    if (guard > 100_000) throw new Error('addBusinessHours: exceeded iteration guard');

    const parts = getZonedParts(cursor);
    if (!isWithinBusinessHours(parts, calendar)) {
      cursor = snapToBusinessStart(cursor, calendar);
      continue;
    }

    const endOfDay = zonedTimeToUtc({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: BUSINESS_DAY_END_HOUR,
      minute: 0,
      second: 0,
    });
    const available = endOfDay.getTime() - cursor.getTime();
    if (available <= 0) {
      cursor = snapToBusinessStart(new Date(endOfDay.getTime() + 1000), calendar);
      continue;
    }

    if (remainingMs <= available) {
      return new Date(cursor.getTime() + remainingMs);
    }
    remainingMs -= available;
    cursor = snapToBusinessStart(new Date(endOfDay.getTime() + 1000), calendar);
  }

  return cursor;
}

export function computeSlaDeadline(
  priority: Priority,
  from: Date,
  calendar: SlaCalendar = defaultSlaCalendar,
): Date {
  const duration = businessDurationForPriority(priority);
  if (duration.kind === 'elapsed') {
    return new Date(from.getTime() + duration.hours * 60 * 60 * 1000);
  }
  return addBusinessHours(from, duration.hours, calendar);
}

/** Vencido: now > slaDeadlineAt (E). */
export function isOverdue(slaDeadlineAt: Date, now: Date): boolean {
  return now.getTime() > slaDeadlineAt.getTime();
}

/**
 * Quando recalcular slaDeadlineAt (T — não é lista explícita do PRD).
 * PolicyEngine só classifica o gatilho; o serviço decide se aplica.
 */
export function shouldRecalculateSla(trigger: SlaRecalcTrigger): boolean {
  switch (trigger) {
    case 'CREATE':
    case 'REOPEN':
    case 'COMPLEMENT_UPDATE':
    case 'PRIORITY_CHANGE':
      return true;
    case 'STATUS_ONLY_CHANGE':
    case 'COSMETIC_OR_INTERNAL':
      return false;
  }
}
