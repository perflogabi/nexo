/**
 * Seed demo (data-model.md §10) — perfis do protótipo do console.
 * Idempotente via upsert por id/email/slug/number.
 * Auth demo: qualquer senha.
 *
 * Uso: npm run db:seed
 */

import {
  PrismaClient,
  type AuthorType,
  type ConversationStatus,
  type TransferReasonCode,
} from '@prisma/client';

const prisma = new PrismaClient();

type SeedEmployee = {
  id: string;
  email: string;
  name: string;
  department: string;
  role: 'EMPLOYEE' | 'ANALYST';
};

async function upsertEmployee(e: SeedEmployee) {
  return prisma.employee.upsert({
    where: { id: e.id },
    update: {
      email: e.email,
      name: e.name,
      department: e.department,
      role: e.role,
    },
    create: e,
  });
}

async function seedConversation(input: {
  id: string;
  employeeId: string;
  status: ConversationStatus;
  messageCount: number;
  transferSummary?: string | null;
  transferReasonCode?: TransferReasonCode | null;
  assignedAnalystId?: string | null;
  updatedAt: Date;
  messages: Array<{
    id: string;
    authorType: AuthorType;
    authorId: string | null;
    content: string;
    createdAt: Date;
  }>;
}) {
  await prisma.conversation.upsert({
    where: { id: input.id },
    update: {
      employeeId: input.employeeId,
      status: input.status,
      messageCount: input.messageCount,
      transferSummary: input.transferSummary ?? null,
      transferReasonCode: input.transferReasonCode ?? null,
      assignedAnalystId: input.assignedAnalystId ?? null,
      updatedAt: input.updatedAt,
    },
    create: {
      id: input.id,
      employeeId: input.employeeId,
      status: input.status,
      messageCount: input.messageCount,
      transferSummary: input.transferSummary ?? null,
      transferReasonCode: input.transferReasonCode ?? null,
      assignedAnalystId: input.assignedAnalystId ?? null,
      createdAt: input.updatedAt,
      updatedAt: input.updatedAt,
    },
  });

  const existing = await prisma.message.findMany({
    where: { conversationId: input.id },
    select: { id: true },
  });
  if (existing.length > 0) {
    await prisma.decisionTrace.deleteMany({
      where: { messageId: { in: existing.map((m) => m.id) } },
    });
  }
  await prisma.message.deleteMany({ where: { conversationId: input.id } });
  if (input.messages.length > 0) {
    await prisma.message.createMany({
      data: input.messages.map((m) => ({ ...m, conversationId: input.id })),
    });
  }
}

