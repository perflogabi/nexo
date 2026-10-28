# Data Model — Nexo Assist

Proposta pré-Prisma. Alinhada ao PRD v5 e a `requirements-resolution.md`.  
**Não** tratar hipóteses como exigências do PRD.  
**Não** declarado aprovado para implementação — aprovação é revisão humana.

Legenda: **E** = explícito no PRD · **I** = interpretação documentada · **T** = decisão técnica proposta · **H** = hipótese calibrável

---

## 1. Diagrama de relações (cardinalidades)

```
Employee 1 ─── * Conversation.employeeId          (funcionário / dono da conversa)
Employee 1 ─── * Conversation.assignedAnalystId   (analista atribuído; role=ANALYST)
Conversation 1 ─── * Message
Message 1 ─── 0..1 DecisionTrace                  (somente Message.authorType=AGENT)
Conversation 1 ─── * PendingConfirmation
Employee 1 ─── * PendingConfirmation.employeeId   (quem pode confirmar)
Employee 1 ─── * Ticket.ownerEmployeeId           (proprietário / quem abriu)
Employee 1 ─── * Ticket.affectedEmployeeId        (pessoa afetada)
Ticket 1 ─── * TicketEvent
HelpArticle (independente)
```

Não há entidade `Session` separada: “sessão” do PRD = `Conversation` (**I**, `requirements-resolution.md` §2.3).

### 1.1 Papéis das relações com `Employee`

| FK | Papel | Validação de serviço (**T**) |
|----|-------|------------------------------|
| `Conversation.employeeId` | Funcionário dono da conversa | `Employee.role = EMPLOYEE` (seed demo; não atribuir ANALYST como dono de chat de funcionário) |
| `Conversation.assignedAnalystId` | Analista que assumiu | `Employee.role = ANALYST`; só quando `status = WITH_ANALYST` |
| `Ticket.ownerEmployeeId` | Quem abriu o chamado (privacidade **E**) | Sempre o escopo de authz do funcionário |
| `Ticket.affectedEmployeeId` | “De quem é afetado” (**E**) | Deve existir; tipicamente EMPLOYEE; pode coincidir com o owner |
| `PendingConfirmation.employeeId` | Quem confirma o draft | Deve ser igual a `Conversation.employeeId` da conversa do token |
| `Message.authorId` | Autor humano quando aplicável | Ver §3.3 — **sem** FK polimórfica obrigatória |

### 1.2 Nomes explícitos no Prisma (**T**)

Como `Employee` participa de várias FKs, o schema deverá usar **relation names** distintos, por exemplo:

- `ConversationEmployee` / `AssignedConversations`
- `OwnedTickets` / `AffectedTickets`
- `PendingConfirmations`

Evita ambiguidade do Prisma quando há duas FKs para o mesmo model.

### 1.3 Exclusões (`onDelete`) — comportamento esperado (**T**)

O PRD exige persistência e auditoria/transparência; **não** define cascata. Política proposta:

| Relação | onDelete sugerido | Motivo |
|---------|-------------------|--------|
| `Ticket` → `Employee` (owner / affected) | `Restrict` | Não apagar funcionário com chamados; preservar histórico |
| `TicketEvent` → `Ticket` | `Restrict` (ou proibir delete de Ticket no MVP) | Auditoria do chamado |
| `DecisionTrace` → `Message` | `Cascade` ok **ou** Restrict | Trace vive com a mensagem do agent; se Message for imutável no MVP, preferir não deletar Messages |
| `Message` → `Conversation` | `Restrict` no MVP | Transcript é evidência; preferir `CLOSED` a apagar |
| `Conversation` → `Employee` | `Restrict` | |
| `PendingConfirmation` → Conversation/Employee | `Cascade` aceitável | Staging efêmero |
| `HelpArticle` | N/A | |

**Regra geral MVP:** não implementar hard-delete de `Ticket`, `TicketEvent`, `Conversation` ou `Message` em fluxos de produto. Encerrar = `Conversation.status = CLOSED` / status de ticket terminal. Cascata inadvertida que apague chamados ou eventos de auditoria é **proibida**.

---

## 2. Conversation.status (fonte única de handoff)

### 2.1 Representação

| Conceito | Representação |
|----------|----------------|
| Estado da conversa / handoff | **Somente** `Conversation.status` |
| Agent pausado? | **Derivado**: `isAgentPaused(status) ⇔ status ∈ {WAITING_ANALYST, WITH_ANALYST}` — **não** persistir `agentPaused` (**T**) |
| Estado do chamado | `Ticket.status` (eixo independente; Anexo B) |

