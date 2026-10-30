/**
 * Execução tipada das tools do agent — domain/services, sem LLM.
 * Usado pelo mock e pelas wrappers Mastra / Gemini function-calling.
 */

import { shouldTransfer, type TransferSignals } from '@/domain/transfer';
import { findDuplicateOrReopenCandidate } from '@/domain/duplicity';
import { normalizeTicketDraftFields } from '@/domain/ticket-draft-normalize';
import type { Category, Priority, TicketType } from '@/domain/types';
import type { AgentToolCallTrace } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';

export type ToolResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  trace: AgentToolCallTrace;
};

function okTrace(name: string, summary: string): AgentToolCallTrace {
  return { name, ok: true, summary };
}

function failTrace(name: string, summary: string): AgentToolCallTrace {
  return { name, ok: false, summary };
}

export async function toolSearchHelpCenter(
  ctx: AgentToolContext,
  query: string,
): Promise<ToolResult<Array<{ slug: string; title: string; excerpt: string }>>> {
  try {
    const articles = await ctx.help.search(query);
    const data = articles.slice(0, 5).map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.body.slice(0, 160),
    }));
    return {
      ok: true,
      data,
      trace: okTrace('searchHelpCenter', `${data.length} artigo(s) para "${query}"`),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'search_failed';
    return { ok: false, error: msg, trace: failTrace('searchHelpCenter', msg) };
  }
}

export async function toolListMyTickets(
  ctx: AgentToolContext,
): Promise<
  ToolResult<Array<{ id: string; number: string; title: string; status: string; priority: string }>>
> {
  try {
    const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
    const data = tickets.map((t) => ({
      id: t.id,
      number: t.number,
      title: t.title,
      status: t.status,
      priority: t.priority,
    }));
    return {
      ok: true,
      data,
      // Label estável para a UI (o número exibido no texto/lista pode filtrar abertos).
      trace: okTrace('listMyTickets', 'consultou seus chamados'),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'list_failed';
    return { ok: false, error: msg, trace: failTrace('listMyTickets', msg) };
  }
}

export async function toolGetTicket(
  ctx: AgentToolContext,
  ticketId: string,
): Promise<ToolResult<Record<string, unknown>>> {
  try {
    let id = ticketId.trim();
    // Gemini às vezes passa o número (INC-0001) em vez do id interno.
    if (/^(INC|REQ)-\d+$/i.test(id)) {
      const all = await ctx.tickets.listMyTickets(ctx.employeeId);
      const found = all.find((row) => row.number.toUpperCase() === id.toUpperCase());
      if (!found) {
        return {
          ok: false,
          error: 'TICKET_NOT_FOUND',
          trace: failTrace('getTicket', `Ticket not found: ${id}`),
        };
      }
      id = found.id;
    }
    const t = await ctx.tickets.getTicket(id, ctx.employeeId);
    const data = {
      id: t.id,
      number: t.number,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      slaDeadlineAt: t.slaDeadlineAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
    };
    return {
      ok: true,
      data,
      trace: okTrace('getTicket', t.number),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'get_failed';
    return { ok: false, error: msg, trace: failTrace('getTicket', msg) };
  }
}

export async function toolFindDuplicateOrReopen(
  ctx: AgentToolContext,
  input: { title: string; category: Category; type?: TicketType },
): Promise<ToolResult<{ kind: string; ticketId?: string; score?: number } | null>> {
  try {
    const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
    const decision = findDuplicateOrReopenCandidate(
      {
        ownerEmployeeId: ctx.employeeId,
        title: input.title,
        category: input.category,
        type: input.type,
      },
      tickets.map((t) => ({
        id: t.id,
        ownerEmployeeId: t.ownerEmployeeId,
        title: t.title,
        category: t.category,
        type: t.type,
        status: t.status,
        updatedAt: t.updatedAt,
        resolvedAt: t.resolvedAt,
      })),
    );
    return {
      ok: true,
      data: decision
        ? { kind: decision.kind, ticketId: decision.ticketId, score: decision.score }
        : null,
      trace: okTrace(
        'findDuplicateOrReopenCandidate',
        decision ? `${decision.kind} ${decision.ticketId}` : 'none',
      ),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'dup_failed';
    return { ok: false, error: msg, trace: failTrace('findDuplicateOrReopenCandidate', msg) };
  }
}

export async function toolPrepareTicketDraft(
  ctx: AgentToolContext,
  input: {
    operation: 'CREATE' | 'UPDATE' | 'REOPEN';
    type: TicketType | string;
    title: string;
    description: string;
    category: Category | string;
    priority: Priority | string;
    ticketId?: string;
  },
): Promise<
  ToolResult<{
    token: string;
    expiresAt: string;
    operation: string;
    type: TicketType;
    category: Category;
    priority: Priority;
    title: string;
    description: string;
  }>
> {
  try {
    const fields = normalizeTicketDraftFields(input);
    const result = await ctx.tickets.prepareTicketDraft({
      sessionEmployeeId: ctx.employeeId,
      conversationId: ctx.conversationId,
      operation: input.operation,
      payload: {
        ticketId: input.ticketId,
        type: fields.type,
        title: input.title,
        description: input.description,
        category: fields.category,
        priority: fields.priority,
        affectedEmployeeId: ctx.employeeId,
      },
    });
    return {
      ok: true,
      data: {
        token: result.token,
        expiresAt: result.expiresAt.toISOString(),
        operation: result.operation,
        type: fields.type,
        category: fields.category,
        priority: fields.priority,
        title: input.title,
        description: input.description,
      },
      trace: okTrace('prepareTicketDraft', `${result.operation} → confirmação pendente`),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'prepare_failed';
    return { ok: false, error: msg, trace: failTrace('prepareTicketDraft', msg) };
  }
}

/**
 * Confirm via serviço — usado por API/UI, **não** exposto como tool do LLM.
 */
export async function toolConfirmTicketMutation(
  ctx: AgentToolContext,
  token: string,
): Promise<ToolResult<{ number: string; status: string }>> {
  try {
    const result = await ctx.tickets.confirmTicketMutation({
      token,
      sessionEmployeeId: ctx.employeeId,
      expectedConversationId: ctx.conversationId,
    });
    return {
      ok: true,
      data: { number: result.ticket.number, status: result.ticket.status },
      trace: okTrace('confirmTicketMutation', `${result.ticket.number} ${result.ticket.status}`),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'confirm_failed';
    return { ok: false, error: msg, trace: failTrace('confirmTicketMutation', msg) };
  }
}

export function toolEvaluateTransfer(signals: TransferSignals): ToolResult<{
  transfer: boolean;
  reasonCode?: string;
}> {
  const decision = shouldTransfer(signals);
  if (decision.transfer) {
    return {
      ok: true,
      data: { transfer: true, reasonCode: decision.reasonCode },
      trace: okTrace('evaluateTransfer', decision.reasonCode),
    };
  }
  return {
    ok: true,
    data: { transfer: false },
    trace: okTrace('evaluateTransfer', 'no_transfer'),
  };
}
