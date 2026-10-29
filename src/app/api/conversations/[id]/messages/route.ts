import { NextResponse } from 'next/server';
import {
  AgentPausedError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  MessageLimitExceededError,
} from '@/domain/errors';
import { agentRateLimitConfig, clientIpFromRequest, consumeRateLimit } from '@/lib/rate-limit';
import { rateLimitedResponse } from '@/lib/rate-limit-response';
import { getAgentOrchestrator, getConversationService } from '@/lib/services';
import { readSession } from '@/lib/server-session';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const { id } = await params;
  try {
    const service = getConversationService();
    const [conversation, messages] = await Promise.all([
      service.getConversation(id, session.employeeId),
      service.listMessages(id, session.employeeId),
    ]);
    return NextResponse.json({ conversation, messages });
  } catch (e) {
    return mapError(e);
  }
}

export async function POST(request: Request, { params }: Params) {
  const session = await readSession();
  if (!session || session.role !== 'EMPLOYEE') {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', reason: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  const { id } = await params;
  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit(`agent:${session.employeeId}:${ip}`, agentRateLimitConfig());
  if (!limited.ok) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';
  if (!content) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'content required' } },
      { status: 400 },
    );
  }

  const agent = getAgentOrchestrator();
  try {
    agent.bindContext({
      employeeId: session.employeeId,
      conversationId: id,
    });
    const result = await agent.orchestrator.runEmployeeTurn({
      conversationId: id,
      employeeId: session.employeeId,
      content,
    });

    return NextResponse.json(
      {
        message: result.employeeMessage,
        agentMessage: result.agentMessage,
        conversation: result.conversation,
        trace: result.trace,
        confirmationToken: result.confirmationToken ?? null,
      },
      { status: 201 },
    );
  } catch (e) {
    return mapError(e);
  } finally {
    agent.clearContext();
  }
}

function mapError(e: unknown) {
  if (e instanceof MessageLimitExceededError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 409 });
  }
  if (e instanceof AgentPausedError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 409 });
  }
  if (e instanceof ConversationAccessDeniedError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 403 });
  }
  if (e instanceof ConversationNotFoundError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 404 });
  }
  throw e;
}