### 2.2 Transições válidas e inválidas (**T**, alinhado ao PRD de transferir / assumir / devolver / encerrar)

| De → Para | Válida? | Ação / condição |
|-----------|---------|-----------------|
| `WITH_AGENT` → `WAITING_ANALYST` | Sim | Transferência; preencher `transferSummary` (+ `transferReasonCode`); `assignedAnalystId = null` |
| `WITH_AGENT` → `CLOSED` | Sim | Encerrar sem fila (ex. fim de atendimento agent) |
| `WITH_AGENT` → `WITH_ANALYST` | **Não** | Deve passar pela fila (`WAITING_ANALYST`) |
| `WAITING_ANALYST` → `WITH_ANALYST` | Sim | **Assumir** (atômico — §2.3); setar `assignedAnalystId` |
| `WAITING_ANALYST` → `WITH_AGENT` | Sim | Devolver ao agent (ou cancelar fila); limpar summary opcional (**H**); `assignedAnalystId = null` |
| `WAITING_ANALYST` → `CLOSED` | Sim | Encerrar na fila |
| `WAITING_ANALYST` → `WAITING_ANALYST` | Não-op | |
| `WITH_ANALYST` → `WITH_AGENT` | Sim | Devolver ao agent; `assignedAnalystId = null` |
| `WITH_ANALYST` → `CLOSED` | Sim | Encerrar atendimento humano |
| `WITH_ANALYST` → `WAITING_ANALYST` | **Não** no MVP (**T**) | Evita “re-enfileirar” sem regra PRD; preferir devolver ao agent |
| `WITH_ANALYST` → `WITH_ANALYST` (outro analista) | **Não** | Troca de assignee proibida; ver §2.3 |
| `CLOSED` → qualquer | **Não** | Terminal; nova demanda = nova `Conversation` (**T**) |
| `CLOSED` → `WITH_AGENT` | **Não** | |

Diagrama:

```
WITH_AGENT ──transfer──► WAITING_ANALYST ──assume──► WITH_ANALYST
    │                         │                         │
    │                         ├──devolver──► WITH_AGENT ◄─┤ devolver
    │                         └──encerrar───────────────┤
    └──────────────────────────encerrar─────────────────┴──► CLOSED
```

Invariantes:

1. `WAITING_ANALYST` \| `WITH_ANALYST` ⇒ agent **não** responde (**E**).  
2. `WITH_ANALYST` ⇒ `assignedAnalystId` NOT NULL e role ANALYST.  
3. `WAITING_ANALYST` ⇒ `assignedAnalystId` IS NULL.  
4. `WITH_AGENT` \| `CLOSED` ⇒ `assignedAnalystId` IS NULL.  
5. Transferência preenche `transferSummary` (**E**).

`Ticket.status = WAITING_ANALYST` **não** implica conversa transferida.

### 2.3 Atribuição atômica do analista (impedir double-claim) (**T**)

Dois analistas não podem assumir a mesma conversa. Consumir a fila com update condicional:

```sql
UPDATE "Conversation"
SET status = 'WITH_ANALYST',
    "assignedAnalystId" = $analystId,
    "updatedAt" = now()
WHERE id = $conversationId
  AND status = 'WAITING_ANALYST'
  AND "assignedAnalystId" IS NULL
RETURNING *;
```

- 1 row → sucesso.  
- 0 rows → já assumida, estado mudou, ou inválida → erro de domínio `ConversationClaimConflictError` (nome ilustrativo).  
- Responder/devolver/encerrar em `WITH_ANALYST` exige `assignedAnalystId = self` (salvo política futura autorizada).

---

## 3. Entidades

### 3.1 Employee

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| email | string unique | login | E |
| name | string | | T |
| department | string? | meta console | T |
| role | `EMPLOYEE` \| `ANALYST` | seed distinto; validar no servidor | T |
| createdAt | datetime | | T |

**Auth demo (**E**+**T**):** qualquer senha nos exemplos → **sem** `passwordHash`. Sessão: `employeeId` + `role` após e-mail seed válido.

### 3.2 Conversation

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| employeeId | fk | dono (relação nomeada — §1.2) | E/I |
| status | enum | §2 | E/I |
| messageCount | int default 0 | só employee+agent; teto 30 | E/I |
| transferSummary | text? | | E |
| transferReasonCode | enum? | | I |
| assignedAnalystId | fk? | analista; relação nomeada | I |
| createdAt / updatedAt | datetime | | T |

