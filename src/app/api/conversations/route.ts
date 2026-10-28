import { NextResponse } from 'next/server';
import { getConversationService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const conversations = await getConversationService().listMyConversations(session.employeeId);
  return NextResponse.json({ conversations });
}

export async function POST() {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: session ? 'FORBIDDEN' : 'UNAUTHENTICATED' } },
      { status: session ? 403 : 401 },
    );
  }

  const conversation = await getConversationService().createConversation(session.employeeId);
  return NextResponse.json({ conversation }, { status: 201 });
}
