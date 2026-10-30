# Nexo Assist

Agente de atendimento do service desk de TI — desafio técnico [Beyond the Bytes / Nexo](Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf) (PRD v5).

Funcionário conversa com o agent (help center + chamados + confirmação antes de mutar). Analista assume, devolve ou encerra no console. Conversas e estado sobrevivem a reinício (PostgreSQL).

---

## Como rodar

### Opção A — Docker

```bash
docker compose up --build
# → http://localhost:3000  (se ocupada: APP_PORT=3001 docker compose up --build)
```

- `NEXO_ENV=demo` + `AGENT_LLM=mock` (sem chave Gemini).
- Postgres no Compose; Neon **não** é necessário.
- Contas (qualquer senha): `ana.souza@nexo.com.br` · `analista@nexo.local`
- Detalhes: [`docs/docker.md`](docs/docker.md)

Gemini no Docker (opt-in, **não** lê `GEMINI_API_KEY` do `.env` do host):

```bash
AGENT_LLM=gemini NEXO_DOCKER_GEMINI_API_KEY=sua-chave docker compose up --build
```

### Opção B — Dev local + Neon

```bash
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL, AUTH_SECRET; opcional GEMINI_API_KEY
npm install
npm run db:generate
npm run db:migrate:deploy   # ou db:migrate:dev — só com Neon autorizado
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Banco oficial: **Neon** — [`docs/database.md`](docs/database.md).

### Variáveis essenciais

Ver [`.env.example`](.env.example). Resumo:

| Variável                      | Uso                                                        |
| ----------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL` / `DIRECT_URL` | Neon pooled + direct (Prisma)                              |
| `AUTH_SECRET`                 | Sessão assinada                                            |
| `NEXO_ENV`                    | `production` \| `development` \| `demo` \| `test` \| `e2e` |
| `AGENT_LLM`                   | `mock` \| `gemini` — **mock rejeitado em produção**        |
| `GEMINI_API_KEY`              | Só servidor; obrigatória em produção com Gemini            |

---

## Visão geral da arquitetura

Separação alinhada ao PRD (interface ≠ agent ≠ serviços ≠ domínio):

```
UI (Next.js App Router + Tailwind)
  → Route Handlers / middleware (authz por role)
    → Services (auth, conversations, tickets, help, analyst)
      → Agent orchestrator (Mastra + tools) + Domain (Anexo A testável)
        → Prisma → PostgreSQL (Neon em prod; Compose em demo/E2E)
```

| Camada       | Onde                        | Papel                                                                                            |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------ |
| Interface    | `src/app`, `src/components` | Login, `/chat`, `/profile`, `/analyst`; sem regras Anexo A no client                             |
| Services     | `src/services`              | Casos de uso, authz, ConfirmationGate aplicado, claim atômico                                    |
| Agent        | `src/agent`                 | Intent + tools; **não** muta ticket sem confirmação; pausa se `WAITING_ANALYST` / `WITH_ANALYST` |
| Domain       | `src/domain`                | SLA, duplicidade (Jaccard), reopen 7d, transfer reasons, escopo                                  |
| Persistência | `prisma/`                   | Conversas, mensagens, `DecisionTrace`, tickets, eventos                                          |

Stack: TypeScript `strict` · Next.js 15 · Tailwind · Mastra · Gemini (`@google/genai`) · Prisma 6 · Vitest / Playwright / Storybook · GitHub Actions · deploy previsto Vercel+Neon.

Detalhe: [`memory-bank/architecture.md`](memory-bank/architecture.md).

---

## Como o agent decide o que fazer

A cada mensagem do funcionário (conversa `WITH_AGENT`):

1. **Orquestrador** verifica pause (`isAgentPaused`), limite 30 msgs e rate limit.
2. **Brain** (mock ou Gemini) interpreta a intenção e pode chamar **tools tipadas** (help, listar/consultar tickets, preparar draft, pedir transferência).
3. **Domain / PolicyEngine** decide o que é permitido (SLA, duplicidade, crítico/vencido, transfer reasons) — o LLM **não** é a fonte da verdade do Anexo A.
4. Mutação de chamado (**create / update / reopen**): tool só **prepara** rascunho + token; a mutação ocorre em `POST .../confirm` após o funcionário confirmar na UI (**ConfirmationGate**).
5. Persistência: mensagem do agent + `DecisionTrace` (intent, actions, rationale, tools, `presentedAssurance`, `policyHits`).

Transferência → `WAITING_ANALYST`; agent para de responder até devolução. Analista: claim atômico → `WITH_ANALYST` → devolver / encerrar (`CLOSED`).

---

## Qualidade das decisões (como garantimos)