### 3.3 Message e validação de `authorId` (**T**)

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| conversationId | fk | Restrict — §1.3 | T |
| authorType | enum | | I |
| authorId | string? | **sem** FK polimórfica obrigatória | T |
| content | text | | T |
| structuredPayload | json? | | T |
| createdAt | datetime | | T |

`authorId` não é FK Prisma polimórfica. O **serviço** valida:

| authorType | authorId | Regras |
|------------|----------|--------|
| `EMPLOYEE` | obrigatório | `authorId = Conversation.employeeId` da conversa; role EMPLOYEE |
| `ANALYST` | obrigatório | `authorId = Conversation.assignedAnalystId` e status `WITH_ANALYST`; role ANALYST |
| `AGENT` | **null** | Não usar id de Employee |
| `SYSTEM` | **null** | Eventos curtos (transferida, encerrada, limite) |

Inserções que violem a tabela → erro de domínio; não confiar no client.

### 3.4 DecisionTrace

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| messageId | fk unique | Message AGENT | T |
| understoodIntent | string | | E |
| actions | json | chips | E |
| rationale | text | | E |
| policyHits | json string[] | | T |
| toolCalls | json | sem PII completo | T |
| modelConfidence | float? | interno/auxiliar; não decide sozinho | T |
| presentedAssurance | enum | grau na UI | I/T |
| createdAt | datetime | | T |

### 3.5 Ticket

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| number | string unique | INC-/REQ- | E (ex.) |
| type / title / description / category / priority | … | Anexo A | E |
| status | TicketStatus | | I |
| ownerEmployeeId | fk | Restrict | E |
| affectedEmployeeId | fk | Restrict | E |
| slaDeadlineAt | datetime | ver §6 | E/I/T |
| resolvedAt | datetime? | ver §5 | E |
| createdAt / updatedAt | datetime | | T |

**TicketStatus:** `OPEN` \| `WAITING_ANALYST` \| `IN_PROGRESS` \| `RESOLVED` \| `CLOSED` \| `APPROVED`.

Elegíveis a duplicidade “aberto” (**T**): `OPEN`, `WAITING_ANALYST`, `IN_PROGRESS`.

### 3.6 TicketEvent

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | | T |
| ticketId | fk | Restrict — preservar auditoria | T |
| kind | enum | CREATED, UPDATED, REOPENED, STATUS_CHANGED, PRIORITY_CHANGED | T |
| summary | string | curto; sem dump sensível | T |
| actorType / actorId | … | | T |
| createdAt | datetime | | T |

### 3.7 HelpArticle

slug unique, title, body, tags[], createdAt, updatedAt.

### 3.8 PendingConfirmation — confirmação + mutação na **mesma transação** (**T**)

| Campo | Tipo | Notas | Classe |
|-------|------|-------|--------|
| id | cuid | PK | T |
| token | string unique | opaco | T |
| conversationId | fk | | T |
| employeeId | fk | confirmante | E/T |
| operation | `CREATE` \| `UPDATE` \| `REOPEN` | | T |
| payload | json | draft; `ticketId` se UPDATE/REOPEN | T |
| expiresAt | datetime | TTL **H** (ex. 30 min) | T |
| consumedAt | datetime? | | T |
| createdAt | datetime | | T |

#### Fluxo atômico de confirmação (obrigatório no serviço)

Dentro de **uma** transação de banco:

1. **Consumir token** (condicional):

```sql
UPDATE "PendingConfirmation"
SET "consumedAt" = now()
WHERE token = $1
  AND "employeeId" = $sessionEmployeeId
  AND "consumedAt" IS NULL
  AND "expiresAt" > now()
RETURNING *;
```

0 rows → abortar (`ConfirmationInvalidError` / expirado / já usado / alheio). **Não** mutar ticket.

2. **Revalidar autorização e propriedade:**
   - `pending.employeeId = session.employeeId`
   - `pending.conversationId` pertence a esse employee
   - Conversação **não** com agent pausado de forma que impeça o fluxo (tipicamente `WITH_AGENT` para confirmar draft do chat — **T**)
   - Se `UPDATE` / `REOPEN`: carregar ticket por `payload.ticketId`; exigir `ticket.ownerEmployeeId = session.employeeId`; status compatível com a operação; reopen ainda dentro de 7 dias se REOPEN

3. **Executar** create / update / reopen do Ticket (+ `TicketEvent`) na **mesma** transação.

4. Commit. Se qualquer passo falhar → rollback (token permanece consumível só se o UPDATE do token também reverter — por isso tudo junto).

**Concorrência:** duas confirmações com o mesmo token → apenas uma obtém a row do passo 1; a outra falha sem segundo create/update.  
**Não** consumir o token numa transação e mutar o ticket noutra (janela de inconsistência).

