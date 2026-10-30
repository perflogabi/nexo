# Nexo Assist

Agente de atendimento do service desk de TI — desafio técnico Beyond the Bytes / Nexo (PRD v5).

Funcionário conversa com o agent (central de ajuda, chamados e confirmação antes de mutar). Analista assume, devolve ou encerra no console. Estado e histórico persistem em PostgreSQL.

---

## Como rodar

### Opção A — Docker

```bash
docker compose up --build
# → http://localhost:3000  (porta ocupada: APP_PORT=3001 docker compose up --build)
```

- `NEXO_ENV=demo` + `AGENT_LLM=mock` (sem chave Gemini).
- Postgres no Compose; Neon não é necessário.
- Login demo: qualquer senha nos e-mails do seed (ex.: `ana.souza@nexo.com.br`, `analista@nexo.local`).
- Detalhes: [`docs/docker.md`](docs/docker.md).

Gemini no Docker (opt-in; **não** lê `GEMINI_API_KEY` do `.env` do host):

```bash
AGENT_LLM=gemini NEXO_DOCKER_GEMINI_API_KEY=sua-chave docker compose up --build
```

### Opção B — Dev local + Neon

```bash
cp .env.example .env   # DATABASE_URL, DIRECT_URL, AUTH_SECRET; opcional GEMINI_API_KEY
npm install
npm run db:generate
npm run db:migrate:deploy   # ou db:migrate:dev — só com Neon autorizado
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Banco oficial: **Neon** — [`docs/database.md`](docs/database.md).

Variáveis: ver [`.env.example`](.env.example). Em produção: `NEXO_ENV=production`, `AGENT_LLM=gemini`, `GEMINI_API_KEY` (mock é rejeitado).

---

## Arquitetura

```
UI (Next.js App Router + Tailwind)
  → Route Handlers / middleware (authz por role)
    → Services (auth, conversations, tickets, help, analyst)
      → Agent orchestrator (Mastra + tools) + Domain (Anexo A testável)
        → Prisma → PostgreSQL (Neon em prod; Compose em demo/E2E)
