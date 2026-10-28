import type { ConversationListItemData } from '@/components/analyst/analyst-demo-data';

const AVATAR_TONES = [
  'blue',
  'peach',
  'lavender',
  'mint',
  'pink',
  'slate',
  'sand',
] as const satisfies readonly ConversationListItemData['avatarTone'][];

export type AnalystApiConversation = {
  id: string;
  status: string;
  transferSummary: string | null;
  updatedAt: string | Date;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function timeLabel(updatedAt: string | Date): string {
  const d = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function statusFor(status: string): ConversationListItemData['status'] {
  if (status === 'WAITING_ANALYST') {
    return { tone: 'transfer', label: 'Transferida · aguardando' };
  }
  if (status === 'WITH_ANALYST') {
    return { tone: 'active', label: 'Em atendimento' };
  }
  return { tone: 'resolved', label: status };
}

/** Converte conversa da API do analista em item da lista UI. */
export function mapAnalystConversationToListItem(
  conversation: AnalystApiConversation,
  index = 0,
): ConversationListItemData {
  const preview =
    conversation.transferSummary?.trim() ||
    `Conversa com ${conversation.employee.name.split(/\s+/)[0] ?? 'funcionário'}`;

  return {
    id: conversation.id,
    name: conversation.employee.name,
    initials: initials(conversation.employee.name),
    avatarTone: AVATAR_TONES[index % AVATAR_TONES.length]!,
    online: conversation.status === 'WAITING_ANALYST' || conversation.status === 'WITH_ANALYST',
    timeLabel: timeLabel(conversation.updatedAt),
    timeEmphasis: conversation.status === 'WAITING_ANALYST',
    preview,
    previewKind: 'text',
    status: statusFor(conversation.status),
  };
}
