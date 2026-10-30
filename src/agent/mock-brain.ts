/**
 * Cérebro determinístico para CI/testes — sem Gemini.
 * Usa as mesmas tools de produção (list tickets, help, transfer).
 */

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
import {
  openishTickets,
  resolveTicketForDetail,
  shouldShowDetailInsteadOfList,
  ticketNumberInText,
} from '@/agent/ticket-ui-resolution';
import type { AgentBrain, AgentReplyDraft, AgentToolCallTrace } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  toolEvaluateTransfer,
  toolGetTicket,
  toolListMyTickets,
  toolPrepareTicketDraft,
  toolSearchHelpCenter,
} from '@/agent/tools/execute-tools';
import type { TicketRecord } from '@/services/tickets/types';

function wantsTickets(text: string): boolean {
  const t = text.toLowerCase();
  // Seleção da lista ("INC-0001 · título") não é pedido de listagem.
  if (ticketNumberInText(text) && text.includes('·')) return false;
  return (
    t.includes('chamado') ||
    t.includes('ticket') ||
    t.includes('status') ||
    /\b(inc|req)-\d+\b/i.test(t)
  );
}

function detailReply(
  match: TicketRecord,
  traces: AgentToolCallTrace[],
  actions: AgentReplyDraft['decision']['actions'],
): AgentReplyDraft {
  const overdueHint =
    match.slaDeadlineAt.getTime() < Date.now() &&
    (match.status === 'OPEN' || match.status === 'WAITING_ANALYST');
  return {
    content: overdueHint
      ? 'Está sem atualização acima do prazo. Quer que eu chame um analista?'
      : 'Segue o detalhe do chamado. Precisa de mais alguma coisa?',
    structuredPayload: {
      ...mapTicketToDetailPayload(match),
      quickReplies: ['Falar com um analista', 'Adicionar informação', 'Não, obrigado'],
    },
    decision: {
      understoodIntent: 'ticket_detail',
      actions,
      rationale: `Detalhe do ${match.number} via TicketDetailCard.`,
      policyHits: ['ticket_read_scoped'],
      toolCalls: traces,
      modelConfidence: 0.92,
      presentedAssurance: 'HIGH',
    },
  };
}

function helpQuery(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes('vpn') || t.includes('809')) return 'vpn';
  if (t.includes('senha')) return 'senha';
  if (t.includes('outlook') || t.includes('email') || t.includes('e-mail')) return 'email';
  if (t.includes('notebook') || t.includes('lento')) return 'notebook';
  if (t.includes('horário') || t.includes('horario') || t.includes('plantão')) return 'horario';
  return null;
}

function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (/^(oi|olá|ola|hey|hello|bom dia|boa tarde|boa noite)\b/.test(t)) return true;
  return t.length <= 48 && /^(oi|olá|ola)\b.*\b(bom dia|boa tarde|boa noite)\b/.test(t);
}

function wantsCreateTicket(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (/\b(abrir|criar|abrir um|abrir uma)\b/.test(t) || t.includes('novo chamado')) &&
    (t.includes('chamado') || t.includes('incidente') || t.includes('ticket') || t.includes('req'))
  );
}