async function main() {
  const ana = await upsertEmployee({
    id: 'emp_ana',
    email: 'ana.souza@nexo.com.br',
    name: 'Ana Souza',
    department: 'Financeiro',
    role: 'EMPLOYEE',
  });

  const carla = await upsertEmployee({
    id: 'emp_carla_mendes',
    email: 'carla.mendes@nexo.com.br',
    name: 'Carla Mendes',
    department: 'Financeiro',
    role: 'EMPLOYEE',
  });

  const bruno = await upsertEmployee({
    id: 'emp_bruno',
    email: 'bruno.tavares@nexo.com.br',
    name: 'Bruno Tavares',
    department: 'Operações',
    role: 'EMPLOYEE',
  });

  const diego = await upsertEmployee({
    id: 'emp_diego',
    email: 'diego.ramos@nexo.com.br',
    name: 'Diego Ramos',
    department: 'Comercial',
    role: 'EMPLOYEE',
  });

  const elisa = await upsertEmployee({
    id: 'emp_elisa',
    email: 'elisa.prado@nexo.com.br',
    name: 'Elisa Prado',
    department: 'RH',
    role: 'EMPLOYEE',
  });

  const fabio = await upsertEmployee({
    id: 'emp_fabio',
    email: 'fabio.nunes@nexo.com.br',
    name: 'Fábio Nunes',
    department: 'TI',
    role: 'EMPLOYEE',
  });

  const gabriela = await upsertEmployee({
    id: 'emp_gabriela',
    email: 'gabriela.rocha@nexo.com.br',
    name: 'Gabriela Rocha',
    department: 'Marketing',
    role: 'EMPLOYEE',
  });

  const analista = await upsertEmployee({
    id: 'emp_analista',
    email: 'analista@nexo.local',
    name: 'Rafael Lima',
    department: 'Service Desk',
    role: 'ANALYST',
  });

  const articles = [
    {
      slug: 'vpn-erro-809',
      title: 'VPN — erro 809',
      body: 'Se a VPN retornar erro 809, reinicie o cliente e confira o gateway corporativo.',
      tags: ['vpn', '809', 'rede'],
    },
    {
      slug: 'horario-service-desk',
      title: 'Horário do service desk',
      body: 'Horário do service desk: de segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas.',
      tags: ['horario', 'sla', 'plantao'],
    },
    {
      slug: 'reset-senha',
      title: 'Reset de senha de rede',
      body: 'Use o portal de identidade ou abra um chamado de ACESSO para reset assistido.',
      tags: ['senha', 'acesso'],
    },
    {
      slug: 'email-outlook',
      title: 'Outlook não sincroniza',
      body: 'Verifique perfil Exchange e reinicie o Outlook em modo seguro antes de abrir chamado.',
      tags: ['email', 'outlook'],
    },
    {
      slug: 'notebook-lento',
      title: 'Notebook lento',
      body: 'Libere espaço em disco e atualize o agente de endpoint antes de escalar hardware.',
      tags: ['hardware', 'performance'],
    },
    {
      slug: 'software-padrao',
      title: 'Instalação de software padrão',
      body: 'Softwares do catálogo podem ser instalados via portal; demais exigem REQ.',
      tags: ['software', 'req'],
    },
  ] as const;

  for (const article of articles) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        body: article.body,
        tags: [...article.tags],
      },
      create: {
        slug: article.slug,
        title: article.title,
        body: article.body,
        tags: [...article.tags],
      },
    });
  }

  const now = new Date();
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const overdueDeadline = new Date(now.getTime() - 60 * 60 * 1000);
  const base = now.getTime();

  await prisma.ticket.upsert({
    where: { number: 'INC-0001' },
    update: {
      title: 'VPN erro 809 no notebook',
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      status: 'OPEN',
    },
    create: {
      id: 'tkt_open_overdue',
      number: 'INC-0001',
      type: 'INC',
      title: 'VPN erro 809 no notebook',
      description: 'Não conecta na VPN corporativa — erro 809.',
      category: 'REDE_VPN',
      priority: 'HIGH',
      status: 'OPEN',
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      slaDeadlineAt: overdueDeadline,
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'INC-0002' },
    update: {},
    create: {
      id: 'tkt_resolved_recent',
      number: 'INC-0002',
      type: 'INC',
      title: 'Mouse sem clique',
      description: 'Mouse USB sem resposta no botão esquerdo.',
      category: 'HARDWARE',
      priority: 'LOW',
      status: 'RESOLVED',
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      slaDeadlineAt: fourDaysAgo,
      resolvedAt: fourDaysAgo,
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'REQ-0001' },
    update: {},
    create: {
      id: 'tkt_approved',
      number: 'REQ-0001',
      type: 'REQ',
      title: 'Acesso ao repositório Git',
      description: 'Liberar leitura no monorepo interno.',
      category: 'ACESSO',
      priority: 'MEDIUM',
      status: 'APPROVED',
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      slaDeadlineAt: fourDaysAgo,
      resolvedAt: fourDaysAgo,
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'INC-20311' },
    update: {
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      status: 'WAITING_ANALYST',
      title: 'Notebook lento após atualização',
    },
    create: {
      id: 'tkt_ana_proto',
      number: 'INC-20311',
      type: 'INC',
      title: 'Notebook lento após atualização',
      description: 'Parado há 5 dias acima do SLA.',
      category: 'HARDWARE',
      priority: 'MEDIUM',
      status: 'WAITING_ANALYST',
      ownerEmployeeId: ana.id,
      affectedEmployeeId: ana.id,
      slaDeadlineAt: overdueDeadline,
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'REQ-0200' },
    update: { ownerEmployeeId: carla.id, affectedEmployeeId: carla.id },
    create: {
      id: 'tkt_carla_sap',
      number: 'REQ-0200',
      type: 'REQ',
      title: 'Acesso ao SAP',
      description: 'Preciso de acesso ao SAP ainda hoje.',
      category: 'ACESSO',
      priority: 'HIGH',
      status: 'OPEN',
      ownerEmployeeId: carla.id,
      affectedEmployeeId: carla.id,
      slaDeadlineAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'INC-0100' },
    update: {
      ownerEmployeeId: bruno.id,
      affectedEmployeeId: bruno.id,
      title: 'Outlook fora do ar',
    },
    create: {
      id: 'tkt_bruno_only',
      number: 'INC-0100',
      type: 'INC',
      title: 'Outlook fora do ar',
      description: 'Caixa de e-mail não sincroniza desde ontem.',
      category: 'EMAIL',
      priority: 'MEDIUM',
      status: 'OPEN',
      ownerEmployeeId: bruno.id,
      affectedEmployeeId: bruno.id,
      slaDeadlineAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.ticket.upsert({
    where: { number: 'INC-20519' },
    update: { ownerEmployeeId: elisa.id, affectedEmployeeId: elisa.id },
    create: {
      id: 'tkt_elisa',
      number: 'INC-20519',
      type: 'INC',
      title: 'Reset de senha Wi-Fi',
      description: 'Solicitação de reset assistido.',
      category: 'ACESSO',
      priority: 'LOW',
      status: 'OPEN',
      ownerEmployeeId: elisa.id,
      affectedEmployeeId: elisa.id,
      slaDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // --- Conversas do protótipo (console) ---

  await seedConversation({
    id: 'conv_ana_waiting',
    employeeId: ana.id,
    status: 'WAITING_ANALYST',
    messageCount: 4,
    transferSummary: 'INC-20311',
    transferReasonCode: 'USER_REQUEST',
    updatedAt: new Date(base - 5 * 60 * 1000),
    messages: [
      {
        id: 'msg_ana_w1',
        authorType: 'EMPLOYEE',
        authorId: ana.id,
        content: 'Qual o status do meu chamado?',
        createdAt: new Date(base - 25 * 60 * 1000),
      },
      {
        id: 'msg_ana_w2',
        authorType: 'AGENT',
        authorId: null,
        content:
          'O INC-20311 está parado há 5 dias, acima do prazo. Quer que eu chame um analista?',
        createdAt: new Date(base - 24 * 60 * 1000),
      },
      {
        id: 'msg_ana_w3',
        authorType: 'EMPLOYEE',
        authorId: ana.id,
        content: 'Está parado há 5 dias. Quero falar com um analista.',
        createdAt: new Date(base - 6 * 60 * 1000),
      },
      {
        id: 'msg_ana_w4',
        authorType: 'AGENT',
        authorId: null,
        content: 'Encaminhei para o Suporte N2.',
        createdAt: new Date(base - 5 * 60 * 1000),
      },
      {
        id: 'msg_ana_w5',
        authorType: 'SYSTEM',
        authorId: null,
        content: 'Transferida para Suporte N2',
        createdAt: new Date(base - 5 * 60 * 1000 + 1000),
      },
    ],
  });

  // Remove conversa extra da Ana (evita duplicata no console); /chat cria WITH_AGENT sob demanda.
  await prisma.decisionTrace.deleteMany({
    where: { message: { conversationId: 'conv_ana_agent' } },
  });
  await prisma.message.deleteMany({ where: { conversationId: 'conv_ana_agent' } });
  await prisma.conversation.deleteMany({ where: { id: 'conv_ana_agent' } });

  await seedConversation({
    id: 'conv_carla_waiting',
    employeeId: carla.id,
    status: 'WAITING_ANALYST',
    messageCount: 3,
    transferSummary: 'contato em 25 min',
    transferReasonCode: 'USER_REQUEST',
    updatedAt: new Date(base - 12 * 60 * 1000),
    messages: [
      {
        id: 'msg_carla_1',
        authorType: 'EMPLOYEE',
        authorId: carla.id,
        content: 'Preciso de acesso ao SAP ainda hoje',
        createdAt: new Date(base - 15 * 60 * 1000),
      },
      {
        id: 'msg_carla_2',
        authorType: 'AGENT',
        authorId: null,
        content: 'Vou transferir para um analista de acessos.',
        createdAt: new Date(base - 13 * 60 * 1000),
      },
      {
        id: 'msg_carla_3',
        authorType: 'SYSTEM',
        authorId: null,
        content: 'Transferida para Suporte N2',
        createdAt: new Date(base - 12 * 60 * 1000),
      },
    ],
  });

  await seedConversation({
    id: 'conv_bruno_help',
    employeeId: bruno.id,
    status: 'WAITING_ANALYST',
    messageCount: 3,
    transferSummary: 'Agent pediu ajuda · confiança 41%',
    transferReasonCode: 'LOW_CONFIDENCE',
    updatedAt: new Date(base - 19 * 60 * 1000),
    messages: [
      {
        id: 'msg_bruno_1',
        authorType: 'EMPLOYEE',
        authorId: bruno.id,
        content: 'O Outlook não sincroniza e já reiniciei tudo.',
        createdAt: new Date(base - 22 * 60 * 1000),
      },
      {
        id: 'msg_bruno_2',
        authorType: 'AGENT',
        authorId: null,
        content: 'Vou chamar um analista para isso.',
        createdAt: new Date(base - 20 * 60 * 1000),
      },
      {
        id: 'msg_bruno_3',
        authorType: 'SYSTEM',
        authorId: null,
        content: 'Transferida para Suporte N2',
        createdAt: new Date(base - 19 * 60 * 1000),
      },
    ],
  });

  await seedConversation({
    id: 'conv_diego_agent',
    employeeId: diego.id,
    status: 'WITH_AGENT',
    messageCount: 2,
    updatedAt: new Date(base - 30_000),
    messages: [
      {
        id: 'msg_diego_1',
        authorType: 'EMPLOYEE',
        authorId: diego.id,
        content: 'O notebook está muito lento desde ontem.',
        createdAt: new Date(base - 10 * 60 * 1000),
      },
      {
        id: 'msg_diego_2',
        authorType: 'AGENT',
        authorId: null,
        content: 'Vou checar a base de ajuda de performance.',
        createdAt: new Date(base - 8 * 60 * 1000),
      },
    ],
  });

  await seedConversation({
    id: 'conv_elisa_agent',
    employeeId: elisa.id,
    status: 'WITH_AGENT',
    messageCount: 2,
    updatedAt: new Date(base - 7 * 60 * 1000),
    messages: [
      {
        id: 'msg_elisa_1',
        authorType: 'EMPLOYEE',
        authorId: elisa.id,
        content: 'Preciso resetar a senha do Wi-Fi corporativo.',
        createdAt: new Date(base - 12 * 60 * 1000),
      },
      {
        id: 'msg_elisa_2',
        authorType: 'AGENT',
        authorId: null,
        content: 'Chamado INC-20519 criado.',
        createdAt: new Date(base - 7 * 60 * 1000),
      },
    ],
  });

  await seedConversation({
    id: 'conv_fabio_closed',
    employeeId: fabio.id,
    status: 'CLOSED',
    messageCount: 2,
    updatedAt: new Date(base - 9 * 60 * 1000),
    messages: [
      {
        id: 'msg_fabio_1',
        authorType: 'AGENT',
        authorId: null,
        content: 'Pronto — o perfil Exchange foi recriado.',
        createdAt: new Date(base - 11 * 60 * 1000),
      },
      {
        id: 'msg_fabio_2',
        authorType: 'EMPLOYEE',
        authorId: fabio.id,
        content: 'Isso resolveu, obrigado!',
        createdAt: new Date(base - 9 * 60 * 1000),
      },
    ],
  });

  await seedConversation({
    id: 'conv_gabriela_closed',
    employeeId: gabriela.id,
    status: 'CLOSED',
    messageCount: 2,
    updatedAt: new Date(base - 26 * 60 * 60 * 1000),
    messages: [
      {
        id: 'msg_gab_1',
        authorType: 'EMPLOYEE',
        authorId: gabriela.id,
        content: 'Esqueci a senha do Wi-Fi do escritório.',
        createdAt: new Date(base - 27 * 60 * 60 * 1000),
      },
      {
        id: 'msg_gab_2',
        authorType: 'AGENT',
        authorId: null,
        content: 'A senha do Wi-Fi foi enviada para o seu e-mail corporativo.',
        createdAt: new Date(base - 26 * 60 * 60 * 1000),
      },
    ],
  });

  // 1 conversa “vitrine” por funcionário no console — apaga extras de testes (/chat).
  const showcaseByEmployee: Record<string, string> = {
    [ana.id]: 'conv_ana_waiting',
    [carla.id]: 'conv_carla_waiting',
    [bruno.id]: 'conv_bruno_help',
    [diego.id]: 'conv_diego_agent',
    [elisa.id]: 'conv_elisa_agent',
    [fabio.id]: 'conv_fabio_closed',
    [gabriela.id]: 'conv_gabriela_closed',
  };
  for (const [employeeId, keepId] of Object.entries(showcaseByEmployee)) {
    const extras = await prisma.conversation.findMany({
      where: { employeeId, NOT: { id: keepId } },
      select: { id: true },
    });
    for (const extra of extras) {
      await prisma.decisionTrace.deleteMany({
        where: { message: { conversationId: extra.id } },
      });
      await prisma.message.deleteMany({ where: { conversationId: extra.id } });
      await prisma.conversation.delete({ where: { id: extra.id } });
    }
  }

  console.log('Seed OK', {
    employees: [
      ana.email,
      carla.email,
      bruno.email,
      diego.email,
      elisa.email,
      fabio.email,
      gabriela.email,
      analista.email,
    ],
    articles: articles.length,
    tickets: ['INC-0001', 'INC-0002', 'REQ-0001', 'INC-20311', 'REQ-0200', 'INC-0100', 'INC-20519'],
    conversations: [
      'conv_ana_waiting',
      'conv_carla_waiting',
      'conv_bruno_help',
      'conv_diego_agent',
      'conv_elisa_agent',
      'conv_fabio_closed',
      'conv_gabriela_closed',
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
