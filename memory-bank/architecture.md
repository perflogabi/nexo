# Architecture — Nexo Assist

Documento de arquitetura alinhado a `data-model.md`, `requirements-resolution.md` e `testing-strategy.md`.  
**Não** inventar requisitos do PRD. Hipóteses permanecem hipóteses.  
**Não** aprovado automaticamente — revisão humana decide.

Legenda rápida: **E** explícito · **I** interpretação · **T** técnica · **H** hipótese

---

## Princípios

1. **Separação estrita**: UI ≠ Application Services ≠ Agent ≠ Domain ≠ Repositories ≠ Persistence
2. **Regras no código**: Anexo A em `domain/` testável; LLM interpreta/sugere; **policy decide**
3. **Confirmação obrigatória**: create / update / reopen de chamado só após confirmação válida (**E**)
4. **Autorização no servidor**: role (`EMPLOYEE` | `ANALYST`) e escopo; nunca confiar só no client
5. **Persistência durável**: PostgreSQL + Prisma — conversas, mensagens, chamados, estado (`Conversation.status`), `DecisionTrace`, `TicketEvent`
6. **Transparência**: cada resposta do agent persiste `DecisionTrace` (**E**)
7. **Sem abstrações gratuitas**: ports só onde há troca real (TicketService, LLM) ou teste

Fonte do modelo de dados: `data-model.md` (incluindo pause derivado, confirmação transacional, exclusões Restrict).

---

## Stack

| Item | Escolha | Natureza |
|------|---------|----------|
| UI | Next.js App Router + **Tailwind CSS** (sem Bootstrap) | Decisão de projeto |
| Linguagem | TypeScript `strict: true` | Requisito PRD |
| Agent | Mastra | Preferência PRD |
| LLM | **Google Gemini** (`@google/genai` na integração); mocks no CI | Decisão de projeto (PRD: qualquer provider) |
| DB | PostgreSQL no **Neon** + Prisma 6 (`DATABASE_URL` pooled + `DIRECT_URL` migrations) | Decisão de projeto; ver `docs/database.md` |
| Pacotes | npm + `package-lock.json` | Decisão de projeto |
| Testes | Vitest, RTL, Playwright + Storybook | Decisão de projeto |
| CI | GitHub Actions | Decisão de projeto |
| Deploy | Vercel + Neon (pooling em produção ainda a validar com credenciais reais) | Diferencial PRD |

---

## Diagrama lógico

```
┌─────────────────────────────────────────────────────────────┐
│  Interface — Next.js App Router (`src/app`)                 │
│  /login · /chat · /profile · /analyst                       │
└───────────────┬─────────────────────────────┬───────────────┘
                │ Server Actions / Route Handlers (authz)
┌───────────────▼──────────────┐  ┌───────────▼───────────────┐
│  Application Services        │  │  Analyst Console Service  │
│  auth · conversations · …    │  │  claim atômico / fila      │
└───────────────┬──────────────┘  └───────────┬───────────────┘
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│  Agent Orchestrator (Mastra) + Tools                        │
│  Domain/Policy; NÃO muta Ticket sem ConfirmationGate        │
│  NÃO responde se isAgentPaused(Conversation.status)         │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼──────────────┐  ┌───────────▼───────────────┐
│  Domain / PolicyEngine       │  │  Help Center Service      │
│  SLA, duplicidade, transfer  │  │                            │
└──────────────────────────────┘  └───────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  Ticket Service → Repositories → Prisma → PostgreSQL        │
└─────────────────────────────────────────────────────────────┘
```

---

## Camadas e responsabilidades

Caminhos sob `src/` (exceto `prisma/` e `tests/` na raiz).

| Camada | Local | Pode | Não pode |
|--------|-------|------|----------|
| **Interface** | `src/app/`, `src/components/` | UI, streaming, confirmações | Regras Anexo A; LLM no client |
| **Application services** | `src/services/*` | Casos de uso, authz, orquestração, transações | Prompts; SQL espalhado |
| **Agent + tools** | `src/agent/` | Intent, tools tipadas, emitir trace | Mutar Ticket sem gate; responder se pausado |
| **Domain** | `src/domain/` | Prioridade, SLA, duplicidade, escopo, transfer | Prisma, React, LLM |
| **Repositories** | `src/repositories/` ou colocalizado | Queries tipadas | Policy de negócio |
| **Persistence** | `prisma/` | Schema, migrations | Lógica de prioridade |

