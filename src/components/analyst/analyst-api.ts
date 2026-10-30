import {
  mapAnalystConversationToListItem,
  type AnalystApiConversation,
} from '@/components/analyst/map-analyst-conversation';
import {
  mapAnalystApiMessage,
  type AnalystApiMessage,
} from '@/components/analyst/map-analyst-message';
import {
  mapTicketsForAnalystPanel,
  type AnalystApiTicket,
  type AnalystTicketsPanelModel,
} from '@/components/analyst/map-analyst-tickets';
import type {
  AnalystChatMessage,
  ConversationListItemData,
} from '@/components/analyst/analyst-demo-data';

type ApiErrorBody = { error?: { code?: string; reason?: string; message?: string } };

const NO_STORE: RequestInit = { cache: 'no-store' };

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.code ?? body.error?.message ?? `HTTP_${res.status}`;
  } catch {
    return `HTTP_${res.status}`;
  }
}

export type AnalystConversationDetail = {
  id: string;
  status: string;
  transferSummary: string | null;
  updatedAt: string | Date;
  assignedAnalystId: string | null;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
};

export async function fetchAnalystConversations(): Promise<ConversationListItemData[]> {
  const res = await fetch('/api/analyst/conversations', { method: 'GET', ...NO_STORE });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { conversations: AnalystApiConversation[] };
  return (data.conversations ?? []).map(mapAnalystConversationToListItem);
}

export async function claimAnalystConversation(id: string): Promise<void> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
}

export async function returnAnalystConversation(id: string): Promise<void> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/return`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
}

export async function closeAnalystConversation(id: string): Promise<void> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/close`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
}

export async function fetchAnalystMessages(
  id: string,
): Promise<{ conversation: AnalystConversationDetail; messages: AnalystChatMessage[] }> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'GET',
    ...NO_STORE,
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as {
    conversation: AnalystConversationDetail;
    messages: AnalystApiMessage[];
  };
  return {
    conversation: data.conversation,
    messages: (data.messages ?? []).map(mapAnalystApiMessage),
  };
}

export async function sendAnalystMessage(id: string, content: string): Promise<AnalystChatMessage> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as { message: AnalystApiMessage };
  return mapAnalystApiMessage(data.message);
}

export async function fetchAnalystTicketsPanel(
  id: string,
  claimed: boolean,
): Promise<AnalystTicketsPanelModel> {
  const res = await fetch(`/api/analyst/conversations/${encodeURIComponent(id)}/tickets`, {
    method: 'GET',
    ...NO_STORE,
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json()) as {
    conversation: {
      id: string;
      status: string;
      assignedAnalystId: string | null;
      transferSummary: string | null;
      updatedAt?: string | Date;
      employee: { id: string; name: string; department: string | null };
    };
    tickets: AnalystApiTicket[];
  };
  return mapTicketsForAnalystPanel({
    employeeName: data.conversation.employee.name,
    tickets: data.tickets ?? [],
    claimed,
    conversationStatus: data.conversation.status,
    transferSummary: data.conversation.transferSummary,
    updatedAt: data.conversation.updatedAt,
  });
}
