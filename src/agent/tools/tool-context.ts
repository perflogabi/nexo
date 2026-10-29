import type { HelpCenterService } from '@/services/help-center';
import type { TicketService } from '@/services/tickets';
import type { ConversationService } from '@/services/conversations';

export type AgentToolContext = {
  employeeId: string;
  conversationId: string;
  tickets: TicketService;
  help: HelpCenterService;
  conversations: ConversationService;
};
