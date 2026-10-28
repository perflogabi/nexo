import type { TicketDetailMeta } from '@/components/chat/TicketDetailCard';
import type { TicketSelectItem } from '@/components/chat/TicketSelectList';

/** Conteúdo estático fiel ao protótipo Chat — consulta / transferência. */
export const DEMO_TICKETS: readonly TicketSelectItem[] = [
  {
    id: 'inc-20311',
    number: 'INC-20311',
    title: 'Notebook lento após atualização',
    status: { label: 'Aguardando analista', tone: 'waiting' },
    dateLabel: '16 out',
  },
  {
    id: 'inc-20288',
    number: 'INC-20288',
    title: 'Acesso à pasta Financeiro no SharePoint',
    status: { label: 'Em andamento', tone: 'progress' },
    dateLabel: '14 out',
  },
  {
    id: 'req-20102',
    number: 'REQ-20102',
    title: 'Segundo monitor para home office',
    status: { label: 'Aprovado', tone: 'approved' },
    dateLabel: '09 out',
  },
] as const;

export const DEMO_TICKET_DETAIL = {
  number: 'INC-20311',
  status: { label: 'Aguardando analista', tone: 'waiting' as const },
  title: 'Notebook lento após atualização do Windows',
  description:
    'Lentidão geral desde a atualização de 15/10. Reiniciar e rodar o diagnóstico da central não resolveu.',
  meta: {
    category: 'Hardware › Notebook',
    priority: 'Média',
    openedAt: '16 out, 14:20',
    lastUpdateHighlight: 'há 5 dias',
    lastUpdateRest: ' · prazo vencido',
  } satisfies TicketDetailMeta,
};

export const DEMO_QUICK_REPLIES = [
  'Falar com um analista',
  'Adicionar informação',
  'Não, obrigado',
] as const;
