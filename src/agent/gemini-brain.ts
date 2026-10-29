/**
 * Cérebro Gemini via @google/genai (function calling) + mesmas tools do domínio.
 * Só usado quando AGENT_LLM=gemini e GEMINI_API_KEY está definida.
 */

import { GoogleGenAI, type FunctionDeclaration, type Content } from '@google/genai';
import { mapTicketToDetailPayload, mapTicketsToSelectPayload } from '@/agent/chat-ui-payload';
import { NEXO_AGENT_INSTRUCTIONS } from '@/agent/instructions';
import type { AgentBrain, AgentReplyDraft, AgentToolCallTrace } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  toolConfirmTicketMutation,
  toolFindDuplicateOrReopen,
  toolGetTicket,
  toolListMyTickets,
  toolPrepareTicketDraft,
  toolSearchHelpCenter,
} from '@/agent/tools/execute-tools';
import type { Category, Priority, TicketType, TransferReasonCode } from '@/domain/types';

function ticketNumberInText(text: string): string | null {
  const m = text.match(/\b((?:INC|REQ)-\d+)\b/i);
  return m?.[1]?.toUpperCase() ?? null;
}

/**
 * Free tier: preferir *-lite (quota/latência).
 * Cadeia tentada se 404/429/503 no modelo atual.
 */
const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
] as const;

function modelCandidates(): string[] {
  const ordered = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('"code":404') ||
    msg.includes('"code":429') ||
    msg.includes('"code":503') ||
    msg.includes('NOT_FOUND') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('no longer available')
  );
}

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'searchHelpCenter',
    description: 'Busca artigos na base de ajuda',
    parametersJsonSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'listMyTickets',
    description: 'Lista chamados do funcionário',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
  {
    name: 'getTicket',
    description: 'Detalhe de chamado',
    parametersJsonSchema: {
      type: 'object',
      properties: { ticketId: { type: 'string' } },
      required: ['ticketId'],
    },
  },
  {
    name: 'findDuplicateOrReopenCandidate',
    description: 'Duplicidade/reopen',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        type: { type: 'string' },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'prepareTicketDraft',
    description: 'Staging ConfirmationGate',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string' },
        type: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        priority: { type: 'string' },
        ticketId: { type: 'string' },
      },
      required: ['operation', 'type', 'title', 'description', 'category', 'priority'],
    },
  },
  {
    name: 'confirmTicketMutation',
    description: 'Confirma mutação com token',
    parametersJsonSchema: {
      type: 'object',
      properties: { token: { type: 'string' } },
      required: ['token'],
    },
  },
  {
    name: 'requestAnalystTransfer',
    description: 'Transfere para analista',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        reasonCode: { type: 'string' },
      },
      required: ['summary', 'reasonCode'],
    },
  },
];

