# Testing Strategy — Nexo Assist

Alinhada a `architecture.md`, `data-model.md` e `requirements-resolution.md`.  
**Não** tratar hipóteses (**H**) como requisitos definitivos do PRD.  
**Não** há campo persistido `agentPaused`: o agent está pausado quando `Conversation.status ∈ {WAITING_ANALYST, WITH_ANALYST}` (`isAgentPaused(status)`).

Legenda: **E** explícito · **I** interpretação · **T** técnica · **H** hipótese

---

## Pirâmide

```
        E2E (Playwright)     ← poucos, jornadas críticas do PRD
     Component (RTL/Story)   ← UI estados e fidelidade ao protótipo
   Integration (Vitest)      ← services + Prisma + agent mockado
 Unit (Vitest)               ← domain / gates / authz (sem Gemini real)
```

Contrato de scripts (quando existirem no `package.json`): `npm test`, `npm run test:e2e`, `npm run storybook`.  
CI: sem chamada real à API Gemini — mocks / injeção.

---

## 1. Unitário (prioridade máxima)

Cobrir **sem** chamada real a Gemini:

### 1.1 Domínio — SLA, calendário, prioridade

| Módulo | Casos | Classe |
|--------|-------|--------|
| `computeSlaDeadline` | Crítica = +1h **corrida** 24/7 (ex. sexta 17:30 → 18:30) | I |
| `computeSlaDeadline` | Alta/média/baixa em úteis seg–sex 08–18 `America/Sao_Paulo` | T |
| `businessHours` / avanço útil | Travessia de fim de semana; alta aberta sexta tarde → segunda | T |
| `isOverdue` | `now > slaDeadlineAt` | E |
| Recálculo SLA | CREATE / REOPEN / complemento / mudança de prioridade **recalculam**; mudança **só** de status operacional **não** | T (não E) |
| Calendário injetável | Marcar um dia “não útil” no teste prova extensão; **default v1 sem feriados** | T |

### 1.2 Duplicidade e reabertura

| Módulo | Casos | Classe |
|--------|-------|--------|
| `findDuplicate` | Mesmo owner + category + status elegível + Jaccard ≥ **0.5** (**H**) | T+H |
| `findDuplicate` | FP: títulos distintos; FN: paráfrases com overlap alto | H calibrável |
| `findDuplicate` | Outro `ownerEmployeeId` → nunca retorna | E |
| `canReopen` | `resolvedAt` há 4 dias → elegível; há 8 dias → não | E |
| `canReopen` | Após reopen: `resolvedAt = null` | T |
| `canReopen` | A partir de `APPROVED`: default **não** elegível (**H** — não tratar como requisito) | H |

### 1.3 Transferência e pause derivado

| Módulo | Casos |
|--------|-------|
| `isAgentPaused` | `true` só para `WAITING_ANALYST` e `WITH_ANALYST`; `false` para `WITH_AGENT` e `CLOSED` |
| `shouldTransfer` | `USER_REQUEST` / `CRITICAL` / `OVERDUE` / `LOW_CONFIDENCE` isolados |
| `shouldTransfer` | Score LLM alto **não** bloqueia CRITICAL/OVERDUE |
| `shouldTransfer` | Score LLM baixo **sem** sinal determinístico **não** força transferência |
| Transições (puro) | Matriz válida/inválida de `data-model.md` §2.2 (ex. `WITH_AGENT`↛`WITH_ANALYST`; `CLOSED`↛qualquer) |

### 1.4 ConfirmationGate / PendingConfirmation

| Caso | Esperado |
|------|----------|
| Token válido + employee correto | Consome e permite mutação (na integração: mesma tx) |
| Token inexistente / de outro employee | `ConfirmationInvalidError`; **sem** mutação |
| Token expirado (`expiresAt` no passado) | Rejeitado; sem mutação |
| Token já consumido (`consumedAt` setado) | Rejeitado; sem mutação |
| Reutilização do mesmo token | Segunda tentativa falha |
| UPDATE/REOPEN com ticket de outro owner | Authz negada mesmo com token “válido” de forma fraudulenta |
| TTL concreto (ex. 30 min) | Valor é **H** — testes usam clock injetável; não fixar como requisito PRD |