Repositories: módulos leves Prisma — **não** um framework ORM paralelo.

---

## Estado da conversa e pausa do agente

Alinhado a `data-model.md` §2 — **não** há campo persistido `agentPaused`.

| Conceito | Representação |
|----------|----------------|
| Handoff | `Conversation.status`: `WITH_AGENT` \| `WAITING_ANALYST` \| `WITH_ANALYST` \| `CLOSED` |
| Agent pausado? | **Derivado**: `isAgentPaused(status) ⇔ status ∈ {WAITING_ANALYST, WITH_ANALYST}` (**T**) |
| Ticket | `Ticket.status` é eixo **independente** (Anexo B) |

### Transferência e ciclo do analista

Motivos (`transferReasonCode`, **I**): `USER_REQUEST` · `CRITICAL` · `OVERDUE` · `LOW_CONFIDENCE`.

| Transição | Regra |
|-----------|--------|
| `WITH_AGENT` → `WAITING_ANALYST` | Transferir; `transferSummary` (**E**); `assignedAnalystId = null` |
| `WAITING_ANALYST` → `WITH_ANALYST` | **Assumir atômico** (`UPDATE … WHERE status = WAITING_ANALYST AND assignedAnalystId IS NULL`) — impede double-claim (**T**) |
| `WITH_ANALYST` → `WITH_AGENT` | Devolver; limpar assignee |
| `*` → `CLOSED` | Encerrar (conforme matriz em `data-model.md`) |
| `WITH_AGENT` → `WITH_ANALYST` direto | **Inválido** |
| `CLOSED` → qualquer | **Inválido** (nova `Conversation`) |

Enquanto `isAgentPaused`: agent **não** responde (**E**).  
Detalhe da matriz válida/inválida: `data-model.md` §2.2.

### Confiança (`LOW_CONFIDENCE`)

- Sinais **determinísticos** de policy — score do LLM **não** é critério único (`requirements-resolution.md` §2.1).
- Trace: `modelConfidence?` (interno) + `presentedAssurance` (UI) + `policyHits` — ver `data-model.md` §3.4.

---

## Confirmação de mutações (ConfirmationGate)

Create / update / reopen **exigem** confirmação do funcionário (**E**).

Fluxo (serviço, **mesma transação** — `data-model.md` §3.8):

1. Consumir `PendingConfirmation.token` com `UPDATE … WHERE consumedAt IS NULL AND expiresAt > now() AND employeeId = session` (`RETURNING`).
2. Revalidar authz: dono da conversa; se UPDATE/REOPEN, `ticket.ownerEmployeeId = session` e operação elegível.
3. Executar mutação no Ticket Service + `TicketEvent`.
4. Commit — falha em qualquer passo ⇒ rollback (sem mutação órfã nem double-apply).

Token: único, expirável (TTL **H**), one-shot, anti-concorrência pelo `UPDATE` condicional.

Tools: `prepareTicketDraft` (staging, tool LLM) → UI Confirmar → `POST .../confirm` → `confirmTicketMutation(token, expectedConversationId)` no serviço. Confirm **não** é tool do LLM.

---

## Autorização

| Ator | Escopo |
|------|--------|
| EMPLOYEE | Próprias conversas; tickets com `ownerEmployeeId = self` (**E**). `affectedEmployeeId` é dado do chamado, **não** substitui o owner na authz. |
| ANALYST | Fila `WAITING_ANALYST`; atendimento se `assignedAnalystId = self`; tickets **somente** do `employeeId` da conversa em contexto (**I**) |
| Server | Middleware + checks em handlers/services — role e escopo em **consultas e mutações** |

Privacidade: chamado de um funcionário nunca exposto a outro (**E**).

---

## Limite de mensagens

- PRD: “30 mensagens por sessão” (**E** texto).
- **I:** sessão = `Conversation`; contam `EMPLOYEE` + `AGENT`; **não** contam `ANALYST` / `SYSTEM`.
- Servidor: verificar limite **antes** de invocar o agent; rejeitar com erro de domínio (ex. `MessageLimitExceededError`).
- Incremento na mesma transação que insere a mensagem elegível (`messageCount < 30`) — seguro sob concorrência (**T**).
- UI espelha contador; composer disabled no limite.

