import { NextResponse } from 'next/server';
import { dedupeAnalystConversationsByEmployee } from '@/lib/dedupe-analyst-conversations';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';

/**
 * Lista do console: fila + minhas + com agent + resolvidas.
 * Uma conversa por funcionário (fila / atendimento prevalecem sobre /chat).
 */
export async function GET() {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const rows = await prisma.conversation.findMany({
    where: {
      OR: [
        { status: 'WAITING_ANALYST' },
        { status: 'WITH_ANALYST', assignedAnalystId: session.employeeId },
        { status: 'WITH_AGENT' },
        { status: 'CLOSED' },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, authorType: true, createdAt: true },
      },
    },
    take: 80,
  });

  const conversations = dedupeAnalystConversationsByEmployee(rows).map((c) => ({
    id: c.id,
    status: c.status,
    transferSummary: c.transferSummary,
    transferReasonCode: c.transferReasonCode,
    assignedAnalystId: c.assignedAnalystId,
    updatedAt: c.updatedAt,
    employee: c.employee,
    lastMessage: c.messages[0]
      ? {
          content: c.messages[0].content,
          authorType: c.messages[0].authorType,
          createdAt: c.messages[0].createdAt,
        }
      : null,
  }));

  return NextResponse.json({ conversations });
}
