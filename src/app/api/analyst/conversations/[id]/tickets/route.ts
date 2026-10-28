import { NextResponse } from 'next/server';
import { canAnalystAccessTicket } from '@/domain/authorization-scope';
import { analystMayAccessConversation } from '@/lib/analyst-conversation-access';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';
import type { ConversationStatus } from '@/domain/types';

type Params = { params: Promise<{ id: string }> };

/**
 * Tickets do owner da conversa em contexto (authz: canAnalystAccessTicket).
 */
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

  const tickets = await prisma.ticket.findMany({
    where: { ownerEmployeeId: conversation.employeeId },
    orderBy: { updatedAt: 'desc' },
  });

  const scoped = tickets.filter((t) =>
    canAnalystAccessTicket({
      analystId: session.employeeId,
      role: 'ANALYST',
      conversationEmployeeId: conversation.employeeId,
      conversationStatus: conversation.status as ConversationStatus,
      assignedAnalystId: conversation.assignedAnalystId,
      ticketOwnerEmployeeId: t.ownerEmployeeId,
    }),
  );

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      assignedAnalystId: conversation.assignedAnalystId,
      transferSummary: conversation.transferSummary,
      updatedAt: conversation.updatedAt,
      employee: conversation.employee,
    },
    tickets: scoped,
  });
}