---

## SLA

Detalhe: `requirements-resolution.md` §2.4 e `data-model.md` §6.

| Prioridade | Prazo |
|------------|--------|
| Crítica | 1 **hora corrida**, 24/7 (**I**) |
| Alta / Média / Baixa | Úteis seg–sex **08:00–18:00** `America/Sao_Paulo` (**T**; fuso não está no PRD) |
| Feriados | Não no PRD → v1 sem; calendário **injetável** (**T**) |

**Recálculo de `slaDeadlineAt` (**T** / **I** do “cada atualização”):**  
Sim em CREATE, REOPEN, complemento confirmado, mudança de prioridade.  
**Não** em mudança **somente** de status operacional (ex. `OPEN` → `IN_PROGRESS`) — decisão técnica, **não** requisito explícito do PRD. Documentar no README.

Vencido: `now > slaDeadlineAt` → elegível a `OVERDUE` (**E**+**T**).

---

## Duplicidade e reabertura

- Domain determinístico: mesmo `ownerEmployeeId` + `category` + status elegível + Jaccard de título ≥ **0.5** (**H** calibrável) — `requirements-resolution.md` §2.2.
- Aberto → update; `RESOLVED`/`CLOSED` com `resolvedAt` ≤ 7 dias → reopen (**E**).
- Ao reabrir: `resolvedAt = null` (`data-model.md` §5).
- Agent **não** decide sozinho; confirmação antes de mutar.
- Sem embeddings na v1.
- Reopen a partir de `APPROVED`: default **não** (**H** em `data-model.md`).

---

## Persistência e auditoria

Compatível com `data-model.md`:

- `Conversation`, `Message`, `DecisionTrace` (1:1 com msg AGENT)
- `Ticket`, `TicketEvent` (auditoria mínima; sem dump PII)
- `PendingConfirmation`, `HelpArticle`, `Employee`
- Soft-end: `CLOSED` / status terminal — sem hard-delete em cascata de chamados/eventos (**T**)
- Relação names Prisma para múltiplas FKs em `Employee`

---

## Agent — fluxo de decisão

```
mensagem do funcionário
  → authz: employeeId dono da Conversation
  → se isAgentPaused(status): rejeitar reply do agent (erro/domínio ou system msg)
  → se messageCount >= 30: MessageLimitExceededError; NÃO chamar LLM
  → persistir msg employee (+ count) conforme política de tx
  → Mastra + tools (read / staging draft)
  → PolicyEngine (escopo, duplicidade, prioridade, transfer)
  → se transfer: status WAITING_ANALYST + summary; agent para
  → mutação ticket: só via ConfirmationGate (outra request)
  → persistir msg agent + DecisionTrace (+ count)
  → stream texto/ações ao client
```

### Tools (propostas)

| Tool | Efeito | Confirmação |
|------|--------|-------------|
| `searchHelpCenter` | read | Não |
| `listMyTickets` / `getTicket` | read scoped (`ownerEmployeeId`) | Não |
| `classifyPriority` | domain | Não |
| `findDuplicateOrReopenCandidate` | domain + read | Não |
| `prepareTicketDraft` | staging PendingConfirmation | Não |
| `confirmTicketMutation` (API/UI only) | write na mesma tx do consume | **Sim** (token + conversationId da URL) |
| `requestAnalystTransfer` | status + summary | Pedido pode usar quick reply na UI |
| `redirectOutOfScope` | reply | Não |

---

## Interface ↔ backend e streaming

- `POST /api/chat` — streaming (SSE / UI Message Stream) **após** authz, check de pause e limite.
- Confirmações / quick replies: payloads estruturados (podem ser routes/actions aparte do stream de texto).
- Estado da conversa: **servidor** é fonte da verdade.
- Console analista: mutations só com `role === ANALYST` + regras de claim.

### Limites do streaming (**T** — honestidade)

