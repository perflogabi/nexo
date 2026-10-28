import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/server-session';

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== 'ANALYST') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { status: 'WAITING_ANALYST' },
        { status: 'WITH_ANALYST', assignedAnalystId: session.employeeId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
    },
    take: 50,
  });

  return NextResponse.json({ conversations });
}
