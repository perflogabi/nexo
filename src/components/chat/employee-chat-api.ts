type ApiErrorBody = { error?: { code?: string; reason?: string; message?: string } };

const NO_STORE: RequestInit = { cache: 'no-store' };

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
  structuredPayload?: unknown | null;
};

export type EmployeeApiTrace = {
  id: string;
  messageId: string;
  understoodIntent: string;
  actions: unknown;
  rationale: string;
  policyHits: unknown;
  toolCalls: unknown;
  modelConfidence: number | null;
  presentedAssurance: string;
};

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.code ?? body.error?.message ?? `HTTP_${res.status}`;
  } catch {
    return `HTTP_${res.status}`;
  }
}

/**
 * Conversa do /chat com o Nexo Assist.
 * Prefere WITH_AGENT → WITH_ANALYST → WAITING_ANALYST.
 * Se só houver CLOSED, devolve a mais recente (indicação de encerramento).
 */
export function pickActiveConversation(
  conversations: EmployeeApiConversation[],
): EmployeeApiConversation | null {
  const open = conversations.filter((c) => c.status !== 'CLOSED');
  const withAgent = open
    .filter((c) => c.status === 'WITH_AGENT')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (withAgent[0]) return withAgent[0];

  const withAnalyst = open
    .filter((c) => c.status === 'WITH_ANALYST')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (withAnalyst[0]) return withAnalyst[0];

  const waiting = open
    .filter((c) => c.status === 'WAITING_ANALYST')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (waiting[0]) return waiting[0];

  const closed = conversations
    .filter((c) => c.status === 'CLOSED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return closed[0] ?? null;
}

/** Sessão em que o agent ainda pode responder. */
export function pickAgentChatConversation(
  conversations: EmployeeApiConversation[],
): EmployeeApiConversation | null {
  return (
    conversations
      .filter((c) => c.status === 'WITH_AGENT')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null
  );
}

export async function fetchMyConversations(): Promise<EmployeeApiConversation[]> {
  const res = await fetch('/api/conversations', { method: 'GET', ...NO_STORE });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { conversations: EmployeeApiConversation[] };
  return data.conversations ?? [];
}

export async function createMyConversation(): Promise<EmployeeApiConversation> {
  const res = await fetch('/api/conversations', { method: 'POST' });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { conversation: EmployeeApiConversation };
  return data.conversation;
}

export async function fetchConversationMessages(
  id: string,
): Promise<{ conversation: EmployeeApiConversation; messages: EmployeeApiMessage[] }> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'GET',
    ...NO_STORE,
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
  agentMessage: EmployeeApiMessage | null;
  conversation: EmployeeApiConversation;
  trace: EmployeeApiTrace | null;
  confirmationToken: string | null;
}> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    message: EmployeeApiMessage;
    agentMessage: EmployeeApiMessage | null;
    conversation: EmployeeApiConversation;
    trace: EmployeeApiTrace | null;
    confirmationToken: string | null;
  };
}

export async function confirmTicketDraft(
  conversationId: string,
  token: string,
): Promise<{ ticket: { id: string; number: string; status: string }; event: unknown }> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    ticket: { id: string; number: string; status: string };
    event: unknown;
  };
}

export function actionLabelsFromTrace(trace: EmployeeApiTrace | null | undefined): string[] {
  if (!trace || !Array.isArray(trace.actions)) return ['respondeu'];
  return (trace.actions as Array<{ label?: string; code?: string }>)
    .map((a) => {
      const raw = a.label || a.code;
      if (!raw) return null;
      // Evita chip “N chamado(s)” desalinhado da lista filtrada na UI.
      if (/^\d+\s+chamado/.test(raw)) return 'consultou seus chamados';
      return raw;
    })
    .filter((x): x is string => Boolean(x));
}