### 1.5 Limite de mensagens

| Caso | Esperado |
|------|----------|
| Contam | `EMPLOYEE` + `AGENT` |
| Não contam | `ANALYST` + `SYSTEM` (não incrementam `messageCount`) |
| 29 → 30 | Permite até 30 elegíveis |
| Tentativa além de 30 | `MessageLimitExceededError` (ou equivalente de domínio) |
| Limite já atingido | **Não** inicia execução do agent / LLM |

### 1.6 Autorização

| Caso | Esperado |
|------|----------|
| Employee A lê/altera ticket de B | Negado (`ownerEmployeeId`) |
| `affectedEmployeeId` = A, `ownerEmployeeId` = B | A **não** ganha acesso de owner; authz usa **owner** |
| Analyst lista tickets sem conversa em contexto | Negado / não lista empresa inteira |
| Analyst com conversa do employee E | Pode ver tickets de E **no contexto**; não os de F |
| EMPLOYEE acessa mutações de analista | Negado |
| ANALYST responde em conversa `WITH_ANALYST` de outro assignee | Negado (**T**) |

### 1.7 Escopo

| `isInScope` | TI ok; RH / financeiro / facilities → fora (redirecionar) |

---

## 2. Integração (Vitest + DB de teste)

Agent / Gemini **mockados** ou injetados. Sem secret Gemini obrigatório.

### 2.1 Ticket Service

- CRUD simulado + falha intermitente → erro tipado
- Create/update/reopen **somente** via fluxo de confirmação
- `TicketEvent` gerado nas mutações relevantes
- Authz `ownerEmployeeId` em list/get/update

### 2.2 Confirmação na mesma transação

| Cenário | Esperado |
|---------|----------|
| Happy path | `UPDATE` condicional do token + create/update/reopen + event no **mesmo** commit |
| Token inválido | Rollback / sem ticket mutado |
| Duas requests paralelas com o mesmo token | Exatamente **uma** mutação; a outra falha (sem duplicate ticket/update) |
| Falha na mutação após consume na mesma tx | Rollback restaura token consumível **ou** estado consistente sem ticket parcial (preferir tudo-ou-nada na tx) |

### 2.3 Conversation — estados e claim atômico

| Cenário | Esperado |
|---------|----------|
| `WITH_AGENT` → `WAITING_ANALYST` | `transferSummary` (+ reason); `assignedAnalystId` null; agent não responde depois |
| Assumir atômico | Dois analysts em paralelo: **um** obtém `WITH_ANALYST` + assignee; o outro `ConversationClaimConflictError` |
| `WITH_ANALYST` → `WITH_AGENT` | Devolver; assignee null; agent volta a poder responder |
| `WITH_ANALYST` / `CLOSED` | Encerrar conforme matriz |
| Transições inválidas | Rejeitadas (ex. `WITH_AGENT`→`WITH_ANALYST`; `CLOSED`→`WITH_AGENT`; reassignment entre analysts) |
| Agent com status pausado | Nenhuma reply do agent; LLM mock **não** chamado |

> **Não** assertar coluna/campo `agentPaused`. Assertar `status` e comportamento `isAgentPaused(status)`.

### 2.4 Limite 30 sob concorrência

- Duas requests paralelas perto do teto: `messageCount` final ≤ 30
- Mensagens ANALYST/SYSTEM não alteram o contador
- Com `messageCount >= 30`, handler de chat **não** invoca o orchestrator/LLM mock

### 2.5 Persistência e DecisionTrace

| Cenário | Esperado |
|---------|----------|
| Resposta agent concluída | Message AGENT + `DecisionTrace` (intent, actions, rationale, policyHits, `modelConfidence?`, `presentedAssurance`) |
| Falha Ticket Service | Erro tipado; UI/serviço tratável; sem mutação silenciosa |
| Reinício / reload | Conversas, mensagens, tickets, status e traces sobrevivem (requisito PRD de persistência) |

