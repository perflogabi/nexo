export type ConversationFilterId = 'todas' | 'para-voce' | 'com-agent' | 'minhas';

export type ConversationListStatusTone = 'transfer' | 'help' | 'active' | 'resolved';

export type ConversationListItemData = {
  id: string;
  name: string;
  initials: string;
  avatarTone: 'blue' | 'peach' | 'lavender' | 'mint' | 'pink' | 'slate' | 'sand';
  online?: boolean;
  timeLabel: string;
  timeEmphasis?: boolean;
  preview: string;
  previewKind?: 'text' | 'typing' | 'nexo';
  status: { tone: ConversationListStatusTone; label: string };
  unread?: number;
};

export const ANALYST_RAIL = {
  badgeCount: 5,
  analystInitials: 'RL',
} as const;

export const CONVERSATION_FILTERS: readonly {
  id: ConversationFilterId;
  label: string;
  count?: number;
}[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'para-voce', label: 'Para você', count: 3 },
  { id: 'com-agent', label: 'Com o agent', count: 9 },
  { id: 'minhas', label: 'Minhas', count: 1 },
] as const;

/** Lista estática fiel ao protótipo Atendente — Conversas. */
export const DEMO_CONVERSATIONS: readonly ConversationListItemData[] = [
  {
    id: 'ana',
    name: 'Ana Souza',
    initials: 'AS',
    avatarTone: 'blue',
    online: true,
    timeLabel: '10:05',
    timeEmphasis: true,
    preview: 'Está parado há 5 dias. Quero falar com...',
    status: { tone: 'transfer', label: 'Transferida · INC-20311' },
    unread: 2,
  },
  {
    id: 'carla',
    name: 'Carla Mendes',
    initials: 'CM',
    avatarTone: 'peach',
    online: true,
    timeLabel: '09:58',
    timeEmphasis: true,
    preview: 'Preciso de acesso ao SAP ainda hoje',
    status: { tone: 'transfer', label: 'Transferida · contato em 25 min' },
    unread: 1,
  },
  {
    id: 'bruno',
    name: 'Bruno Tavares',
    initials: 'BT',
    avatarTone: 'lavender',
    timeLabel: '09:51',
    preview: 'Nexo: Vou chamar um analista para isso.',
    previewKind: 'nexo',
    status: { tone: 'help', label: 'Agent pediu ajuda · confiança 41%' },
  },
  {
    id: 'diego',
    name: 'Diego Ramos',
    initials: 'DR',
    avatarTone: 'mint',
    online: true,
    timeLabel: 'agora',
    preview: 'digitando...',
    previewKind: 'typing',
    status: { tone: 'active', label: 'Agent atendendo' },
  },
  {
    id: 'elisa',
    name: 'Elisa Prado',
    initials: 'EP',
    avatarTone: 'pink',
    timeLabel: '10:03',
    preview: 'Nexo: Chamado INC-20519 criado.',
    previewKind: 'nexo',
    status: { tone: 'active', label: 'Agent atendendo' },
  },
  {
    id: 'fabio',
    name: 'Fábio Nunes',
    initials: 'FN',
    avatarTone: 'slate',
    timeLabel: '10:01',
    preview: 'Isso resolveu, obrigado!',
    status: { tone: 'resolved', label: 'Resolvida pelo agent' },
  },
  {
    id: 'gabriela',
    name: 'Gabriela Rocha',
    initials: 'GR',
    avatarTone: 'sand',
    timeLabel: 'ontem',
    preview: 'Nexo: A senha do Wi-Fi foi enviada...',
    previewKind: 'nexo',
    status: { tone: 'resolved', label: 'Resolvida pelo agent' },
  },
] as const;

export type AnalystChatMessage =
  | { id: string; kind: 'employee'; time: string; text: string }
  | { id: string; kind: 'ia'; time: string; text: string }
  | { id: string; kind: 'system'; time: string; text: string };

export const DEMO_ANALYST_CHAT = {
  employee: {
    name: 'Ana Souza',
    initials: 'AS',
    meta: 'online · Financeiro · INC-20311',
    firstName: 'Ana',
  },
  waitingUntil: '12:05',
  messages: [
    {
      id: 'm1',
      kind: 'employee',
      time: '10:01',
      text: 'Qual o status do meu chamado?',
    },
    {
      id: 'm2',
      kind: 'ia',
      time: '10:01',
      text: 'Você tem 3 chamados abertos. Sobre qual deles quer saber?',
    },
    {
      id: 'm3',
      kind: 'employee',
      time: '10:02',
      text: 'INC-20311 · Notebook lento após atualização',
    },
    {
      id: 'm4',
      kind: 'ia',
      time: '10:02',
      text: 'Está sem atualização há 5 dias, acima do prazo de 3 dias úteis. Quer que eu chame um analista?',
    },
    { id: 'm5', kind: 'employee', time: '10:04', text: 'Está parado há 5 dias.' },
    { id: 'm6', kind: 'employee', time: '10:04', text: 'Quero falar com um analista.' },
    {
      id: 'm7',
      kind: 'ia',
      time: '10:05',
      text: 'Encaminhei para o Suporte N2. Um analista vai falar com você em até 2 h úteis.',
    },
    {
      id: 'm8',
      kind: 'system',
      time: '10:05',
      text: 'Transferida para Suporte N2 · 10:05',
    },
  ] satisfies readonly AnalystChatMessage[],
} as const;

export type AnalystTicketTone = 'waiting' | 'progress' | 'approved' | 'resolved';

export type AnalystTicketListItem = {
  id: string;
  title: string;
  meta: string;
  tone: AnalystTicketTone;
};

export const DEMO_ANALYST_TICKETS = {
  firstName: 'Ana',
  openCount: 3,
  closedCount: 2,
  current: {
    number: 'INC-20311',
    title: 'Notebook lento após atualização',
    statusLabel: 'Aguardando analista',
    meta: 'Hardware · prioridade média',
    eventLabel: 'Transferido para um analista',
    eventTime: '10:05',
  },
  others: [
    {
      id: 't1',
      title: 'Acesso à pasta Financeiro',
      meta: 'INC-20298 · Em andamento',
      tone: 'progress',
    },
    {
      id: 't2',
      title: 'Segundo monitor para home office',
      meta: 'REQ-10442 · Aprovado',
      tone: 'approved',
    },
    {
      id: 't3',
      title: 'Outlook não sincroniza no celular',
      meta: 'INC-19877 · Resolvido em 02 set',
      tone: 'resolved',
    },
    {
      id: 't4',
      title: 'Troca de senha da rede',
      meta: 'INC-19410 · Resolvido em 11 jul',
      tone: 'resolved',
    },
  ] satisfies readonly AnalystTicketListItem[],
} as const;
