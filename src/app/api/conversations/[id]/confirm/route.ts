import { NextResponse } from 'next/server';
import { ConfirmationInvalidError } from '@/domain/errors';
import { agentRateLimitConfig, clientIpFromRequest, consumeRateLimit } from '@/lib/rate-limit';
import { rateLimitedResponse } from '@/lib/rate-limit-response';
import { getTicketService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

type Params = { params: Promise<{ id: string }> };

/**
 * ConfirmationGate — confirma mutação de chamado com token (UI only).
 * Valida que o pending pertence à conversa da URL.
 */
export async function POST(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit(
    `agent-confirm:${session.employeeId}:${ip}`,
    agentRateLimitConfig(),
  );
  if (!limited.ok) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  const { id: conversationId } = await params;
  const body = (await request.json()) as { token?: string };
  const token = body.token?.trim() ?? '';
  if (!token) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'token required' } },
      { status: 400 },
    );
  }

  try {
    const result = await getTicketService().confirmTicketMutation({
      token,
      sessionEmployeeId: session.employeeId,
      expectedConversationId: conversationId,
    });
    return NextResponse.json({
      conversationId,
      ticket: result.ticket,
      event: result.event,
    });
  } catch (e) {
    if (e instanceof ConfirmationInvalidError) {
      return NextResponse.json(
        { error: { code: e.code, reason: e.reason, message: e.message } },
        { status: 409 },
      );
    }
    throw e;
  }
}