| Mecanismo             | O quê                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Domínio testável      | Anexo A em `src/domain` com unitários (SLA, Jaccard, reopen, transfer, escopo) — independente do LLM   |
| ConfirmationGate      | Sem confirm da UI, não cria/atualiza/reabre ticket                                                     |
| Authz no servidor     | Middleware + services; ticket/conversa só do owner; analista não vê chat de outro como dono            |
| Trace                 | `DecisionTrace` por resposta do agent (transparência do PRD)                                           |
| LLM                   | Produção: só Gemini, **sem** fallback silencioso para mock; CI/E2E/demo: `AGENT_LLM=mock`              |
| Testes                | Unitários (Vitest) · integração Prisma em `nexo_e2e` (I1–I5) · Playwright P0 · CI com Postgres efêmero |
| Segurança operacional | Rate limit login/agent · redação de segredos em logs · cookies `Secure` só com `NEXO_ENV=production`   |

---

## Escolha do modelo (LLM)

**Google Gemini** via `@google/genai` (default `gemini-flash-lite-latest`).

- Atende o PRD (“qualquer provedor”) com SDK oficial TypeScript e boa relação custo/latência para service desk.
- Mastra orquestra tools; o domínio permanece no código.
- CI e Docker demo usam **mock** determinístico (sem custo, previsível para E2E).
- Em **produção**, `AGENT_LLM=mock` é rejeitado; falta de chave falha de forma explícita.

---

## Principais trade-offs

1. **Regras no domain vs LLM** — mais código e testes; decisões críticas auditáveis e estáveis.
2. **Confirm só na UI** — não deixa o modelo “confirmar” sozinho; um passo a mais na UX.
3. **Neon oficial + Compose demo/E2E** — prod gerenciada; avaliadores e CI sem depender do Neon do autor.
4. **Poll 5s** em vez de WebSocket — simples na Vercel; latência aceitável no console.
5. **Rate limit em memória** — suficiente no MVP single-instance; em multi-instância seria Redis.
6. **Jaccard ≥ 0.5 / TTL confirmação** — hipóteses calibráveis (`requirements-resolution.md`), não valores do PRD.
7. **Standalone + cópia de** `.next/static` **no E2E** — alinhado ao Docker; evita `/login` preso em “Carregando…”.

---

## O que faria com mais tempo

- Painel/UI completa do `DecisionTrace` (chips + detalhe expandível em todas as bolhas).
- Streaming SSE da resposta do agent.
- Deploy Vercel + Neon com smoke de pooling sob carga; monitoramento de custo Gemini.
- E8 P1: double-claim em dois browsers; feriados no calendário de SLA.
- Rate limit distribuído; embeddings opcionais para duplicidade.
- Acessibilidade e polimento visual fino vs protótipo.

---

## Deploy

**Ainda não publicado** (diferencial do PRD; ausência não penaliza). Caminho previsto: **Vercel** + **Neon**, com `NEXO_ENV=production`, `AGENT_LLM=gemini`, `GEMINI_API_KEY`, `AUTH_SECRET`, URLs Neon — sem mock. Proteções já no código: rate limit, authz, cookie Secure em produção, chave só em env.

Quando houver URL, ela entra aqui.

---

## Testes e CI

```bash
npm test                     # unitário (sem Gemini real)
npm run db:e2e:up
npm run db:e2e:prepare
npm run test:integration     # I1–I5 em Postgres nexo_e2e (:5433)
npm run test:e2e             # Playwright; copia static → standalone
```

GitHub Actions: job `ci` (lint / typecheck / unit / prisma validate / build) + job `e2e` (Postgres service `nexo_e2e`, integração, Playwright). Sem secret Gemini/Neon no E2E.

---

## Scripts úteis

| Script                                          | Descrição               |
| ----------------------------------------------- | ----------------------- |
| `npm run dev`                                   | Next.js desenvolvimento |
| `npm run lint` / `typecheck` / `test` / `build` | Qualidade               |
| `npm run test:e2e` / `test:integration`         | E2E / integração        |
| `npm run db:e2e:up` / `prepare` / `down`        | Postgres E2E            |
| `npm run storybook`                             | Componentes isolados    |
| `npm run db:seed`                               | Seed demo (Neon)        |
| `npm run docker:up`                             | Alias Compose           |

---

## Documentação do projeto

| Doc                                                                                | Conteúdo                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`](Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf) | PRD                                                    |
| [`memory-bank/`](memory-bank/)                                                     | Arquitetura, progresso, decisões vs PRD, testes, dados |
| [`docs/database.md`](docs/database.md)                                             | Neon + Prisma                                          |
| [`docs/docker.md`](docs/docker.md)                                                 | Compose demo                                           |
| [`docs/prototype/`](docs/prototype/)                                               | PNGs do Anexo C                                        |
| [`AGENTS.md`](AGENTS.md)                                                           | Instruções para contribuidores/agentes                 |