- Streaming LLM é I/O **externo**; **não** há garantia de transação ACID envolvendo o provider Gemini.
- Persistência de mensagens/trace e contadores ocorre em transações de **banco** delimitadas pelo serviço.
- Falha a meio do stream: tratar com erro tipado na UI; evitar double-count (incrementar count só após persistência bem-sucedida da mensagem que conta — detalhe de implementação na fase do agent).
- Indisponibilidade do Ticket Service: erro tipado + retry/UX; não confundir com falha de stream.

---

## Ticket Service simulado

- `src/services/tickets` isolado do agent
- Interface TS; impl Prisma + falha intermitente configurável (PRD: legado instável)
- Agent não importa Prisma para mutações de chamado

---

## LLM

- Mastra + **Gemini** (`@google/genai`); domain desacoplado do SDK
- `GEMINI_API_KEY` só em env; CI/testes com mocks — sem chamada real obrigatória
- Justificar no README

---

## Transparência (`DecisionTrace`)

Alinhado a `data-model.md` (não usar um único campo `confidence` genérico):

```ts
{
  messageId: string
  understoodIntent: string
  actions: { code: string; label: string }[]
  rationale: string
  policyHits: string[]
  toolCalls: { name: string; ok: boolean; summary: string }[]
  modelConfidence: number | null       // interno / auxiliar
  presentedAssurance: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH'  // UI
}
```

UI: chips do protótipo + painel/accordion de detalhe (**E**).

---

## Estrutura de pastas proposta

Padronização: código da app em **`src/`**; rotas em **`src/app/`** (não misturar com `app/` na raiz).

```
src/
  app/                    # App Router
  components/
  domain/
  agent/
  services/
    auth/
    conversations/
    tickets/
    help-center/
    analyst/
  repositories/           # opcional colocalizar
  lib/                    # prisma client, env, errors, streaming helpers
prisma/
tests/
  unit/
  integration/
  e2e/
```

---

## Trade-offs

| Decisão | Escolha | Alternativa | Por quê |
|---------|---------|-------------|---------|
| Framework | Next.js App Router | SPA + API | Um repo, Vercel, SSR |
| Estilo | Tailwind | Bootstrap / CSS-in-JS livre | Decisão de projeto; protótipo |
| Agent | Mastra | LangGraph.js | Preferência PRD |
| LLM | Gemini | Outro provider | Decisão de projeto; PRD permite qualquer |
| DB | PG + Prisma | SQLite | Persistência + Neon |
| Lockfile | npm | pnpm/yarn | Decisão de projeto |
| Pause do agent | Derivado de `status` | Campo `agentPaused` | Evita inconsistência (`data-model.md`) |
| Tickets | Módulo interno | Microserviço | Separado do agent com menos ops |
| Streaming | SSE | WebSocket | Adequado à Vercel; sem tx com LLM |
| Feriados SLA | Ignorar v1 | Calendário nacional | PRD omite |
| Duplicidade | Determinística + apoio LLM | Só LLM | Testabilidade; Jaccard **H** |

---

## Testes e deploy (resumo)

Ver `testing-strategy.md`:

- Unit: domain (SLA, duplicidade, transfer reasons, ConfirmationGate, limite, authz) **sem** Gemini real
- Integration: TicketService, transições de conversa, claim atômico, limite concorrente, agent mockado
- E2E: jornadas PRD; `E2E=1` scripted
- Pause do agent: testes assertam `Conversation.status` / `isAgentPaused(status)` — ver `testing-strategy.md` (já alinhado)

CI: GitHub Actions; secrets Gemini não necessários para testes com mock. Deploy Vercel/Neon sujeito a validação.

---

## Pendências (não bloqueiam a leitura; bloqueiam “aprovado” se o time exigir fechamento)

| Item | Onde | Classe |
|------|------|--------|
| TTL do `PendingConfirmation` | `data-model.md` | H |
| Jaccard 0.5 | `requirements-resolution.md` | H |
| Reopen de `APPROVED` | `data-model.md` | H |
| Limpar `transferSummary` ao devolver | `data-model.md` | H |
| Validação Neon pooling sob carga serverless real | docs/database.md | Config preparada (`url`+`directUrl`); smoke com projeto Neon pendente |

---

## Status deste documento

Arquivo **revisado para coerência** com o modelo de dados e as resoluções.  
**Não considerado aprovado** até autorização humana explícita.  
Próxima etapa (bootstrap / Prisma) **somente** após essa autorização.
