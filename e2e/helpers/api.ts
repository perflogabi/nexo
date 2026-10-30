import type { APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

export async function createConversation(request: APIRequestContext) {
  const res = await request.post('/api/conversations');
  if (!res.ok()) throw new Error(`createConversation ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as {
    conversation: { id: string; status: string; messageCount?: number };
  };
  if (!body.conversation?.id) throw new Error('conversation id missing');
  return body.conversation;
}

export async function getConversation(request: APIRequestContext, conversationId: string) {
  const res = await request.get(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
  if (!res.ok()) throw new Error(`getConversation ${res.status()}`);
  return res.json() as Promise<{
    conversation: { id: string; status: string; messageCount: number };
    messages: Array<{ id: string; authorType: string; content: string }>;
  }>;
}

export async function postMessage(
  request: APIRequestContext,
  conversationId: string,
  content: string,
) {
  const res = await request.post(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.10' },
      data: { content },
    },
  );
  return { status: res.status(), body: await res.json() };
}

export async function postConfirm(
  request: APIRequestContext,
  conversationId: string,
  token: string,
) {
  const res = await request.post(
    `/api/conversations/${encodeURIComponent(conversationId)}/confirm`,
    {
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.11' },
      data: { token },
    },
  );
  return { status: res.status(), body: await res.json() };
}

export async function analystClaim(request: APIRequestContext, conversationId: string) {
  const res = await request.post(
    `/api/analyst/conversations/${encodeURIComponent(conversationId)}/claim`,
  );
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

export async function analystReturn(request: APIRequestContext, conversationId: string) {
  const res = await request.post(
    `/api/analyst/conversations/${encodeURIComponent(conversationId)}/return`,
  );
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

export async function analystClose(request: APIRequestContext, conversationId: string) {
  const res = await request.post(
    `/api/analyst/conversations/${encodeURIComponent(conversationId)}/close`,
  );
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

export async function analystMessage(
  request: APIRequestContext,
  conversationId: string,
  content: string,
) {
  const res = await request.post(
    `/api/analyst/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: { content },
    },
  );
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

export function e2ePrisma(): PrismaClient {
  if (process.env.E2E_DATABASE_OK !== '1') {
    throw new Error('E2E_DATABASE_OK required for prisma helper');
  }
  return new PrismaClient();
}

export async function findTicketsByTitleMarker(marker: string, ownerEmployeeId?: string) {
  const prisma = e2ePrisma();
  try {
    return await prisma.ticket.findMany({
      where: {
        title: { contains: marker },
        ...(ownerEmployeeId ? { ownerEmployeeId } : {}),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
