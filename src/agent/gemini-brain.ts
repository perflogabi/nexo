/**
 * Cérebro Gemini via @google/genai (function calling) + mesmas tools do domínio.
 * Só usado quando AGENT_LLM=gemini e GEMINI_API_KEY está definida.
 */

import { GoogleGenAI, type FunctionDeclaration, type Content } from '@google/genai';
import { assertGeminiApiKey } from '@/lib/gemini-api-key';
import { safeErrorMessage } from '@/lib/redact-secrets';
import {
  ADD_INFO_REPLY,
  ANALYST_TRANSFER_REPLY,
  DISMISS_REPLY,
  isAddInfoRequest,
  isAnalystRequest,
  isPoliteDismiss,
} from '@/agent/chat-followups';
import {
  mapTicketDraftPayload,
  mapTicketToDetailPayload,
  mapTicketsToSelectPayload,
} from '@/agent/chat-ui-payload';
import { NEXO_AGENT_INSTRUCTIONS } from '@/agent/instructions';
import type { AgentBrain, AgentReplyDraft, AgentToolCallTrace } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  toolFindDuplicateOrReopen,
  toolGetTicket,
  toolListMyTickets,
  toolPrepareTicketDraft,
  toolSearchHelpCenter,
} from '@/agent/tools/execute-tools';
import {
  openishTickets,
  resolveTicketForDetail,
  shouldShowDetailInsteadOfList,
} from '@/agent/ticket-ui-resolution';
import { normalizeCategory, normalizeTicketType } from '@/domain/ticket-draft-normalize';
import { normalizeTransferReasonCode } from '@/domain/transfer-reason-normalize';
import type { PendingOperation } from '@/domain/types';
import type { TicketRecord } from '@/services/tickets/types';

