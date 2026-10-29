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
  transferReasonCode?: string | null;
  updatedAt: string | Date;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
  lastMessage?: {
    content: string;
    authorType: string;
    createdAt?: string | Date;
  } | null;
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
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (!sameDay) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    return isYesterday
      ? 'ontem'
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 2) return 'agora';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function statusFor(
  status: string,
  transferReasonCode?: string | null,
  transferSummary?: string | null,
): ConversationListItemData['status'] {
  if (status === 'WAITING_ANALYST') {
    if (transferReasonCode === 'LOW_CONFIDENCE') {
      const help = transferSummary?.trim();
      return {
        tone: 'help',
        label:
          help?.includes('confiança') || help?.includes('ajuda')
            ? help
            : 'Agent pediu ajuda · confiança baixa',
      };
    }
    const summary = transferSummary?.trim();
    if (summary) {
      return {
        tone: 'transfer',
        label: summary.startsWith('Transferida') ? summary : `Transferida · ${summary}`,
      };
    }
    return { tone: 'transfer', label: 'Transferida · aguardando' };
  }
  if (status === 'WITH_ANALYST') {
    return { tone: 'active', label: 'Em atendimento' };
  }
  if (status === 'WITH_AGENT') {
    if (transferReasonCode === 'LOW_CONFIDENCE') {
      return { tone: 'help', label: 'Agent pediu ajuda · confiança 41%' };
    }
    return { tone: 'active', label: 'Agent atendendo' };
  }
  if (status === 'CLOSED') {
    return { tone: 'resolved', label: 'Resolvida pelo agent' };
  }
  return { tone: 'resolved', label: status };
}

function previewFor(conversation: AnalystApiConversation): {
  preview: string;
  previewKind: ConversationListItemData['previewKind'];
} {
  const last = conversation.lastMessage;
  if (last?.content?.trim()) {
    if (last.authorType === 'AGENT') {
      return {
        preview: `Nexo: ${last.content.trim()}`,
        previewKind: 'nexo',
      };
    }
    return { preview: last.content.trim(), previewKind: 'text' };
  }
  const summary = conversation.transferSummary?.trim();
  if (summary) return { preview: summary, previewKind: 'text' };
  return {
    preview: `Conversa com ${conversation.employee.name.split(/\s+/)[0] ?? 'funcionário'}`,
    previewKind: 'text',
  };
}

/** Converte conversa da API do analista em item da lista UI. */
export function mapAnalystConversationToListItem(
  conversation: AnalystApiConversation,
  index = 0,
): ConversationListItemData {
  const { preview, previewKind } = previewFor(conversation);

  const conversationStatus =
    conversation.status === 'WITH_AGENT' ||
    conversation.status === 'WAITING_ANALYST' ||
    conversation.status === 'WITH_ANALYST' ||
    conversation.status === 'CLOSED'
      ? conversation.status
      : undefined;

  return {
    id: conversation.id,
    name: conversation.employee.name,
    initials: initials(conversation.employee.name),
    avatarTone: AVATAR_TONES[index % AVATAR_TONES.length]!,
    online:
      conversation.status === 'WAITING_ANALYST' ||
      conversation.status === 'WITH_ANALYST' ||
      conversation.status === 'WITH_AGENT',
    timeLabel: timeLabel(conversation.updatedAt),
    timeEmphasis: conversation.status === 'WAITING_ANALYST',
    preview,
    previewKind,
    conversationStatus,
    status: statusFor(
      conversation.status,
      conversation.transferReasonCode,
      conversation.transferSummary,
    ),
  };
}