---

## 4. Limite de 30 mensagens (**E** + **I** + **T**)

| Aspecto | Regra |
|---------|--------|
| O que conta | `authorType ∈ {EMPLOYEE, AGENT}` |
| O que **não** conta | `ANALYST`, `SYSTEM` — não incrementam `messageCount` |
| Teto | `messageCount < 30` para aceitar nova msg que conta |
| Antes do agent | Servidor verifica limite **antes** de invocar Mastra/Gemini; se já `messageCount >= 30`, **não** chama o LLM |
| Rejeição | Erro de domínio identificável, ex. `MessageLimitExceededError` (código estável para UI/API); não 500 genérico |
| UI | Composer desabilitado + copy clara (**I**) |
| Concorrência | Inserir Message elegível e incrementar contador na **mesma** transação: `UPDATE Conversation SET messageCount = messageCount + 1 WHERE id = $id AND messageCount < 30`; 0 rows → limite; não ultrapassar 30 sob race |
| Msg analyst/system | Persistir sem tocar em `messageCount` |

Ordem sugerida no handler de chat do funcionário: authz → status (agent não pausado) → **check limite** → (opcional) persistir employee msg + count → agent → persistir agent msg + count + trace.

---

## 5. Reabertura e `resolvedAt` (**E** + **T**)

PRD: chamados resolvidos há até **7 dias** podem ser reabertos.

| Evento | `resolvedAt` | `status` |
|--------|--------------|----------|
| Ticket criado | `null` | tipicamente `OPEN` |
| Marcado resolvido / fechado com efeito de resolução | `now()` | `RESOLVED` ou `CLOSED` |
| `APPROVED` (REQ) | **H**: tratar como terminal sem reopen automático; ou setar `resolvedAt` se quiser janela — **default MVP: sem reopen a partir de APPROVED** salvo decisão futura |
| Reopen confirmado | **`resolvedAt = null`** | status elegível aberto (`OPEN` ou `IN_PROGRESS` — **T**) + `TicketEvent.REOPENED` |
| Update sem resolver | inalterado | |

Elegibilidade reopen (**E**+**T**):  
`status ∈ {RESOLVED, CLOSED}` **e** `resolvedAt IS NOT NULL` **e** `now - resolvedAt ≤ 7 dias` **e** owner correto **e** demais filtros de duplicidade/título.

**Testes:** resolvido há 4 dias → elegível; há 8 dias → não; após reopen `resolvedAt` null e não conta como “resolvido recente” até nova resolução; cross-owner negado.

---

## 6. SLA e recálculo de `slaDeadlineAt`

### Evidência PRD (**E**)

- Prioridade define prazo (crítica 1h; alta 4h úteis; média 3 dias úteis; baixa 5 dias úteis).  
- *“O prazo vale para a primeira resposta e para cada atualização; passado o prazo, o chamado está vencido.”*

O PRD **não** lista quais campos/edições contam como “atualização” que reinicia o prazo.

### Política técnica proposta (**T** / **I**)

| Operação | Recalcula `slaDeadlineAt`? |
|----------|----------------------------|
| `CREATE` (após confirmação) | **Sim** — primeira resposta / abertura |
| `REOPEN` (após confirmação) | **Sim** — novo ciclo de atendimento |
| `UPDATE` confirmado que altera descrição/complemento substantivo do chamado (fluxo “complementar informações”) | **Sim** — alinhado a “cada atualização” (**I** do texto PRD) |
| Mudança de **prioridade** (reclassificação confirmada) | **Sim** — novo prazo da prioridade vigente (**T**) |
| Mudança **somente** de status operacional sem nova “atualização” de conteúdo (ex. `OPEN` → `IN_PROGRESS` / `WAITING_ANALYST` sem complemento) | **Não** (**T**) — evita reinício acidental só por mover fila |
| Correção cosmética interna / seed / job de leitura | **Não** |
| TicketEvent isolado | N/A (evento segue a operação que já decidiu) |

Cálculo do valor (inalterado em espírito — `requirements-resolution.md` §2.4):

- Crítica: +1h **corrida** 24/7 (**I**).  
- Demais: horário útil seg–sex 08–18 `America/Sao_Paulo`; sem feriados default (**T**).  
- Vencido: `now > slaDeadlineAt` (**E**).

**Não** apresentar a tabela de exclusões de status-only como requisito PRD — é decisão técnica para não reiniciar SLA em edições que não deveriam afetá-lo.

---

## 7. Enums (TypeScript / Prisma)

