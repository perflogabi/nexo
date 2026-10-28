# Implementation Plan — Nexo Assist

## Fase 0 — Planejamento e revisão

- [x] Ler PRD v5
- [x] Memory Bank + regras Cursor
- [x] Fidelidade visual (`design-system.md`, `docs/prototype/`)
- [x] Revisão arquitetural
- [x] Resolução de dúvidas vs PRD (`requirements-resolution.md`, `progress.md`)
- [x] **Não** instalar deps / implementar nesta fase

## Fase 1 — Bootstrap técnico

Usar **npm** (`package-lock.json`).

1. [ ] `git init` — **ainda sem autorização** (Husky preparado)
2. [x] `create-next-app` (TS, App Router, ESLint, **Tailwind**, npm) — Next 15.5.28
3. [x] `strict: true`; scripts: `lint`, `typecheck`, `test`, `build`
4. [x] Prettier + Husky + lint-staged (hooks pós-git)
5. [x] Prisma schema skeleton + `.env.example` (migrations/seed = fases seguintes)
6. [x] Estrutura de pastas conforme `architecture.md`
7. [x] `.github/workflows/ci.yml` com scripts reais + `prisma validate`
8. [x] Storybook mínimo

**Saída:** skeleton validado localmente (`lint`/`typecheck`/`test`/`build`). Sem telas completas nem agent.

## Fase 2 — Domínio e Ticket Service

1. Enums + PolicyEngine (SLA crítica corrida vs úteis; duplicidade Jaccard; reopen 7d; transfer por reasonCode; escopo TI)
2. `TicketService` + repositório Prisma + falha intermitente
3. Help Center + seed (funcionários e **analistas distintos**)
4. Testes unitários do domínio

## Fase 3 — Auth e conversas

1. Login demo (qualquer senha); role validado no servidor
2. Middleware: EMPLOYEE → `/chat`|`/profile`; ANALYST → `/analyst`
3. Conversation / Message / DecisionTrace
4. Limite **30 msgs/conversa** no servidor

## Fase 4 — Agent Mastra

1. Tools tipadas + PolicyEngine
2. ConfirmationGate
3. Pause em atendimento humano; transferência com justificativa
4. DecisionTrace
5. Integração com LLM mockado

## Fase 5 — UI funcionário

Login, `/chat`, `/profile` (leitura + stubs visuais). Fidelidade às PNGs. Storybook.

## Fase 6 — Console analista

Rail + lista + chat + painel de chamados. Assumir / devolver / encerrar.

## Fase 7 — Qualidade e deploy

1. Playwright E2E
2. Deploy Vercel + Neon (validar pooling)
3. Rate limit / proteção de chave
4. README (arquitetura, agent, trade-offs, SLA simplificado, como rodar)

---

## Rotas (App Router)

| Rota | Tela | Auth |
|------|------|------|
| `/login` | Tela 1 | pública |
| `/chat` | Telas 2–3 (estados) | EMPLOYEE |
| `/profile` | Perfil (leitura) | EMPLOYEE |
| `/analyst` | Console (lista + atendimento por seleção/estado) | ANALYST |
| `/api/chat` | streaming agent | EMPLOYEE |
| `/api/analyst/*` | ações do console | ANALYST |

> Tela 5 do protótipo = **estado** do console (após Assumir), não necessariamente rota separada. Rota `/analyst/conversations/[id]` é opcional se a seleção na lista bastar.

## Componentes planejados

Ver `design-system.md` (lista Storybook). Nomes alinhados ao protótipo; não uniformizar shells distintas.

## Tooling

| Ferramenta | Uso |
|------------|-----|
| npm | lockfile oficial `package-lock.json` |
| Tailwind | estilo; sem Bootstrap |
| ESLint / Prettier | lint + format |
| Husky + lint-staged | pre-commit |
| Storybook | componentes isolados |
| GitHub Actions | já em `.github/workflows/ci.yml` — ativa com `package.json` |
| Gemini | só na fase agent; CI com mocks |
| Vercel | app; Neon = Postgres oficial (`docs/database.md`) |

## Commits sugeridos

1. chore: bootstrap next + tooling (npm)
2. feat: prisma schema + seed
3. feat: domain policies + ticket service
4. feat: auth session (roles)
5. feat: conversations persistence
6. feat: mastra agent + traces
7. feat: employee chat UI
8. feat: analyst console
9. test: e2e happy paths
10. docs: README + deploy

## Fora da etapa atual (revisão)

- Instalar pacotes
- `create-next-app`
- Telas, services, DB, agent, migrations
