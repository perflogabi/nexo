import type { AnalystChatMessage } from '@/components/analyst/analyst-demo-data';

export type AnalystApiMessage = {
  id: string;
  authorType: string;
  authorId: string | null;
  content: string;
  createdAt: string | Date;
  authorName?: string | null;
};

function timeLabel(createdAt: string | Date): string {
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** API Message → bolha do console. */
export function mapAnalystApiMessage(message: AnalystApiMessage): AnalystChatMessage {
  const time = timeLabel(message.createdAt);
  const text = message.content;

  switch (message.authorType) {
    case 'EMPLOYEE':
      return { id: message.id, kind: 'employee', time, text };
    case 'ANALYST':
      return {
        id: message.id,
        kind: 'analyst',
        time,
        text,
        author: message.authorName?.trim() || 'Analista',
        team: 'Suporte N2',
      };
    case 'SYSTEM': {
      const lower = text.toLowerCase();
      const icon = lower.includes('assum') ? ('claim' as const) : ('transfer' as const);
      return {
        id: message.id,
        kind: 'system',
        time,
        text: text.includes('·') ? text : `${text} · ${time}`,
        icon,
      };
    }
    case 'AGENT':
    default:
      return { id: message.id, kind: 'ia', time, text };
  }
}
