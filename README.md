# Nexo Assist

Agente de atendimento do service desk de TI (desafio Nexo / Beyond the Bytes).

## Como rodar (bootstrap)

```bash
cp .env.example .env
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Scripts

| Script                      | Descrição                                             |
| --------------------------- | ----------------------------------------------------- |
| `npm run dev`               | Next.js em desenvolvimento                            |
| `npm run lint`              | ESLint                                                |
| `npm run typecheck`         | TypeScript `strict`                                   |
| `npm test`                  | Vitest (unitário)                                     |
| `npm run test:e2e`          | Playwright (requer app; smoke preparado)              |
| `npm run build`             | Build de produção                                     |
| `npm run storybook`         | Storybook                                             |
| `npm run db:generate`       | `prisma generate`                                     |
| `npm run db:validate`       | `prisma validate`                                     |
| `npm run db:migrate:dev`    | `prisma migrate dev` (dev; requer Neon + autorização) |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (prod/CI autorizado)          |
| `npm run db:studio`         | `prisma studio`                                       |
| `npm run db:seed`           | Seed mínimo idempotente (demo)                        |

### Banco (Neon + Prisma)

Banco oficial: **Neon** (PostgreSQL gerenciado). Sem Postgres local obrigatório.

1. No [console Neon](https://console.neon.tech), copie as connection strings **Pooled** e **Direct**.
2. `cp .env.example .env` e preencha `DATABASE_URL` (pooled) e `DIRECT_URL` (direct).
3. `npm run db:generate` e `npm run db:validate`.
4. Migrations: `npm run db:migrate:dev` (dev) / `npm run db:migrate:deploy` (prod) — **só** com credenciais reais e autorização; não rode no Neon compartilhado sem intenção explícita.

Detalhes: [`docs/database.md`](docs/database.md). Schema: `prisma/schema.prisma` (alinhado a `memory-bank/data-model.md`).

### CI

GitHub Actions (`.github/workflows/ci.yml`): `lint` → `typecheck` → `test` → `prisma validate` → `build`. Sem chamada real à API Gemini.

### Husky

Hook `pre-commit` (lint-staged) está preparado. **Ativa após** `git init` + `npm install` (não inicializado automaticamente neste bootstrap).

## Documentação

- PRD: `Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`
- Memory Bank: `memory-bank/`
- Protótipos: `docs/prototype/`
- Agentes: `AGENTS.md`

## Próximos marcos

1. Auth demo + domínio (SLA, duplicidade, ConfirmationGate) com testes
2. Chat do funcionário (fidelidade ao protótipo)
3. Agent Mastra + Gemini (mocks no CI)
4. Console do analista
5. Deploy (Vercel + Neon; validar pooling com credenciais reais — ver `docs/database.md`)
