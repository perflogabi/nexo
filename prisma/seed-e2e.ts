/**
 * Seed mínimo E2E — só identidades + help center.
 * Sem conversas/tickets mutáveis que testes consumam como pré-condição.
 * Idempotente via upsert.
 *
 * Uso (após assert-e2e-database): node --experimental-strip-types prisma/seed-e2e.ts
 */

import { PrismaClient } from '@prisma/client';

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

async function main() {
  await upsertEmployee({
    id: 'emp_ana',
    email: 'ana.souza@nexo.com.br',
    name: 'Ana Souza',
    department: 'Financeiro',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_carla_mendes',
    email: 'carla.mendes@nexo.com.br',
    name: 'Carla Mendes',
    department: 'RH',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_bruno',
    email: 'bruno.tavares@nexo.com.br',
    name: 'Bruno Tavares',
    department: 'Engenharia',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_diego',
    email: 'diego.ramos@nexo.com.br',
    name: 'Diego Ramos',
    department: 'Comercial',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_elisa',
    email: 'elisa.prado@nexo.com.br',
    name: 'Elisa Prado',
    department: 'Marketing',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_fabio',
    email: 'fabio.nunes@nexo.com.br',
    name: 'Fábio Nunes',
    department: 'Operações',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_gabriela',
    email: 'gabriela.rocha@nexo.com.br',
    name: 'Gabriela Rocha',
    department: 'Produto',
    role: 'EMPLOYEE',
  });
  await upsertEmployee({
    id: 'emp_analista',
    email: 'analista@nexo.local',
    name: 'Rafael Lima',
    department: 'Suporte N2',
    role: 'ANALYST',
  });
  // Segundo analista — I3 claim concorrente
  await upsertEmployee({
    id: 'emp_analista_2',
    email: 'analista2@nexo.local',
    name: 'Marina Costa',
    department: 'Suporte N2',
    role: 'ANALYST',
  });

  const articles = [
    {
      slug: 'vpn-erro-809-windows-10',
      title: 'VPN erro 809 no Windows 10',
      body: 'No Windows 10: verifique NAT-T, reinicie o adaptador TAP e confirme a política de firewall corporativa.',
      tags: ['vpn', '809', 'windows10'],
    },
    {
      slug: 'vpn-erro-809-windows-11',
      title: 'VPN erro 809 no Windows 11',
      body: 'No Windows 11: atualize o cliente VPN, desative IPv6 temporariamente no adaptador e reteste o túnel.',
      tags: ['vpn', '809', 'windows11'],
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

  console.log('[seed-e2e] employees + help articles OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
