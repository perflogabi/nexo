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
  if (current.assignedAnalystId !== session.employeeId) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }
  if (!canTransitionConversation(current.status, 'WITH_AGENT')) {
    return NextResponse.json({ error: { code: 'INVALID_TRANSITION' } }, { status: 409 });
  }

  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      status: 'WITH_AGENT',
      assignedAnalystId: null,
    },
  });

  return NextResponse.json({ conversation });
}
