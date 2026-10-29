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
- [x] Console analista: mensagens/tickets reais + Assumir/Devolver/Encerrar (`CLOSED`); `/chat` com transcript da API + seed
- [x] **Fase 6 (slice)** Agent: Mastra tools + mock/Gemini brain, orquestrador, DecisionTrace, pause, transfer, confirm route
- [x] **Fase 7 (slice)** Docker Compose + Dockerfile standalone para avaliadores (`docs/docker.md`)

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
- Agent: mock no CI; Gemini real só com `GEMINI_API_KEY` + `AGENT_LLM=gemini` (ou default com chave).
- Streaming SSE `/api/chat` ainda não (reply síncrona no POST messages).
- Hipótese de pooling sob carga serverless real ainda aberta.

## Hipóteses ainda pendentes (não requisitos PRD)

1. Jaccard ≥ 0.5  
2. TTL `PendingConfirmation`  
3. Reopen de `APPROVED`  
4. Mensagens parciais após falha de stream  
5. Limpar `transferSummary` ao devolver  
6. Smoke de pooling Neon em produção sob carga

## Próximo marco recomendado

1. Polir chat: carregar DecisionTrace no GET, quick replies → confirm, streaming SSE opcional.
2. **Fase 7** — rate limit/chave Gemini → E2E → README → deploy Vercel/Neon (Docker avaliadores: feito).

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
| 2026-10-28 | Chat: `EmployeeSidebar` responsivo (ícones anexo + mark encolhido) + `EmployeeShell` |
| 2026-10-28 | Chat thread consulta/transferência: bolhas, lista radio, card INC, quick replies, composer (estático) |
| 2026-10-28 | Analyst: `AnalystRail` + `ConversationList` (filtros/busca/itens) no `/analyst` |
| 2026-10-28 | Analyst: chat central (Assumir/Devolver) + painel Chamados da Ana |
| 2026-10-28 | Analyst chat: seta ↓ “mais abaixo” (scrollbar oculta) em overflow |
| 2026-10-28 | Analyst lista: `.nexo-scroll-thin` + largura 300/320/340 |
| 2026-10-28 | Analyst responsivo: mobile master-detail, tablet split+drawer, desktop 4 faixas |
| 2026-10-28 | Analyst tela 5: estado assumido (bolhas, composer enviar, chamados Em atendimento) |
| 2026-10-28 | Cliente Meu perfil: `/profile` com shell + cards dados/senha (stub) |
| 2026-10-28 | Analyst: lista/Assumir/Devolver ligados à API (transcript ainda demo) |
| 2026-10-28 | Fontes: remove next/font/google (ETIMEDOUT); link CSS + fallbacks locais |
| 2026-10-28 | Console + `/chat`: mensagens reais; tickets do owner; Encerrar → `CLOSED`; seed transcript `conv_ana_waiting` |
| 2026-10-28 | **Fase 6** Agent Mastra tools + mock/Gemini (`@google/genai`); orquestrador; DecisionTrace; pause/transfer |
| 2026-10-28 | Agent: Gemini preferido; fallback automático para mock em timeout/erro/resposta vazia |
| 2026-10-28 | Gemini: default `gemini-flash-latest`, timeout 12s + UI otimista (API 503/lenta) |
| 2026-10-28 | Seed console: Ana/Carla/Bruno/Diego/Elisa/Fábio/Gabriela + lista WITH_AGENT/CLOSED |
| 2026-10-28 | Analyst: lista 1 conversa/pessoa (fila > /chat); UI Assumir do protótipo; Ana = Financeiro |
| 2026-10-29 | Docker: Compose app+Postgres, entrypoint migrate/seed, `docs/docker.md` |