function detailUi(match: TicketRecord): {
  text: string;
  structuredPayload: unknown;
  actions: AgentReplyDraft['decision']['actions'];
} {
  const overdue =
    match.slaDeadlineAt.getTime() < Date.now() &&
    (match.status === 'OPEN' || match.status === 'WAITING_ANALYST');
  return {
    text: overdue
      ? 'Está sem atualização acima do prazo. Quer que eu chame um analista?'
      : 'Segue o detalhe do chamado. Precisa de mais alguma coisa?',
    structuredPayload: {
      ...mapTicketToDetailPayload(match),
      quickReplies: ['Falar com um analista', 'Adicionar informação', 'Não, obrigado'],
    },
    actions: [
      { code: 'get_ticket', label: `consultou o ${match.number}` },
      { code: 'sla', label: 'calculou o prazo' },
    ],
  };
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
    description:
      'Staging ConfirmationGate — só prepara rascunho. NÃO confirme; a UI do funcionário confirma. type deve ser INC ou REQ; category ACESSO|REDE_VPN|HARDWARE|SOFTWARE|EMAIL|OUTROS; priority CRITICAL|HIGH|MEDIUM|LOW.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'CREATE | UPDATE | REOPEN' },
        type: { type: 'string', description: 'INC ou REQ (não use INCIDENT/REQUEST)' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: {
          type: 'string',
          description: 'ACESSO | REDE_VPN | HARDWARE | SOFTWARE | EMAIL | OUTROS',
        },
        priority: { type: 'string', description: 'CRITICAL | HIGH | MEDIUM | LOW' },
        ticketId: { type: 'string' },
      },
      required: ['operation', 'type', 'title', 'description', 'category', 'priority'],
    },
  },
  {
    name: 'requestAnalystTransfer',
    description:
      'Transfere para analista. reasonCode DEVE ser exatamente um de: USER_REQUEST | CRITICAL | OVERDUE | LOW_CONFIDENCE',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        reasonCode: {
          type: 'string',
          description: 'USER_REQUEST | CRITICAL | OVERDUE | LOW_CONFIDENCE',
        },
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
  draftPayload?: AgentReplyDraft['structuredPayload'];
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
        category: normalizeCategory(args.category),
        type: args.type != null ? normalizeTicketType(args.type) : undefined,
      });
      return { result: r, trace: r.trace };
    }
    case 'prepareTicketDraft': {
      const operation = args.operation as PendingOperation;
      const r = await toolPrepareTicketDraft(ctx, {
        operation,
        type: String(args.type ?? 'INC'),
        title: String(args.title ?? ''),
        description: String(args.description ?? ''),
        category: String(args.category ?? 'OUTROS'),
        priority: String(args.priority ?? 'MEDIUM'),
        ticketId: args.ticketId ? String(args.ticketId) : undefined,
      });
      if (!r.ok || !r.data) {
        return { result: r, trace: r.trace };
      }
      const draftPayload = mapTicketDraftPayload({
        operation,
        type: r.data.type,
        title: r.data.title,
        description: r.data.description,
        category: r.data.category,
        priority: r.data.priority,
        confirmationToken: r.data.token,
        expiresAt: r.data.expiresAt,
      });
      // Não devolver o token cru ao modelo — só à UI via structuredPayload / confirmationToken.
      return {
        result: {
          ...r,
          data: {
            operation: r.data.operation,
            type: r.data.type,
            category: r.data.category,
            priority: r.data.priority,
            expiresAt: r.data.expiresAt,
            pendingConfirmation: true,
          },
        },
        trace: r.trace,
        token: r.data.token,
        draftPayload,
      };
    }
    case 'confirmTicketMutation': {
      return {
        result: {
          ok: false,
          error:
            'confirmTicketMutation não está disponível ao agent. Peça ao funcionário para clicar em Confirmar na UI.',
        },
        trace: { name, ok: false, summary: 'ui_only_confirm' },
      };
    }
    case 'requestAnalystTransfer': {
      const summary = String(args.summary ?? 'Transferência solicitada');
      const reasonCode = normalizeTransferReasonCode(args.reasonCode);
      return {
        result: { ok: true, transfer: true, reasonCode },
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
  const apiKey = assertGeminiApiKey();
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
          safeErrorMessage(e).slice(0, 160),
        );
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  return {
    async generateReply(input): Promise<AgentReplyDraft> {
      if (isPoliteDismiss(input.employeeMessage)) {
        return {
          content: DISMISS_REPLY,
          decision: {
            understoodIntent: 'dismiss',
            actions: [{ code: 'reply', label: 'encerrou o assunto' }],
            rationale: 'Quick reply / recusa educada — sem reabrir card.',
            policyHits: [],
            toolCalls: [],
            modelConfidence: 0.95,
            presentedAssurance: 'HIGH',
          },
        };
      }
      if (isAddInfoRequest(input.employeeMessage)) {
        return {
          content: ADD_INFO_REPLY,
          decision: {
            understoodIntent: 'add_info',
            actions: [{ code: 'reply', label: 'pediu mais detalhes' }],
            rationale: 'Quick reply Adicionar informação.',
            policyHits: [],
            toolCalls: [],
            modelConfidence: 0.9,
            presentedAssurance: 'HIGH',
          },
        };
      }
      if (isAnalystRequest(input.employeeMessage)) {
        return {
          content: ANALYST_TRANSFER_REPLY,
          decision: {
            understoodIntent: 'request_analyst',
            actions: [{ code: 'transfer', label: 'transferiu para analista' }],
            rationale:
              'Pedido explícito / quick reply — USER_REQUEST (sem LLM inventar reasonCode).',
            policyHits: ['USER_REQUEST'],
            toolCalls: [],
            modelConfidence: 0.95,
            presentedAssurance: 'HIGH',
          },
          transfer: {
            summary: `Funcionário pediu analista: "${input.employeeMessage.slice(0, 180)}"`,
            reasonCode: 'USER_REQUEST',
          },
        };
      }

      const ctx = getContext();
      const traces: AgentToolCallTrace[] = [];
      const actions: AgentReplyDraft['decision']['actions'] = [];
      let transfer: AgentReplyDraft['transfer'] | undefined;
      let confirmationToken: string | undefined;
      let draftStructuredPayload: unknown | undefined;

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

          let structuredPayload: unknown = draftStructuredPayload;
          let intent = transfer
            ? 'transfer'
            : draftStructuredPayload
              ? 'ticket_draft'
              : 'gemini_reply';

          // Preferir detalhe (número, título, único chamado) — não relistar.
          if (!structuredPayload) {
            const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
            const detailMatch =
              resolveTicketForDetail(tickets, input.employeeMessage) ??
              (traces.some((t) => t.name === 'listMyTickets' && t.ok)
                ? shouldShowDetailInsteadOfList(tickets)
                : null);
            if (detailMatch) {
              const ui = detailUi(detailMatch);
              structuredPayload = ui.structuredPayload;
              text = ui.text;
              intent = 'ticket_detail';
              actions.length = 0;
              actions.push(...ui.actions);
            } else if (traces.some((t) => t.name === 'listMyTickets' && t.ok)) {
              const use = openishTickets(tickets);
              if (use.length > 0) {
                structuredPayload = mapTicketsToSelectPayload(use);
                text = `Você tem ${use.length} chamado(s). Sobre qual deles quer saber?`;
                intent = 'list_tickets';
                if (
                  !actions.some((a) => a.code === 'list_tickets' || a.label.includes('chamado'))
                ) {
                  actions.unshift({ code: 'list_tickets', label: 'consultou seus chamados' });
                }
              } else {
                text = 'Você não tem chamados no momento. Quer abrir um ou falar com um analista?';
                intent = 'list_tickets_empty';
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
          if (dispatched.draftPayload) draftStructuredPayload = dispatched.draftPayload;
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
