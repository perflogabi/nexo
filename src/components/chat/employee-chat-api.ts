type ApiErrorBody = { error?: { code?: string; reason?: string; message?: string } };

export type EmployeeApiConversation = {
  id: string;
  status: string;
  messageCount: number;
  updatedAt: string | Date;
};

export type EmployeeApiMessage = {
  id: string;
  conversationId: string;
  authorType: string;
  authorId: string | null;
  content: string;
  createdAt: string | Date;
};

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.code ?? body.error?.message ?? `HTTP_${res.status}`;
  } catch {
    return `HTTP_${res.status}`;
  }
}

/** Prefere fila/analista; senão WITH_AGENT mais recente; ignora CLOSED. */
export function pickActiveConversation(
  conversations: EmployeeApiConversation[],
): EmployeeApiConversation | null {
  const open = conversations.filter((c) => c.status !== 'CLOSED');
  const waiting = open.find((c) => c.status === 'WAITING_ANALYST');
  if (waiting) return waiting;
  const withAnalyst = open.find((c) => c.status === 'WITH_ANALYST');
  if (withAnalyst) return withAnalyst;
  const withAgent = open
    .filter((c) => c.status === 'WITH_AGENT')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return withAgent[0] ?? null;
}

export async function fetchMyConversations(): Promise<EmployeeApiConversation[]> {
  const res = await fetch('/api/conversations', { method: 'GET' });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { conversations: EmployeeApiConversation[] };
  return data.conversations ?? [];
}

export async function fetchConversationMessages(
  id: string,
): Promise<{ conversation: EmployeeApiConversation; messages: EmployeeApiMessage[] }> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    conversation: EmployeeApiConversation;
    messages: EmployeeApiMessage[];
  };
}

export async function sendEmployeeMessage(
  id: string,
  content: string,
): Promise<{
  message: EmployeeApiMessage;
  conversation: EmployeeApiConversation;
}> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    message: EmployeeApiMessage;
    conversation: EmployeeApiConversation;
  };
}
