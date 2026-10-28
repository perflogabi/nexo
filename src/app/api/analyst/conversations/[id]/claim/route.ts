import { NextResponse } from 'next/server';
import { canTransitionConversation } from '@/domain/transfer';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const { id } = await params;
  const current = await prisma.conversation.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: { code: 'CONVERSATION_NOT_FOUND' } }, { status: 404 });
  }
  if (!canTransitionConversation(current.status, 'WITH_ANALYST')) {
    return NextResponse.json({ error: { code: 'INVALID_TRANSITION' } }, { status: 409 });
  }

  const result = await prisma.conversation.updateMany({
    where: {
      id,
      status: 'WAITING_ANALYST',
      assignedAnalystId: null,
    },
    data: {
      status: 'WITH_ANALYST',
      assignedAnalystId: session.employeeId,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: { code: 'CONVERSATION_CLAIM_CONFLICT' } }, { status: 409 });
  }

  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  await prisma.message.create({
    data: {
      conversationId: id,
      authorType: 'SYSTEM',
      authorId: null,
      content: `Assumido por você · ${time}`,
      createdAt: now,
    },
  });

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  return NextResponse.json({ conversation });
}