```

| Camada       | Onde                        | Papel                                                               |
| ------------ | --------------------------- | ------------------------------------------------------------------- |
| Interface    | `src/app`, `src/components` | Login, `/chat`, `/profile`, `/analyst`                              |
| Services     | `src/services`              | Casos de uso, authz, ConfirmationGate, claim atômico                |
| Agent        | `src/agent`                 | Intent + tools; não muta ticket sem confirmação; pausa sob analista |
| Domain       | `src/domain`                | SLA, duplicidade (Jaccard), reopen 7d, transfer, escopo             |
| Persistência | `prisma/`                   | Conversas, mensagens, `DecisionTrace`, tickets, eventos             |

Stack: TypeScript `strict` · Next.js 15 · Tailwind · Mastra · Gemini (`@google/genai`) · Prisma 6 · Vitest / Playwright / Storybook · GitHub Actions.

Detalhe: [`memory-bank/architecture.md`](memory-bank/architecture.md).

---

## Como o agent decide

A cada mensagem do funcionário (conversa `WITH_AGENT`):

1. Orquestrador valida pause (`WAITING_ANALYST` / `WITH_ANALYST`), limite de 30 mensagens e rate limit.
2. Brain (mock ou Gemini) interpreta a intenção e pode chamar tools tipadas (help, listar/consultar tickets, preparar draft, transferir).
3. **Domain / PolicyEngine** aplica o Anexo A (SLA, duplicidade, crítico/vencido, motivos de transferência). O LLM não é a fonte da verdade dessas regras.
4. Mutações **create / update / reopen**: a tool só **prepara** rascunho + token; a mutação ocorre em `POST .../confirm` após o funcionário confirmar na UI (**ConfirmationGate**).
5. Persistência da resposta do agent + registro de `DecisionTrace`.

Transferência → `WAITING_ANALYST` (agent não responde). Analista: claim atômico → `WITH_ANALYST` → devolver (`WITH_AGENT`) ou encerrar (`CLOSED`).

### LLM

**Google Gemini** (`@google/genai`, default `gemini-flash-lite-latest`): SDK TypeScript oficial, custo/latência adequados ao MVP. Mastra orquestra tools; domínio permanece em código. CI/Docker demo usam mock determinístico. Em produção, `AGENT_LLM=mock` é rejeitado e ausência de chave falha de forma explícita.

---

## Transparência — DecisionTrace (prioridade do PRD)

Cada resposta do agent persiste um `DecisionTrace` ligado à mensagem, com:

| Campo                | Significado                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `understoodIntent`   | O que o agent entendeu da mensagem                                                          |
| `actions[]`          | Ações consideradas/executadas (`code` + `label` legível)                                    |
| `toolCalls[]`        | Ferramentas usadas (`name`, `ok`, `summary`)                                                |
| `rationale`          | Justificativa textual da escolha                                                            |
| `policyHits[]`       | Políticas/regras tocadas (ex.: `confirmation_gate`, `USER_REQUEST`, `ticket_read_scoped`)   |
| `modelConfidence`    | Sinal numérico auxiliar do modelo (`number \| null`) — **não** decide sozinho transferência |
| `presentedAssurance` | Grau de segurança para UI: `UNKNOWN` \| `LOW` \| `MEDIUM` \| `HIGH`                         |

### O que a interface mostra hoje

No `/chat`, acima da bolha do agent, `ChatAgentMeta` exibe chips `✓` com os **labels** de `actions` (ex.: “consultou a base de ajuda”, “preparou rascunho do chamado”). Isso corresponde à transparência resumida do protótipo.

### O que não é um painel completo de auditoria

A UI **não** apresenta ainda um accordion/painel com intent, rationale, `toolCalls`, `policyHits`, `modelConfidence` e `presentedAssurance` em detalhe. Esses campos existem na **persistência** e voltam no JSON de `POST /api/conversations/[id]/messages` (`trace`). Podem ser inspecionados via resposta da API, Prisma Studio ou logs de desenvolvimento — não há tela dedicada de auditoria.

Após reload, o histórico de mensagens é recarregado; os chips detalhados do turno corrente dependem do `trace` mantido no estado do cliente na sessão ativa (não há, no momento, um GET que reanexa todo o detalhe do trace a cada bolha antiga na UI).

---

## Condução da conversa

| Situação                                                   | Comportamento implementado                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Faltam dados para abrir chamado                            | Agent pede detalhes; tools não confirmam mutação sozinhas                                               |
| Help / VPN etc.                                            | Consulta artigos; pode resolver sem criar chamado                                                       |
| Listar / consultar chamados                                | Tools escopadas ao `ownerEmployeeId`; UI com lista/seleção/cards                                        |
| Abrir / atualizar / reabrir                                | `prepareTicketDraft` → `TicketDraftCard` → botões Confirmar / Cancelar → `POST .../confirm`             |
| Quick replies                                              | Opções na bolha (ex.: falar com analista, adicionar informação) — tratadas no fluxo do chat             |
| Pedido de analista / vencido / baixa segurança operacional | Transferência com `reasonCode`; status `WAITING_ANALYST`                                                |
| Contexto                                                   | Mensagens recentes da conversa enviadas ao brain; conversa é a “sessão” (limite 30 msgs employee+agent) |

**Regra explícita:** interpretação do LLM **não** executa create/update/reopen. Só o ConfirmationGate após ação do usuário na UI.

---

## Dados de demonstração (`prisma/seed.ts`)

| Tipo                     | Quantidade / conteúdo (seed atual)                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Funcionários             | 7 (`EMPLOYEE`) — Ana, Carla, Bruno, Diego, Elisa, Fábio, Gabriela                                       |
| Analista                 | 1 — `analista@nexo.local` (Rafael Lima)                                                                 |
| Artigos (help)           | 6 (VPN 809, horário SD, reset senha, Outlook, notebook lento, software)                                 |
| Chamados                 | 7 números únicos (`INC-0001`, `INC-0002`, `REQ-0001`, `INC-20311`, `REQ-0200`, `INC-0100`, `INC-20519`) |
| Categorias nos tickets   | `ACESSO`, `HARDWARE`, `REDE_VPN`, `EMAIL`                                                               |
| Prioridades nos tickets  | `HIGH`, `MEDIUM`, `LOW`                                                                                 |
| Status de ticket no seed | `OPEN`, `RESOLVED`, `APPROVED`                                                                          |
| Conversas                | Incluem `WITH_AGENT`, `WAITING_ANALYST`, `CLOSED` (cenários de fila / encerrado)                        |

Privacidade: listagem e leitura de tickets/conversas filtradas por dono no servidor. Cenários de isolamento (ex.: Carla não acessa recurso da Ana) cobertos em testes E2E/integração. Duplicidade e reopen usam regras de domínio (Jaccard / 7 dias); o seed fornece títulos e estados para exercitar o fluxo, não um “caso Jaccard” isolado no README.

Senha: auth demo aceita **qualquer** senha para e-mails existentes.

---

## Erros e indisponibilidade

| Cenário                              | Tratamento atual                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Ticket service “legado” instável     | `TicketServiceUnavailableError` via política intermitente (`failureRate`; **default 0** em runtime) |
| Gemini indisponível / erro de config | `AgentLlmUnavailableError` → HTTP **503** na rota de mensagens; mensagem com segredos redigidos     |
| Agent pausado / limite 30 msgs       | HTTP **409** (`AgentPausedError`, `MessageLimitExceededError`); UI desabilita composer              |
| Authz / não encontrado               | **403** / **404** tipados                                                                           |
| Confirm inválido / expirado          | Erros de domínio do ConfirmationGate (sem marcar mutação como feita)                                |
| Rate limit login/agent               | HTTP **429**                                                                                        |
| Falha ao enviar no chat              | Banner de erro no `/chat`; envio não é tratado como sucesso                                         |

A UI e as APIs usam códigos/erros tipados para **não** apresentar mutação concluída quando o gate ou o serviço falhou. Cobertura de todos os modos de falha de rede Prisma genérica na UI ainda é parcial (erros não mapeados podem subir como 500).

---

## Interface (Anexo C)

| Fluxo                  | Onde                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Login                  | `/login` — split desktop; formulário sem e-mail pré-preenchido                                          |
| Chat funcionário       | `/chat` — transcript, cards (draft / select / detalhe), quick replies, poll leve sob atendimento humano |
| Confirmação de chamado | `TicketDraftCard` + confirm/cancel                                                                      |
| Console analista       | `/analyst` — lista, chat, painel de chamados; Assumir / Devolver / Encerrar                             |
| Encerrado              | Indicação visual + composer desabilitado (`ConversationClosedNotice`)                                   |
| Perfil                 | `/profile` — dados do funcionário (leitura)                                                             |

Estados cobertos no código: loading de envio (“…”) no chat, erro de envio, transferência (agent parado), `CLOSED`, limite 30. Layouts distintos login / shell funcionário / console; responsividade no console e no login. **Não** há declaração de conformidade WCAG completa.

Protótipos: [`docs/prototype/`](docs/prototype/).

---

## Qualidade das decisões e testes

| Mecanismo                        | Papel                                                     |
| -------------------------------- | --------------------------------------------------------- |
| Domain unitário                  | Anexo A independente do LLM                               |
| ConfirmationGate                 | Sem confirm da UI, sem mutação                            |
| Authz servidor                   | Sem vazamento cross-user                                  |
| DecisionTrace                    | Persistido; chips de `actions` na UI                      |
| LLM                              | Sem mock em produção; sem fallback silencioso Gemini→mock |
| Rate limit + redação de segredos | Operação e segurança básicas                              |

### Camadas de teste

| Camada     | Comando                    | Escopo                                                               |
| ---------- | -------------------------- | -------------------------------------------------------------------- |
| Unitário   | `npm test`                 | Domain, gates, authz, componentes (Vitest/RTL); **sem** Gemini real  |
| Integração | `npm run test:integration` | Services + Prisma em Postgres `**nexo_e2e**` (I1–I5)                 |
| E2E        | `npm run test:e2e`         | Playwright (jornadas P0); sobe standalone após copiar `.next/static` |

E2E **não** usa Neon: `docker-compose.e2e.yml` (porta **5433**, db `nexo_e2e`) + guardrail em `scripts/assert-e2e-database.mjs`.

```bash
npm run db:e2e:up && npm run db:e2e:prepare
npm run test:integration
npm run test:e2e
```

CI (GitHub Actions): job `ci` (lint, typecheck, unit, prisma validate, build) + job `e2e` (Postgres efêmero). Sem secret Gemini/Neon no E2E.

Outros scripts: `lint`, `typecheck`, `build`, `storybook`, `db:seed`, `docker:up` / `docker:down` — ver `package.json`.

---

## Deploy (Vercel + Neon)

Deploy realizado na **Vercel**, com banco **Neon** (mesmo provedor documentado em [`docs/database.md`](docs/database.md)). O **link** da aplicação é enviado aos avaliadores fora deste README.

### Como foi feito

1. Repositório GitHub conectado a um projeto Vercel (branch `main`).
2. Schema e seed aplicados no Neon (`prisma migrate deploy` + `npm run db:seed`) antes do uso em produção.
3. Variáveis de ambiente no painel Vercel (**Production**), sem versionar segredos:

| Variável         | Função                                |
| ---------------- | ------------------------------------- |
| `NEXO_ENV`       | `production`                          |
| `AGENT_LLM`      | `gemini` (mock rejeitado em produção) |
| `GEMINI_API_KEY` | chave do provedor (só servidor)       |
| `GEMINI_MODEL`   | ex.: `gemini-flash-lite-latest`       |
| `AUTH_SECRET`    | assinatura do cookie de sessão        |
| `DATABASE_URL`   | Neon **pooled**                       |
| `DIRECT_URL`     | Neon **direct** (migrations / Prisma) |

4. **Build Command** na Vercel: `npx prisma generate && next build` (o client Prisma precisa ser gerado no build; não há `postinstall` no `package.json` para isso).
5. Deploy a partir do Git; redeploy após mudanças de env ou de código.

### Proteção de chaves e abuso (PRD)

- Segredos só em Environment Variables da Vercel — nunca no repositório.
- `GEMINI_API_KEY` sem prefixo `NEXT_PUBLIC_`.
- Rate limit de login e do agent (em memória) para reduzir abuso e custo.
- Cookie de sessão com flag `Secure` quando `NEXO_ENV=production`.
- Auth demo (qualquer senha) permanece para avaliação; o isolamento é por e-mail/dono no servidor.

Avaliadores locais continuam podendo usar **Docker** (`docs/docker.md`) sem conta Neon/Vercel.

---

## Trade-offs

1. Regras no domain vs só no LLM — mais código; decisões auditáveis.
2. Confirm na UI — um passo a mais; evita mutação “falada” pelo modelo.
3. Neon oficial + Compose demo/E2E — avaliadores e CI sem o Neon do autor.
4. Poll ~5s em vez de WebSocket — simples em serverless.
5. Rate limit em memória — ok single-instance; multi-instância pediria store compartilhado.
6. Jaccard 0.5 / TTL de confirmação — hipóteses calibráveis (`memory-bank/requirements-resolution.md`), não valores do PRD.
7. Chips de ação na UI vs painel completo de trace — entrega a transparência do protótipo; detalhe rico fica na persistência/API.

---

## O que faria com mais tempo

- Painel/accordion completo do `DecisionTrace` (intent, rationale, tools, assurance) e reidratação no histórico.
- Streaming SSE da resposta do agent.
- Observabilidade e teto de custo Gemini em produção.
- Rate limit distribuído; feriados no SLA; busca semântica para duplicidade.
- E8 (double-claim em dois browsers); polimento a11y fino vs protótipo.

---

## Documentação do projeto

| Doc                                    | Conteúdo                                               |
| -------------------------------------- | ------------------------------------------------------ |
| [`memory-bank/`](memory-bank/)         | Arquitetura, progresso, decisões vs PRD, testes, dados |
| [`docs/database.md`](docs/database.md) | Neon + Prisma                                          |
| [`docs/docker.md`](docs/docker.md)     | Compose demo                                           |
| [`docs/prototype/`](docs/prototype/)   | PNGs Anexo C                                           |
| [`AGENTS.md`](AGENTS.md)               | Contribuidores / agentes                               |