### 2.6 Streaming vs transação de banco (**T** — honestidade)

| Garantível em teste de integração/DB | **Não** garantir / não assumir |
|--------------------------------------|--------------------------------|
| Persistência atômica de Message elegível + `messageCount` | Reverter tokens/bytes já enviados no stream HTTP ao client |
| Consume token + mutação Ticket na mesma tx | Transação ACID envolvendo a API Gemini |
| Após falha de stream: ausência de double-count se count só sobe pós-persist | “Resposta parcial no fio” desfeita automaticamente |

Cenários sugeridos:

1. LLM mock emite chunks; ao final persiste Message + Trace; count incrementa **uma** vez.  
2. LLM mock falha no meio: serviço retorna erro tipado; assertir que não há Message AGENT parcial inconsistente **ou** que política documentada de partial-save foi seguida (escolher uma na implementação e testar).  
3. Ticket Service down durante confirm: confirmação falha sem ticket fantasma.

---

## 3. Componentes (RTL + Storybook)

- `TicketDraftCard`: Confirmar / Editar / Cancelar; Confirmar dispara consumo de token (callback)
- `AgentActionChips` + `DecisionTracePanel` (`presentedAssurance`, actions)
- `QuickReplyBar`, `ConversationQueue`, filtros
- Estados: loading; erro ticket service; conversa em `WAITING_ANALYST`/`WITH_ANALYST` (composer/agent silenciado); limite 30
- Fidelidade: stories vs `docs/prototype/`

Não mockar “campo agentPaused” na UI — usar status da conversa.

---

## 4. E2E (Playwright)

1. Login EMPLOYEE → chat  
2. Dúvida VPN → artigo (sem criar chamado)  
3. Abertura: draft → confirma → ticket criado  
4. Consulta vencido → transferência → status `WAITING_ANALYST`; agent **não** responde a nova msg  
5. Login ANALYST → claim atômico → `WITH_ANALYST` → devolver / encerrar  
6. Privacidade: A não vê ticket de B (`ownerEmployeeId`)  
7. Role: EMPLOYEE ↛ `/analyst`; ANALYST sem chat como dono indevido  
8. (Opcional) Duas sessões analyst tentam assumir a mesma conversa → só uma vence  

Modo `E2E=1` com agent scripted (estabilidade; documentar trade-off no README). Sem Gemini real obrigatório no CI.

---

## 5. O que não testar em excesso

- Snapshot massivo de CSS  
- Texto bruto de prompts  
- Prisma client em si  
- Garantias falsas de rollback de streaming externo  

---

## 6. Comandos alvo (npm)

```bash
npm test
npm run test:watch
npm run test:e2e
npm run storybook
```

(Scripts ainda a criar no bootstrap — não inventar execução aqui.)

---

## 7. Pendências e divergências documentais

| Item | Notas |
|------|--------|
| Jaccard **0.5** | **H** — testar com esse limiar; calibrável |
| TTL PendingConfirmation | **H** — clock fake nos testes |
| Reopen de `APPROVED` | **H** default não; se mudar, atualizar testes |
| Política de partial Message após falha de stream | Detalhe de implementação a fixar na fase do agent |
| Limpar `transferSummary` ao devolver | **H** — opcional; ver `data-model.md` |
| Neon pooling sob carga serverless real | Config Prisma preparada; smoke com credenciais reais pendente — `docs/database.md` |

> As seis hipóteses/pendências acima permanecem abertas; **não** são requisitos explícitos do PRD. Referências obsoletas a desalinhamento de `agentPaused` entre docs foram removidas (arch/data/testing já coerentes).

---

## 8. Qualidade das decisões do agent

README: checklist manual + traces persistidos. Avaliadores usam a UI de transparência.  
Testes automatizados cobrem **policy determinística** e gates; não a “correção semântica” do LLM ao vivo.
