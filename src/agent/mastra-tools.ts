/**
 * Wrappers Mastra (createTool) sobre execute-tools do domínio.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AgentToolContext } from '@/agent/tools/tool-context';
import {
  toolConfirmTicketMutation,
  toolFindDuplicateOrReopen,
  toolGetTicket,
  toolListMyTickets,
  toolPrepareTicketDraft,
  toolSearchHelpCenter,
} from '@/agent/tools/execute-tools';
import type { Category, Priority, TicketType } from '@/domain/types';

const categorySchema = z.enum(['ACESSO', 'REDE_VPN', 'HARDWARE', 'SOFTWARE', 'EMAIL', 'OUTROS']);
const prioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const ticketTypeSchema = z.enum(['INC', 'REQ']);

export function createMastraTools(getCtx: () => AgentToolContext) {
  const searchHelpCenter = createTool({
    id: 'searchHelpCenter',
    description: 'Busca artigos na base de ajuda interna',
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      const result = await toolSearchHelpCenter(getCtx(), query);
      return result;
    },
  });

  const listMyTickets = createTool({
    id: 'listMyTickets',
    description: 'Lista chamados do funcionário autenticado (owner)',
    inputSchema: z.object({}),
    execute: async () => toolListMyTickets(getCtx()),
  });

  const getTicket = createTool({
    id: 'getTicket',
    description: 'Detalhe de um chamado do owner',
    inputSchema: z.object({ ticketId: z.string() }),
    execute: async ({ ticketId }) => toolGetTicket(getCtx(), ticketId),
  });

  const findDuplicateOrReopenCandidate = createTool({
    id: 'findDuplicateOrReopenCandidate',
    description: 'Avalia duplicidade/reopen por título (Jaccard) no domínio',
    inputSchema: z.object({
      title: z.string(),
      category: categorySchema,
      type: ticketTypeSchema.optional(),
    }),
    execute: async ({ title, category, type }) =>
      toolFindDuplicateOrReopen(getCtx(), {
        title,
        category: category as Category,
        type: type as TicketType | undefined,
      }),
  });

  const prepareTicketDraft = createTool({
    id: 'prepareTicketDraft',
    description: 'Prepara mutação de chamado (PendingConfirmation) — não grava o ticket ainda',
    inputSchema: z.object({
      operation: z.enum(['CREATE', 'UPDATE', 'REOPEN']),
      type: ticketTypeSchema,
      title: z.string(),
      description: z.string(),
      category: categorySchema,
      priority: prioritySchema,
      ticketId: z.string().optional(),
    }),
    execute: async (input) =>
      toolPrepareTicketDraft(getCtx(), {
        operation: input.operation,
        type: input.type as TicketType,
        title: input.title,
        description: input.description,
        category: input.category as Category,
        priority: input.priority as Priority,
        ticketId: input.ticketId,
      }),
  });

  const confirmTicketMutation = createTool({
    id: 'confirmTicketMutation',
    description: 'Confirma mutação com token do ConfirmationGate (após OK do funcionário)',
    inputSchema: z.object({ token: z.string() }),
    execute: async ({ token }) => toolConfirmTicketMutation(getCtx(), token),
  });

  const requestAnalystTransfer = createTool({
    id: 'requestAnalystTransfer',
    description: 'Sinaliza transferência para analista humano com resumo',
    inputSchema: z.object({
      summary: z.string(),
      reasonCode: z.enum(['USER_REQUEST', 'CRITICAL', 'OVERDUE', 'LOW_CONFIDENCE']),
    }),
    execute: async ({ summary, reasonCode }) => ({
      ok: true,
      data: { transfer: true, summary, reasonCode },
      trace: { name: 'requestAnalystTransfer', ok: true, summary: reasonCode },
    }),
  });

  return {
    searchHelpCenter,
    listMyTickets,
    getTicket,
    findDuplicateOrReopenCandidate,
    prepareTicketDraft,
    confirmTicketMutation,
    requestAnalystTransfer,
  };
}
