export type TicketStatusTone = 'waiting' | 'progress' | 'approved' | 'neutral';

export type TicketStatus = {
  label: string;
  tone: TicketStatusTone;
};

const TONE_DOT: Record<TicketStatusTone, string> = {
  waiting: 'bg-[var(--color-warning)]',
  progress: 'bg-[var(--color-brand-blue)]',
  approved: 'bg-[var(--color-success)]',
  neutral: 'bg-[var(--color-text-muted)]',
};

const TONE_TEXT: Record<TicketStatusTone, string> = {
  waiting: 'text-[var(--color-warning-text)]',
  progress: 'text-[var(--color-text-muted)]',
  approved: 'text-[var(--color-text-muted)]',
  neutral: 'text-[var(--color-text-muted)]',
};

export function ticketStatusDotClass(tone: TicketStatusTone): string {
  return TONE_DOT[tone];
}

export function ticketStatusTextClass(tone: TicketStatusTone): string {
  return TONE_TEXT[tone];
}