```ts
type Role = 'EMPLOYEE' | 'ANALYST'
type ConversationStatus = 'WITH_AGENT' | 'WAITING_ANALYST' | 'WITH_ANALYST' | 'CLOSED'
type TransferReasonCode = 'USER_REQUEST' | 'CRITICAL' | 'OVERDUE' | 'LOW_CONFIDENCE'
type AuthorType = 'EMPLOYEE' | 'AGENT' | 'ANALYST' | 'SYSTEM'
type TicketType = 'INC' | 'REQ'
type Category = 'ACESSO' | 'REDE_VPN' | 'HARDWARE' | 'SOFTWARE' | 'EMAIL' | 'OUTROS'
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type TicketStatus = 'OPEN' | 'WAITING_ANALYST' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'APPROVED'
type PendingOperation = 'CREATE' | 'UPDATE' | 'REOPEN'
type PresentedAssurance = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH'
type TicketEventKind = 'CREATED' | 'UPDATED' | 'REOPENED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED'
```

---

## 8. Autorização (persistência)

| Ator | Recurso | Regra |
|------|---------|--------|
| EMPLOYEE | Ticket | `ownerEmployeeId = self` (**E**) |
| EMPLOYEE | Conversation / Message | `employeeId = self` |
| EMPLOYEE | PendingConfirmation | próprio employee + token; mutação na mesma tx (§3.8) |
| ANALYST | Fila | `WAITING_ANALYST` |
| ANALYST | Atendimento | `WITH_ANALYST` e `assignedAnalystId = self` (**T**) |
| ANALYST | Tickets | só do `employeeId` da conversa em contexto (**I**) |
| Qualquer | Ticket alheio | Negar |

---

## 9. Índices sugeridos

| Índice | Uso |
|--------|-----|
| `Employee.email` UNIQUE | Login |
| `Conversation(status, updatedAt DESC)` | Fila |
| `Conversation(assignedAnalystId, status)` | Minhas |
| `Conversation(employeeId, updatedAt DESC)` | Retomar |
| `Message(conversationId, createdAt)` | Transcript |
| `DecisionTrace.messageId` UNIQUE | 1:1 |
| `Ticket(ownerEmployeeId, status)` | Lista / painel |
| `Ticket(ownerEmployeeId, category, status)` | Duplicidade |
| `Ticket(ownerEmployeeId, resolvedAt)` | Reopen |
| `Ticket.number` UNIQUE | Lookup |
| `PendingConfirmation.token` UNIQUE | Confirm |
| `HelpArticle.slug` UNIQUE | Seed |

---

## 10. Seed mínimo

≥2 EMPLOYEE, ≥1 ANALYST; 5–10 artigos (VPN 809, horário); tickets: aberto/vencido, resolvido ≤7d, REQ aprovada, ticket de outro employee; ≥1 Conversation `WAITING_ANALYST`. Sem password hash.

---

## 11. Hipóteses / decisões ainda abertas

| Item | Classe | Notas |
|------|--------|-------|
| TTL PendingConfirmation | H | Ex. 30 min — não no PRD |
| Jaccard ≥ 0.5 | H | Calibrável |
| `WAITING_ANALYST` → `WITH_ANALYST` re-fila | T | Proibido no MVP |
| Reopen a partir de `APPROVED` | H | Default: não |
| Várias Conversation abertas por employee | T | Permitido |
| Limpar `transferSummary` ao devolver | H | Opcional |

---

## 12. Conflitos com o PRD?

| Tema | Avaliação |
|------|-----------|
| Agent pausado sem campo persistido | Compatível — comportamento derivado do estado exigido pelo PRD |
| Auth sem senha real | Compatível com “qualquer senha” |
| Recálculo SLA seletivo | PRD fala em “cada atualização” sem definir escopo; exclusão status-only é **T**, não **E** — risco residual de interpretação |
| Limite 30 employee+agent | PRD não detalha contagem; **I** documentada |
| Analista ver tickets do funcionário da conversa | Tensão com “só quem abriu”; **I** necessária ao console (Anexo C) |

Nenhum conflito **direto** que torne o modelo inviável; o ponto de SLA exige disciplina na implementação e documentação no README.

---

## 13. Parecer de prontidão (Prisma)

O documento está **tecnicamente coerente** para embasar um `schema.prisma` futuro: relações nomeadas, estados, exclusões, confirmação transacional, limite, reopen e SLA estão especificados com classificação E/I/T/H.

**Não está aprovado para implementação.** A aprovação final é da revisão humana.  
Não criar schema, migrations nem bootstrap até autorização explícita.
