/**
 * Cérebro determinístico para CI/testes — sem Gemini.
 * Usa as mesmas tools de produção (list tickets, help, transfer).
 */

import { mapTicketToDetailPayload, mapTicketsToSelectPayload } from '@/agent/chat-ui-payload';
import type { AgentBrain, AgentReplyDraft, AgentToolCallTrace } from '@/agent/types';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  toolEvaluateTransfer,
  toolGetTicket,
  toolListMyTickets,
  toolSearchHelpCenter,
} from '@/agent/tools/execute-tools';

function wantsAnalyst(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('analista') ||
    t.includes('atendente') ||
    t.includes('humano') ||
    t.includes('pessoa') ||
    /\bquero falar com\b/.test(t)
  );
}

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

function ticketNumberInText(text: string): string | null {
  const m = text.match(/\b((?:INC|REQ)-\d+)\b/i);
  return m?.[1]?.toUpperCase() ?? null;
}

export function createMockAgentBrain(getContext: () => AgentToolContext): AgentBrain {
  return {
    async generateReply(input): Promise<AgentReplyDraft> {
      const ctx = getContext();
      const traces: AgentToolCallTrace[] = [];
      const actions: AgentReplyDraft['decision']['actions'] = [];
      const policyHits: string[] = [];

      if (wantsAnalyst(input.employeeMessage)) {
        const transferEval = toolEvaluateTransfer({ userRequestedTransfer: true });
        traces.push(transferEval.trace);
        policyHits.push('USER_REQUEST');
        actions.push({ code: 'transfer', label: 'transferiu para analista' });
        return {
          content:
            'Entendi — vou chamar um analista do Suporte N2. Em até 2 h úteis alguém fala com você por aqui.',
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

      const ticketNumber = ticketNumberInText(input.employeeMessage);
      if (ticketNumber) {
        const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
        traces.push({
          name: 'listMyTickets',
          ok: true,
          summary: `${tickets.length} chamado(s)`,
        });
        const match = tickets.find((t) => t.number.toUpperCase() === ticketNumber);
        if (match) {
          const detail = await toolGetTicket(ctx, match.id);
          traces.push(detail.trace);
          actions.push(
            { code: 'get_ticket', label: `consultou o ${ticketNumber}` },
            { code: 'sla', label: 'calculou o prazo' },
          );
          const payload = mapTicketToDetailPayload(match);
          const overdueHint =
            match.slaDeadlineAt.getTime() < Date.now() &&
            (match.status === 'OPEN' || match.status === 'WAITING_ANALYST');
          return {
            content: overdueHint
              ? 'Está sem atualização acima do prazo. Quer que eu chame um analista?'
              : 'Segue o detalhe do chamado. Precisa de mais alguma coisa?',
            structuredPayload: {
              ...payload,
              quickReplies: ['Falar com um analista', 'Adicionar informação', 'Não, obrigado'],
            },
            decision: {
              understoodIntent: 'ticket_detail',
              actions,
              rationale: `Detalhe do ${ticketNumber} via TicketDetailCard.`,
              policyHits: ['ticket_read_scoped'],
              toolCalls: traces,
              modelConfidence: 0.92,
              presentedAssurance: 'HIGH',
            },
          };
        }
      }

      if (wantsTickets(input.employeeMessage)) {
        const listed = await toolListMyTickets(ctx);
        traces.push(listed.trace);
        actions.push({ code: 'list_tickets', label: 'consultou seus chamados' });
        const tickets = await ctx.tickets.listMyTickets(ctx.employeeId);
        const openish = tickets.filter(
          (t) =>
            t.status === 'OPEN' ||
            t.status === 'WAITING_ANALYST' ||
            t.status === 'IN_PROGRESS' ||
            t.status === 'APPROVED',
        );
        const forList = (openish.length > 0 ? openish : tickets).slice(0, 5);
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
