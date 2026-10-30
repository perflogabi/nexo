# Progress — Nexo Assist

## Status atual

**Produto:** chat funcionário + agent (Mastra/mock|Gemini) + console analista + ConfirmationGate UI + Docker demo + E2E/CI — **implementados**.  
**Planejamento:** aprovado; Memory Bank e README alinhados aos entregáveis do PRD v5.  
**Git:** `main` com histórico Conventional Commits; push sob autorização do usuário.  
**Deploy:** ainda **não** publicado (diferencial PRD).

## Feito (resumo por fase)

- [x] Bootstrap Next 15 + TS strict + Tailwind + Vitest/RTL/Playwright/Storybook + CI
- [x] Prisma + Neon (oficial) + migration init + seed demo
- [x] Domain: SLA, Jaccard, reopen 7d, transfer, escopo + ConfirmationGate
- [x] TicketService (Prisma + falha intermitente) + Help Center
- [x] Auth demo, middleware roles, conversas, limite 30
- [x] UI fiel ao protótipo (login / chat / profile / analyst)
- [x] Agent: tools Mastra, mock/Gemini, DecisionTrace, pause, transfer; confirm só via UI + ALS
- [x] Docker Compose demo (`NEXO_ENV=demo`, `AGENT_LLM=mock`; Gemini opt-in via `NEXO_DOCKER_GEMINI_API_KEY`)
- [x] Rate limit + redação de segredos; cookie Secure só em production
- [x] E2E: `nexo_e2e`, guardrail, seed-e2e, integração I1–I5, Playwright P0, assets standalone, job CI e2e
- [x] UI indicação CLOSED no `/chat`; LLM sem mock em prod / sem fallback silencioso Gemini→mock
- [x] README de entrega (arquitetura, agent, qualidade, trade-offs, Gemini, o que faria com mais tempo)

## Verificações (última rodada relevante)

| Check | Resultado |
|-------|-----------|
| Unitários | ~179 testes OK |
| Integração `nexo_e2e` | 6/6 OK |
| Playwright P0 | 10/10 OK (após static no standalone + `loginViaUi` com `waitForURL`) |
| Build com `NEXO_ENV=production` + `AGENT_LLM=gemini` (chave fictícia) | OK |
| Docker demo mock | OK |

## Limitações conhecidas

- Deploy Vercel ainda não feito.
- Streaming SSE da reply do agent ainda não.
- UI completa de detalhe do DecisionTrace (chips/painel) ainda parcial vs protótipo.
- Rate limit em memória (single instance).
- Pooling Neon sob carga serverless: hipótese aberta.
- Hipóteses calibráveis: Jaccard 0.5, TTL PendingConfirmation, reopen de APPROVED — ver `requirements-resolution.md`.

## Hipóteses ainda pendentes (não requisitos PRD)

1. Jaccard ≥ 0.5  
2. TTL `PendingConfirmation`  
3. Reopen de `APPROVED`  
4. Mensagens parciais após falha de stream  
5. Limpar `transferSummary` ao devolver  
6. Smoke de pooling Neon em produção sob carga  

## Próximo marco recomendado

1. Push + acompanhar CI/E2E no GitHub.  
2. Deploy Vercel/Neon (`NEXO_ENV=production`, `AGENT_LLM=gemini`).  
3. Polir DecisionTrace na UI; streaming SSE opcional; E8 P1 double-claim.

## Log

| Data | Nota |
|------|------|
| 2026-10-30 | Docs entrega: README PRD-completo; progress/architecture/implementation-plan atualizados |
| 2026-10-30 | E2E estável: assets standalone + `loginViaUi` waitForURL; 7 commits da fase E2E |
| 2026-10-30 | E2E: Postgres `nexo_e2e`, seed-e2e, I1–I5, Playwright P0, UI CLOSED, LLM prod |
| 2026-10-29 | Confirm só via UI; ALS; TicketDraftCard |
| 2026-10-27–29 | Bootstrap → domínio → auth → UI → agent → Docker → rate limit (ver git log) |
