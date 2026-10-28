# Progress — Nexo Assist

## Status atual

**Fase:** 2.3 TicketService + seed **concluída**; ConfirmationGate + PolicyEngine.  
**Planejamento:** aprovado para implementação incremental.  
**Git:** branch `main` local (commits sob controle do usuário).  
**Produto (chat/agent/console):** ainda não implementado.

## Feito nesta etapa

- [x] Next.js 15.5.28 (App Router) + TypeScript `strict` + Tailwind 4 + ESLint + Prettier
- [x] npm + `package-lock.json`; package `nexo-assist`
- [x] Estrutura `src/{app,components,domain,agent,services,repositories,lib}`
- [x] Vitest + RTL; Playwright smoke; Storybook 8 mínimo
- [x] Prisma schema alinhado a `data-model.md`
- [x] Neon oficial: `DATABASE_URL` (pooled) + `DIRECT_URL` (direct); `.env` local
- [x] Migration inicial `20261028005615_init` criada e aplicada no Neon
- [x] CI: lint → typecheck → test → prisma validate → build (sem migrate automático)
- [x] `git init -b main` (sem commit/push)
- [x] **Fase 2.1** PolicyEngine (SLA, Jaccard, reopen, transfer, escopo) + testes unitários
- [x] **Fase 2.2** ConfirmationGate (domínio puro, TTL H)
- [x] **Fase 2.3** TicketService (store port, Prisma + in-memory, falha intermitente) + seed + Help Center leitura

## Verificações confirmadas

| Comando / check | Resultado |
|-----------------|-----------|
| `npm run lint` / `typecheck` / `test` | OK (Fase 2.3: 75 testes) |
| `npm run db:seed` | OK (Neon; employees/artigos/tickets demo) |
| Conexão pooled + direct | OK |
| `prisma migrate dev --name init --skip-seed` | OK — DB in sync |
| `prisma migrate status` | 1 migration; schema up to date |
| Tabelas públicas | Employee, Conversation, Message, DecisionTrace, Ticket, TicketEvent, HelpArticle, PendingConfirmation (+ `_prisma_migrations`) |

## Limitações

- Commits sob controle do usuário; sem remote configurado nesta máquina.
- Seed mínimo aplicado no Neon (`npm run db:seed`); idempotente.
- Mastra / `@google/genai` **não** instalados (fase do agent).
- Telas e auth de produto **não** implementadas.
- Hipótese de pooling sob carga serverless real ainda aberta.

## Hipóteses ainda pendentes (não requisitos PRD)

1. Jaccard ≥ 0.5  
2. TTL `PendingConfirmation`  
3. Reopen de `APPROVED`  
4. Mensagens parciais após falha de stream  
5. Limpar `transferSummary` ao devolver  
6. Smoke de pooling Neon em produção sob carga

## Próximo marco recomendado

1. **Fase 3** — Auth demo + conversas (login, middleware de role, limite 30).  
2. Depois UI / agent conforme plano.

## Log

| Data | Nota |
|------|------|
| 2026-10-27 | Planejamento + auditorias documentais |
| 2026-10-27 | Higiene DecisionTrace / agentPaused |
| 2026-10-27 | **Bootstrap** Next/Prisma/Vitest/Storybook/CI |
| 2026-10-27 | Prep: `git init -b main`, `.env`, revalidação |
| 2026-10-27 | Migration `20261028005615_init` aplicada no Neon (banco vazio → sync) |
| 2026-10-27 | **Fase 2.1** PolicyEngine + 48 testes unitários (lint/typecheck OK) |
| 2026-10-27 | **Fase 2.2** ConfirmationGate domínio + testes (TTL H explícito) |
| 2026-10-27 | **Fase 2.3** TicketService + seed Neon + 75 testes unitários |