async function dispatchTool(
  ctx: AgentToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<{
  result: unknown;
  trace: AgentToolCallTrace;
  transfer?: AgentReplyDraft['transfer'];
  token?: string;
}> {
  switch (name) {
    case 'searchHelpCenter': {
      const r = await toolSearchHelpCenter(ctx, String(args.query ?? ''));
      return { result: r, trace: r.trace };
    }
    case 'listMyTickets': {
      const r = await toolListMyTickets(ctx);
      return { result: r, trace: r.trace };
    }
    case 'getTicket': {
      const r = await toolGetTicket(ctx, String(args.ticketId ?? ''));
      return { result: r, trace: r.trace };
    }
    case 'findDuplicateOrReopenCandidate': {
      const r = await toolFindDuplicateOrReopen(ctx, {
        title: String(args.title ?? ''),
        category: args.category as Category,
        type: args.type as TicketType | undefined,
      });
      return { result: r, trace: r.trace };
    }
    case 'prepareTicketDraft': {
      const r = await toolPrepareTicketDraft(ctx, {
        operation: args.operation as 'CREATE' | 'UPDATE' | 'REOPEN',
        type: args.type as TicketType,
        title: String(args.title ?? ''),
        description: String(args.description ?? ''),
        category: args.category as Category,
        priority: args.priority as Priority,
        ticketId: args.ticketId ? String(args.ticketId) : undefined,
      });
      return { result: r, trace: r.trace, token: r.data?.token };
    }
    case 'confirmTicketMutation': {
      const r = await toolConfirmTicketMutation(ctx, String(args.token ?? ''));
      return { result: r, trace: r.trace };
    }
    case 'requestAnalystTransfer': {
      const summary = String(args.summary ?? 'Transferência solicitada');
      const reasonCode = (args.reasonCode as TransferReasonCode) || 'USER_REQUEST';
      return {
        result: { ok: true, transfer: true },
        trace: { name, ok: true, summary: reasonCode },
        transfer: { summary, reasonCode },
      };
    }
    default:
      return {
        result: { ok: false, error: `unknown_tool:${name}` },
        trace: { name, ok: false, summary: 'unknown_tool' },
      };
  }
}

export function createGeminiAgentBrain(getContext: () => AgentToolContext): AgentBrain {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY required for gemini brain');
  }
  const ai = new GoogleGenAI({ apiKey });
  let activeModel = PRIMARY_MODEL;

  async function generateContent(contents: Content[]) {
    const candidates = [activeModel, ...modelCandidates().filter((m) => m !== activeModel)];
    let lastError: unknown;
    for (const model of candidates) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: NEXO_AGENT_INSTRUCTIONS,
            tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
          },
        });
        if (model !== activeModel) {
          console.info(`[agent] Gemini modelo ativo → ${model}`);
          activeModel = model;
        }
        return response;
      } catch (e) {
        lastError = e;
        if (!isRetryableGeminiError(e)) throw e;
        console.warn(
          `[agent] Gemini modelo ${model} falhou — tentando próximo:`,
          e instanceof Error ? e.message.slice(0, 160) : e,
        );
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  return {
    async generateReply(input): Promise<AgentReplyDraft> {
      const ctx = getContext();
      const traces: AgentToolCallTrace[] = [];
      const actions: AgentReplyDraft['decision']['actions'] = [];
      let transfer: AgentReplyDraft['transfer'] | undefined;
      let confirmationToken: string | undefined;

      const contents: Content[] = [
        ...input.recentMessages.slice(-12).map((m): Content => ({
          role: m.authorType === 'EMPLOYEE' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      ];
      if (
        contents.length === 0 ||
        contents[contents.length - 1]?.role !== 'user' ||
        contents[contents.length - 1]?.parts?.[0]?.text !== input.employeeMessage
      ) {
        contents.push({ role: 'user', parts: [{ text: input.employeeMessage }] });
      }

      for (let step = 0; step < 4; step += 1) {
        const response = await generateContent(contents);

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];
        const fnCalls = parts.filter((p) => p.functionCall);

        if (fnCalls.length === 0) {
          let text =
            parts
              .map((p) => p.text)
              .filter(Boolean)
              .join('\n')
              .trim() || 'Desculpe, não consegui formular uma resposta agora.';
          if (actions.length === 0) {
            actions.push({ code: 'reply', label: 'respondeu' });
          }

          let structuredPayload: unknown;
          let intent = transfer ? 'transfer' : 'gemini_reply';

          // Seleção de chamado (INC-0001 · …) → card de detalhe, nunca repetir a lista.
          const selectedNumber = ticketNumberInText(input.employeeMessage);
          if (selectedNumber && input.employeeMessage.includes('·')) {
            const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
            const match = tickets.find((t) => t.number.toUpperCase() === selectedNumber);
            if (match) {
              structuredPayload = {
                ...mapTicketToDetailPayload(match),
                quickReplies: ['Falar com um analista', 'Adicionar informação', 'Não, obrigado'],
              };
              text =
                match.slaDeadlineAt.getTime() < Date.now() &&
                (match.status === 'OPEN' || match.status === 'WAITING_ANALYST')
                  ? 'Está sem atualização acima do prazo. Quer que eu chame um analista?'
                  : 'Segue o detalhe do chamado. Precisa de mais alguma coisa?';
              intent = 'ticket_detail';
              actions.length = 0;
              actions.push(
                { code: 'get_ticket', label: `consultou o ${selectedNumber}` },
                { code: 'sla', label: 'calculou o prazo' },
              );
            }
          } else {
            const listedTickets = traces.some((t) => t.name === 'listMyTickets' && t.ok);
            const gotTicket = traces.some((t) => t.name === 'getTicket' && t.ok);
            if (gotTicket && selectedNumber) {
              const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
              const match = tickets.find((t) => t.number.toUpperCase() === selectedNumber);
              if (match) {
                structuredPayload = {
                  ...mapTicketToDetailPayload(match),
                  quickReplies: ['Falar com um analista', 'Adicionar informação', 'Não, obrigado'],
                };
                text = 'Segue o detalhe do chamado. Quer que eu chame um analista?';
                intent = 'ticket_detail';
                actions.length = 0;
                actions.push(
                  { code: 'get_ticket', label: `consultou o ${selectedNumber}` },
                  { code: 'sla', label: 'calculou o prazo' },
                );
              }
            } else if (listedTickets) {
              const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
              const forList = tickets
                .filter(
                  (t) =>
                    t.status === 'OPEN' ||
                    t.status === 'WAITING_ANALYST' ||
                    t.status === 'IN_PROGRESS' ||
                    t.status === 'APPROVED',
                )
                .slice(0, 5);
              const use = forList.length > 0 ? forList : tickets.slice(0, 5);
              if (use.length > 0) {
                structuredPayload = mapTicketsToSelectPayload(use);
                text = `Você tem ${use.length} chamado(s). Sobre qual deles quer saber?`;
                intent = 'list_tickets';
                if (
                  !actions.some((a) => a.code === 'list_tickets' || a.label.includes('chamado'))
                ) {
                  actions.unshift({ code: 'list_tickets', label: 'consultou seus chamados' });
                }
              }
            }
          }

          return {
            content: text,
            structuredPayload,
            decision: {
              understoodIntent: intent,
              actions,
              rationale: 'Resposta Gemini com tools do domínio.',
              policyHits: transfer ? [transfer.reasonCode] : [],
              toolCalls: traces,
              modelConfidence: null,
              presentedAssurance: transfer ? 'HIGH' : 'MEDIUM',
            },
            transfer,
            confirmationToken,
          };
        }

        contents.push({ role: 'model', parts });

        const fnResponseParts: Content['parts'] = [];
        for (const part of fnCalls) {
          const fc = part.functionCall!;
          const name = fc.name ?? 'unknown';
          const args = (fc.args ?? {}) as Record<string, unknown>;
          const dispatched = await dispatchTool(ctx, name, args);
          traces.push(dispatched.trace);
          if (dispatched.transfer) transfer = dispatched.transfer;
          if (dispatched.token) confirmationToken = dispatched.token;
          actions.push({ code: name, label: dispatched.trace.summary });
          fnResponseParts!.push({
            functionResponse: {
              name,
              response: dispatched.result as Record<string, unknown>,
            },
          });
        }
        contents.push({ role: 'user', parts: fnResponseParts });
      }

      return {
        content:
          'Precisei de vários passos com as ferramentas. Pode reformular o pedido ou pedir um analista?',
        decision: {
          understoodIntent: 'tool_loop_exhausted',
          actions,
          rationale: 'Limite de passos de function-calling.',
          policyHits: ['tool_loop_limit'],
          toolCalls: traces,
          modelConfidence: null,
          presentedAssurance: 'LOW',
        },
        transfer,
        confirmationToken,
      };
    },
  };
}
