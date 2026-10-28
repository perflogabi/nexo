import { NextResponse } from 'next/server';
import { isAgentPaused } from '@/domain/conversation-status';
import { analystMayAccessConversation } from '@/lib/analyst-conversation-access';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';
import type { AuthorType, ConversationStatus } from '@/domain/types';

type Params = { params: Promise<{ id: string }> };

type MessageRow = {
  id: string;
  conversationId: string;
  authorType: AuthorType;
  authorId: string | null;
  content: string;
  structuredPayload: unknown;
  createdAt: Date;
};

async function resolveAuthorNames(messages: MessageRow[]) {
  const ids = [
    ...new Set(
      messages
        .filter((m) => (m.authorType === 'EMPLOYEE' || m.authorType === 'ANALYST') && m.authorId)
        .map((m) => m.authorId as string),
    ),
  ];
  if (ids.length === 0) return new Map<string, string>();
  const employees = await prisma.employee.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(employees.map((e) => [e.id, e.name]));
}

function serializeMessage(m: MessageRow, names: Map<string, string>) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    authorType: m.authorType,
    authorId: m.authorId,
    content: m.content,
    structuredPayload: m.structuredPayload,
    createdAt: m.createdAt,
    authorName:
      m.authorId && (m.authorType === 'EMPLOYEE' || m.authorType === 'ANALYST')
        ? (names.get(m.authorId) ?? null)
        : m.authorType === 'AGENT'
          ? 'Nexo Assist'
          : null,
  };
}

export async function GET(_request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
    },
  });
  if (!conversation) {
    return NextResponse.json({ error: { code: 'CONVERSATION_NOT_FOUND' } }, { status: 404 });
  }
  if (
    !analystMayAccessConversation({
      analystId: session.employeeId,
      status: conversation.status as ConversationStatus,
      assignedAnalystId: conversation.assignedAnalystId,
    })
  ) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });
  const names = await resolveAuthorNames(messages as MessageRow[]);

  return NextResponse.json({
    conversation,
    messages: messages.map((m) => serializeMessage(m as MessageRow, names)),
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';
  if (!content) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'content required' } },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: { code: 'CONVERSATION_NOT_FOUND' } }, { status: 404 });
  }
  if (
    conversation.status !== 'WITH_ANALYST' ||
    conversation.assignedAnalystId !== session.employeeId
  ) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }
  if (!isAgentPaused(conversation.status as ConversationStatus)) {
    return NextResponse.json({ error: { code: 'INVALID_STATE' } }, { status: 409 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      authorType: 'ANALYST',
      authorId: session.employeeId,
      content,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  const analyst = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: { name: true },
  });

  return NextResponse.json(
    {
      message: {
        id: message.id,
        conversationId: message.conversationId,
        authorType: message.authorType,
        authorId: message.authorId,
        content: message.content,
        structuredPayload: message.structuredPayload,
        createdAt: message.createdAt,
        authorName: analyst?.name ?? null,
      },
    },
    { status: 201 },
  );
}
