# Progress — Nexo Assist

## Status atual

**Fase:** 5 UI fiel ao protótipo **concluída**; auth/conversas (3) + domínio (2.x).  
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
- [x] **Fase 3** Auth demo, middleware, ConversationService + limite 30
- [x] **Fase 5** UI fiel ao protótipo: tokens, shells, login split, chat (draft/select/quick replies), perfil, console analista (rail+3 painéis); Storybook básico

## Verificações confirmadas

| Comando / check | Resultado |
|-----------------|-----------|
| `npm run lint` / `typecheck` / `test` / `build` | OK (2026-10-28: **100** testes; app build OK) |
| `npm run format:check` | OK |
| `npm run build-storybook` | OK após `overrides.webpack=5.101.2` (Next 15.5 × SB 8 webpack `tap`) |
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

1. **Fase 6 (plano revisado)** — Agent Mastra + Gemini (mocks no CI), tools + DecisionTrace no chat real.  
2. Console analista: mensagens reais + claim já iniciados; enriquecer com tickets do owner.

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
| 2026-10-27 | **Fase 3** Auth/sessão/middleware + ConversationService + stubs UI (85 testes) |
| 2026-10-27 | **Fase 5** UI protótipo (login/chat/perfil/console) + componentes/Storybook |
| 2026-10-28 | Login: logos oficiais (brand/app), Newsreader + Schibsted Grotesk, navy `#1B2430`, conteúdo esquerdo centralizado |
| 2026-10-28 | Login: fidelidade ao protótipo (mock chat, métricas, form 280px, primary `#0062C5`, coluna esquerda centrada) |
| 2026-10-28 | Escopo UI: só login + `Typography`/`Button`/ícones; demais telas → `ComingSoon`; testes RTL dos UI |
| 2026-10-28 | Design system mantido; login: `Input`/`Checkbox`/`LoginChatPreview`/`LoginMetrics`; CTA Entrar → |
| 2026-10-28 | Login layout: logo topo + métricas rodapé (fiel ao protótipo em 15″ e 27″); headline 54 |
| 2026-10-28 | Login esquerda: asset Showcase oficial centralizado/responsivo (`LoginShowcase`) |
| 2026-10-28 | Validação: lint/typecheck/test(100)/build/format OK; Storybook build OK com pin `webpack@5.101.2` |
| 2026-10-28 | Login esquerda: `LoginShowcase` em código (logo/story/chat/stats); PNG só referência |
| 2026-10-28 | Login: clean-up — `BrokenLines`, `login-layout.ts`, tokens 15″ vs 2xl; lint/test/SB |
