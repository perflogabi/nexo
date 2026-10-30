/**
 * Re-export do módulo neutro — brains/tools e client compartilham o mesmo contrato.
 */
export {
  isTicketDetailPayload,
  isTicketDraftPayload,
  isTicketSelectPayload,
  mapTicketDraftPayload,
  mapTicketToDetailPayload,
  mapTicketsToSelectPayload,
  type AgentChatUiPayload,
  type TicketDetailPayload,
  type TicketDraftPayloadUi,
  type TicketSelectPayload,
} from '@/lib/chat-ui-payload';