export function createMockAgentBrain(getContext: () => AgentToolContext): AgentBrain {
  return {
    async generateReply(input): Promise<AgentReplyDraft> {
      const ctx = getContext();
      const traces: AgentToolCallTrace[] = [];
      const actions: AgentReplyDraft['decision']['actions'] = [];
      const policyHits: string[] = [];

      if (isPoliteDismiss(input.employeeMessage)) {
        actions.push({ code: 'reply', label: 'encerrou o assunto' });
        return {
          content: DISMISS_REPLY,
          decision: {
            understoodIntent: 'dismiss',
            actions,
            rationale: 'Quick reply / recusa educada — sem reabrir card.',
            policyHits: [],
            toolCalls: traces,
            modelConfidence: 0.95,
            presentedAssurance: 'HIGH',
          },
        };
      }

      if (isAddInfoRequest(input.employeeMessage)) {
        actions.push({ code: 'reply', label: 'pediu mais detalhes' });
        return {
          content: ADD_INFO_REPLY,
          decision: {
            understoodIntent: 'add_info',
            actions,
            rationale: 'Quick reply Adicionar informação.',
            policyHits: [],
            toolCalls: traces,
            modelConfidence: 0.9,
            presentedAssurance: 'HIGH',
          },
        };
      }

      if (isAnalystRequest(input.employeeMessage)) {
        const transferEval = toolEvaluateTransfer({ userRequestedTransfer: true });
        traces.push(transferEval.trace);
        policyHits.push('USER_REQUEST');
        actions.push({ code: 'transfer', label: 'transferiu para analista' });
        return {
          content: ANALYST_TRANSFER_REPLY,
          decision: {
            understoodIntent: 'request_analyst',
            actions,
            rationale: 'Funcionário pediu atendimento humano (USER_REQUEST).',
            policyHits,
            toolCalls: traces,
            modelConfidence: 0.95,
            presentedAssurance: 'HIGH',
          },
          transfer: {
            summary: `Funcionário pediu analista: "${input.employeeMessage.slice(0, 180)}"`,
            reasonCode: 'USER_REQUEST',
          },
        };
      }

      if (wantsCreateTicket(input.employeeMessage)) {
        const title =
          input.employeeMessage
            .replace(/^.*?(chamado|incidente|ticket)\s*(sobre|de|:)?\s*/i, '')
            .trim() || input.employeeMessage.slice(0, 80);
        const prepared = await toolPrepareTicketDraft(ctx, {
          operation: 'CREATE',
          type: 'INC',
          title: title.slice(0, 120) || 'Novo incidente',
          description: input.employeeMessage.slice(0, 500),
          category: 'OUTROS',
          priority: 'MEDIUM',
        });
        traces.push(prepared.trace);
        actions.push({ code: 'prepareTicketDraft', label: 'preparou rascunho do chamado' });
        if (!prepared.ok || !prepared.data) {
          return {
            content:
              'Não consegui preparar o rascunho agora. Pode reformular o pedido ou falar com um analista?',
            decision: {
              understoodIntent: 'ticket_draft_failed',
              actions,
              rationale: 'prepareTicketDraft falhou no mock brain.',
              policyHits: ['confirmation_gate'],
              toolCalls: traces,
              modelConfidence: 0.5,
              presentedAssurance: 'LOW',
            },
          };
        }
        return {
          content:
            'Preparei o rascunho abaixo. Confirme para abrir o chamado, edite a mensagem ou cancele.',
          structuredPayload: mapTicketDraftPayload({
            operation: 'CREATE',
            type: 'INC',
            title: title.slice(0, 120) || 'Novo incidente',
            description: input.employeeMessage.slice(0, 500),
            category: 'OUTROS',
            priority: 'MEDIUM',
            confirmationToken: prepared.data.token,
            expiresAt: prepared.data.expiresAt,
          }),
          confirmationToken: prepared.data.token,
          decision: {
            understoodIntent: 'ticket_draft',
            actions,
            rationale: 'Staging ConfirmationGate — confirmação só na UI.',
            policyHits: ['confirmation_gate'],
            toolCalls: traces,
            modelConfidence: 0.9,
            presentedAssurance: 'HIGH',
          },
        };
      }

      const q = helpQuery(input.employeeMessage);
      if (q) {
        const help = await toolSearchHelpCenter(ctx, q);
        traces.push(help.trace);
        actions.push({ code: 'search_help', label: 'consultou a base de ajuda' });
        const first = help.data?.[0];
        const content = first
          ? `Encontrei o artigo “${first.title}”: ${first.excerpt}${first.excerpt.length >= 160 ? '…' : ''}`
          : 'Não achei um artigo específico. Quer que eu liste seus chamados ou chame um analista?';
        return {
          content,
          decision: {
            understoodIntent: 'help_center',
            actions,
            rationale: `Busca Help Center por “${q}”.`,
            policyHits: ['help_center_read'],
            toolCalls: traces,
            modelConfidence: 0.8,
            presentedAssurance: 'MEDIUM',
          },
        };
      }

      if (wantsTickets(input.employeeMessage)) {
        const listed = await toolListMyTickets(ctx);
        traces.push(listed.trace);
        actions.push({ code: 'list_tickets', label: 'consultou seus chamados' });
        const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
        const only = shouldShowDetailInsteadOfList(tickets);
        if (only) {
          const detail = await toolGetTicket(ctx, only.id);
          traces.push(detail.trace);
          actions.push(
            { code: 'get_ticket', label: `consultou o ${only.number}` },
            { code: 'sla', label: 'calculou o prazo' },
          );
          return detailReply(only, traces, actions);
        }
        const forList = openishTickets(tickets);
        if (forList.length === 0) {
          return {
            content: 'Você não tem chamados no momento. Quer abrir um ou falar com um analista?',
            decision: {
              understoodIntent: 'list_tickets',
              actions,
              rationale: 'Consulta de status/lista de chamados do owner.',
              policyHits: ['ticket_read_scoped'],
              toolCalls: traces,
              modelConfidence: 0.9,
              presentedAssurance: 'HIGH',
            },
          };
        }
        return {
          content: `Você tem ${forList.length} chamado(s). Sobre qual deles quer saber?`,
          structuredPayload: mapTicketsToSelectPayload(forList),
          decision: {
            understoodIntent: 'list_tickets',
            actions,
            rationale: 'Consulta de status/lista de chamados do owner.',
            policyHits: ['ticket_read_scoped'],
            toolCalls: traces,
            modelConfidence: 0.9,
            presentedAssurance: 'HIGH',
          },
        };
      }

      // Follow-up tipo “sap” / “quero saber do acesso” sem palavra “chamado”.
      {
        const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
        const match = resolveTicketForDetail(tickets, input.employeeMessage);
        if (match) {
          const listed = await toolListMyTickets(ctx);
          traces.push(listed.trace);
          const detail = await toolGetTicket(ctx, match.id);
          traces.push(detail.trace);
          actions.push(
            { code: 'get_ticket', label: `consultou o ${match.number}` },
            { code: 'sla', label: 'calculou o prazo' },
          );
          return detailReply(match, traces, actions);
        }
      }

      if (isGreeting(input.employeeMessage)) {
        actions.push({ code: 'reply', label: 'respondeu' });
        return {
          content:
            'Oi! Sou o Nexo Assist. Posso ver o status dos seus chamados, buscar dicas na base de ajuda ou chamar alguém do Suporte N2. Como posso ajudar?',
          decision: {
            understoodIntent: 'greeting',
            actions,
            rationale: 'Saudação — oferta breve de caminhos.',
            policyHits: [],
            toolCalls: traces,
            modelConfidence: 0.85,
            presentedAssurance: 'HIGH',
          },
        };
      }

      actions.push({ code: 'reply', label: 'respondeu' });
      return {
        content:
          'Não entendi bem o que você precisa. Quer que eu olhe seus chamados, busque um artigo de ajuda ou chame um analista?',
        decision: {
          understoodIntent: 'clarify',
          actions,
          rationale: 'Intent genérico — oferta de caminhos sem mutação.',
          policyHits: [],
          toolCalls: traces,
          modelConfidence: 0.6,
          presentedAssurance: 'MEDIUM',
        },
      };
    },
  };
}
