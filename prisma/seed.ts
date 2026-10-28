/**
 * Seed mínimo (data-model.md §10).
 * Idempotente via upsert por email/slug/number.
 * Sem password hash (auth demo: qualquer senha).
 *
 * Uso: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ana = await prisma.employee.upsert({
    where: { email: 'ana@nexo.local' },
    update: {},
    create: {
      id: 'emp_ana',
      email: 'ana@nexo.local',
      name: 'Ana Souza',
      department: 'Engenharia',
      role: 'EMPLOYEE',
    },
  });

  const bruno = await prisma.employee.upsert({
    where: { email: 'bruno@nexo.local' },
    update: {},
    create: {
      id: 'emp_bruno',
      email: 'bruno@nexo.local',
      name: 'Bruno Lima',
      department: 'Operações',
      role: 'EMPLOYEE',
    },
  });

  const analista = await prisma.employee.upsert({
    where: { email: 'analista@nexo.local' },
    update: {},
    create: {
      id: 'emp_analista',
      email: 'analista@nexo.local',
      name: 'Carla Analista',
      department: 'Service Desk',
      role: 'ANALYST',
    },
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

  await prisma.ticket.upsert({
    where: { number: 'INC-0001' },
    update: {},
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
    where: { number: 'INC-0100' },
    update: {},
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

  await prisma.conversation.upsert({
    where: { id: 'conv_ana_waiting' },
    update: {
      status: 'WAITING_ANALYST',
      transferSummary: 'Funcionário pediu analista após VPN 809 recorrente.',
      transferReasonCode: 'USER_REQUEST',
      assignedAnalystId: null,
    },
    create: {
      id: 'conv_ana_waiting',
      employeeId: ana.id,
      status: 'WAITING_ANALYST',
      messageCount: 4,
      transferSummary: 'Funcionário pediu analista após VPN 809 recorrente.',
      transferReasonCode: 'USER_REQUEST',
      assignedAnalystId: null,
    },
  });

  await prisma.conversation.upsert({
    where: { id: 'conv_ana_agent' },
    update: { status: 'WITH_AGENT', assignedAnalystId: null },
    create: {
      id: 'conv_ana_agent',
      employeeId: ana.id,
      status: 'WITH_AGENT',
      messageCount: 2,
    },
  });

  console.log('Seed OK', {
    employees: [ana.email, bruno.email, analista.email],
    articles: articles.length,
    tickets: ['INC-0001', 'INC-0002', 'REQ-0001', 'INC-0100'],
    conversations: ['conv_ana_waiting', 'conv_ana_agent'],
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
