# Resolução de dúvidas — Nexo Assist

Análise com o PRD v5 como fonte primária.  
**Não** tratar hipóteses como exigências do documento.

Legenda de classificação:

| Classe | Significado |
|--------|-------------|
| **Explícito** | Escrito no PRD |
| **Interpretação** | Lacuna; leitura necessária para implementar de forma coerente |
| **Técnica** | Decisão de engenharia proposta, testável |
| **Externo** | Exigiria esclarecimento da empresa se for indispensável |

---

## 2.1 Threshold de baixa confiança / transferência

### Evidência no PRD

- Anexo A: transferência quando *“o funcionário pede”*, *“em casos críticos”*, *“em chamados vencidos”* ou *“quando o agent não tem segurança sobre o que fazer”*; leva resumo; agent não responde com analista.
- Histórias do analista: ver conversas em que *“o agent não teve segurança para decidir”*.
- Visibilidade: detalhe com *“com que grau de segurança”* (formato livre).
- **Não há** valor numérico de confiança mínima.

### Não especificado

- Escala, limiar, fórmula ou fonte do “grau de segurança”.
- Se a autoavaliação do LLM basta.

### Decisão

| Aspecto | Conteúdo | Classe |
|---------|----------|--------|
| Motivos separados | `USER_REQUEST` · `CRITICAL` · `OVERDUE` · `LOW_CONFIDENCE` | Interpretação (tipos distintos a partir do Anexo A) |
| Crítico / vencido / pedido | Transferência por **regras determinísticas** no domain (pedido: após intent claro / quick reply) | Explícito + Interpretação |
| Representação da confiança | No `DecisionTrace` (alinhado a `data-model.md` / `architecture.md`): `modelConfidence: number \| null` (sinal interno/auxiliar do modelo, 0–1) e `presentedAssurance: UNKNOWN \| LOW \| MEDIUM \| HIGH` (grau de segurança na UI). Não é garantia de correção | Técnica (PRD pede “grau de segurança”, não o tipo) |
| Baixa confiança operacional | Transferir por **sinais determinísticos**, não por score do LLM sozinho: intent ambíguo após esclarecimento; tools conflitantes; falha repetida do ticket service; impossível classificar tipo/categoria/prioridade com dados dados; policy `requiresHuman` | Técnica |
| Score do LLM | Pode preencher `modelConfidence` no trace; **ignorado** como único critério de transferência. Se ausente/inválido → `modelConfidence = null` e avaliar só sinais determinísticos (`policyHits` / `presentedAssurance`) | Técnica |
| Limiar numérico opcional | `LOW_CONFIDENCE_SCORE_MAX = 0.4` **somente** como sinal auxiliar configurável em env, **nunca** sozinho. Documentar no README como hipótese, não requisito PRD | Técnica |

### Testes

- Unit: `shouldTransfer` para cada `reasonCode` isolado.
- Unit: score alto do “LLM” **não** bloqueia transferência por vencido/crítico.
- Unit: score baixo **sem** sinal determinístico **não** força transferência (evita falso positivo do modelo).
- Integração: após transferência, agent não responde; summary persistido.

### Pendência

Nenhuma bloqueante. Ajuste fino do auxiliar `0.4` pode ocorrer após demos — não é requisito da empresa.

---

## 2.2 Chamados duplicados / mesmo problema

### Evidência no PRD

- *“se já existe um chamado aberto sobre o mesmo problema, ele é atualizado, não duplicado.”*
- *“Chamados resolvidos há até 7 dias podem ser reabertos.”*
- Privacidade: só quem abriu.
- **Não especifica** campos, algoritmo nem limiar de similaridade.

### Decisão (v1 determinística)

| Regra | Conteúdo | Classe |
|-------|----------|--------|
| Escopo | Só chamados do **mesmo** `ownerEmployeeId` | Explícito (privacidade) + Técnica |
| Candidato a update | Status “aberto” (open / waiting_analyst / in_progress — não resolvido/fechado/approved) **e** mesma `category` **e** similaridade de título | Técnica |
| Título | Normalizar: minúsculas, sem acento, trim, remover pontuação; tokens com length > 2; **Jaccard ≥ 0.5** entre conjuntos de tokens | Técnica |
| Tipo INC/REQ | Exigir mesmo `type` quando ambos conhecidos; se draft ainda sem tipo, não descartar só por isso até classificação | Técnica |
| Reopen | Status resolvido/fechado com `resolvedAt` nos últimos **7 dias** (explícito), mesmos filtros de owner/category/título | Explícito + Técnica |
| Prioridade de escolha | Se vários: maior Jaccard; empate → mais recentemente atualizado | Técnica |
| Código vs agent | Domain `findDuplicateOrReopenCandidate` **decide**; agent só formula linguagem / pede confirmação de update|reopen|create | Técnica |
| Sem embeddings | Não na v1 | Técnica |

### Testes

- FP: mesmo owner+categoria, títulos distintos (“VPN 809” vs “Mouse quebrado”) → sem match.
- FN: títulos parafrásicos com overlap alto (“VPN não conecta erro 809” / “Erro 809 VPN notebook”) → match.
- Resolvido há 4 dias → reopen candidato; há 8 dias → não.
- Outro funcionário com título idêntico → nunca retorna (authz).

### Pendência

Limiar 0.5 é hipótese calibrável; não é valor do PRD.

---

## 2.3 Limite de 30 mensagens

### Evidência no PRD

- Chat: *“limite de 30 mensagens por sessão.”*
- Protótipo: copy *“N/30 mensagens nesta sessão.”*
- História: *“Voltar outro dia e continuar de onde parei.”*
- **Não define** o que é “sessão” nem quais `authorType` entram na conta.

### Lacuna explícita

O PRD **não** distingue funcionário / agent / analista / sistema na contagem.

### Decisão

| Aspecto | Conteúdo | Classe |
|---------|----------|--------|
| O que é “sessão” | A **Conversation** persistida (thread que o usuário retoma noutro dia). Não é “aba do browser” | Interpretação (coerente com história 6 + contador no chat) |
| O que conta | Mensagens persistidas com `authorType` ∈ {`employee`, `agent`} **visíveis** no transcript do funcionário | Interpretação |
| O que **não** conta | `system` (eventos internos), `analyst` (atendimento humano), payloads técnicos sem bolha | Interpretação |
| Quick replies | Contam como mensagem do **employee** ao enviar | Interpretação |
| Enforcement | Servidor: ler `messageCount`, incrementar na **mesma transação** que insere a mensagem (ex. `UPDATE … WHERE messageCount < 30`); UI só reflete | Técnica |
| Ao atingir 30 | Recusar novas msgs do employee; mensagem clara; composer disabled | Interpretação |

### Justificativa da contagem employee+agent

O PRD fala em “mensagens”, sem restringir ao funcionário. Incluir bolhas do agent alinha ao copy genérico do protótipo. Analista/sistema ficam de fora para não consumir cota durante/após transferência nem por eventos internos.

### Testes

- 29 → permite; 30ª employee+agent ok; tentativa 31 rejeitada.
- Concorrência: duas requests paralelas não ultrapassam 30 (teste de integração com transação).
- Mensagens analyst/system não incrementam o contador usado no limite.

### Pendência / externo

Se a empresa quiser contar **somente** mensagens do funcionário, basta mudar a regra — **não** está no PRD. Não bloqueia o MVP.

---

## 2.4 Criticidade (1 hora) e fora do expediente

### Evidência no PRD (Anexo A)

| Prioridade | Texto do prazo |
|------------|----------------|
| Crítica | **“1 hora”** (sem a palavra “úteis”) |
| Alta | “4 horas **úteis**” |
| Média | “3 dias **úteis**” |
| Baixa | “5 dias **úteis**” |

Também: prazo vale para primeira resposta e cada atualização; passado o prazo → vencido. Prioridade = impacto × urgência.

### Evidência Anexo B (artigo de exemplo da central de ajuda)

- *“Horário do service desk: de segunda a sexta, das 8h às 18h.”*
- *“Chamados críticos têm plantão 24 horas.”*

Isso é **dado de exemplo** da help center (Anexo B), não uma linha da tabela de prioridades — mas é a única pista do PRD sobre plantão e horário. Usar como apoio à interpretação da Crítica, documentando a fonte.

### Não especificado

- Definição formal de “hora útil” / “dia útil”.
- Fuso horário.
- Feriados.
- Se Crítica pausa à noite (a tabela **não** diz “úteis”; o artigo sugere plantão 24h).

### Decisão

| Aspecto | Conteúdo | Classe |
|---------|----------|--------|
| Crítica | **1 hora corrida** a partir de create/update relevante, **24/7** (alinhado a “1 hora” sem “úteis” + plantão 24h do artigo exemplo) | Interpretação |
| Alta / Média / Baixa | Contagem em **horário útil** configurável | Explícito (“úteis”) + Técnica (como calcular) |
| Calendário útil v1 | Seg–sex **08:00–18:00**, timezone **`America/Sao_Paulo`** | Técnica (espelha artigo Anexo B; fuso não está no PRD) |
| Feriados | **Não** inventar calendário; v1 sem feriados; calendário/feriados **configuráveis** depois | Técnica (PRD omite) |
| Vencido | `now > slaDeadlineAt` → elegível a transferência `OVERDUE` | Explícito + Técnica |

### Testes (sem inventar feriado)

- Crítica aberta 17:30 sexta → deadline 18:30 mesmo dia (corre).
- Alta aberta 17:00 sexta → soma 4h úteis → segunda de manhã (calcular explicitamente no teste).
- Média/Baixa atravessando fim de semana.
- “Antes de um feriado”: teste **com calendário injetável** marcando um dia como não útil — prova extensibilidade; **default v1 não marca feriados**.

### Pendência

Fuso e feriados não estão no PRD. Esclarecimento externo **só** se a empresa exigir calendário oficial Nexo — não indispensável ao desafio.

---

## 2.5 Provider de LLM

### Evidência no PRD

- Agent: *“Mastra (preferência) ou LangGraph.js”*
- Modelo: *“Qualquer provedor de LLM; explique a escolha no README”*
- Chaves fora do código; uso consciente do custo.

### Decisão

| Aspecto | Conteúdo | Classe |
|---------|----------|--------|
| Framework agent | **Mastra** | Explícito (preferência) |
| Provider MVP | **Google Gemini** via `@google/genai` (decisão de projeto aprovada; substitui a hipótese anterior OpenAI) | Técnica |
| Por quê | SDK TS oficial, custo/latência, Mastra tools; PRD aceita qualquer provider; mocks no CI/demo/E2E | Técnica |
| Alternativa | Troca via config sem acoplar domain ao SDK | Técnica |
| Segredos | `GEMINI_API_KEY` só em env — nunca no repo | Explícito (chaves fora do código) |
| Produção | `NEXO_ENV=production` + Gemini; **mock rejeitado**; sem fallback silencioso Gemini→mock | Técnica |
| Demo Docker | `NEXO_ENV=demo` + mock; chave só via `NEXO_DOCKER_GEMINI_API_KEY` (não interpolar `.env` do host) | Técnica |

Critérios: tools/structured output, streaming, custo, DX, rate limits — Gemini é escolha do projeto, **não** exigência do PRD. Justificativa no README.

### Pendência

Nenhuma bloqueante na integração agent. CI permanece sem chamada real. Streaming SSE e polimento de UI do DecisionTrace: backlog.

---

## 2.6 PostgreSQL, Neon e Vercel

### Evidência no PRD

- Persistência deve sobreviver a restart.
- Deploy é **diferencial**; *“qualquer plataforma (Vercel, Railway, Fly.io, Render ou outra)”*.
- **Não** impõe Postgres, Neon nem Vercel.

### Decisão

| Aspecto | Conteúdo | Classe |
|---------|----------|--------|
| Engine | PostgreSQL + Prisma | Técnica |
| Deploy app | Vercel (previsto; **ainda não publicado**) | Técnica |
| DB gerenciado | **Neon** oficial (migration + seed aplicados em ambiente de desenvolvimento do autor) | Técnica |
| Demo / E2E | Compose `nexo` (demo) e `nexo_e2e` (testes); guardrail impede Neon no E2E | Técnica |
| Cuidados | `DATABASE_URL` pooled + `DIRECT_URL` direct; migrate só com autorização; secrets só em env — `docs/database.md` | Técnica |

### Pendência

Smoke Neon↔Vercel sob carga real na fase de deploy. Documentar URL no README quando existir.

---

## 2.7 Dúvidas visuais

Fonte: PNGs em `docs/prototype/` + PRD (*“siga o layout e o estilo, com liberdade nos detalhes”*).

| Item | Obtivível do protótipo? | Decisão provisória | Classe |
|------|-------------------------|-------------------|--------|
| Família tipográfica | **Não** (raster; nomes ilegíveis) | Serif no login (headline/Entrar) + sans no restante; escolher pares open-source por comparação visual na Fase 5 e registrar nomes usados | Técnica |
| Hover / pressed | **Não** mostrados | Hover: primary ~8–12% mais escuro; pressed mais um passo — hipótese | Técnica |
| Larguras exatas | Só proporções (~1024×640) | Sidebar funcionário ~200–240px; rail ~56–64px; lista console ~28%; chat flex; painel chamados ~280–320px — afinar lado a lado | Técnica |
| Breakpoints mobile | **Não** (PNG) | Desktop-first; &lt;1024: mobile master-detail + sheet; tablet lista+chat + drawer; `lg+` 4 faixas intactas — ver `design-system.md` Tela 4 | Técnica |
| Tela 5 | PNG dedicada **ausente**; PRD descreve: analista assumiu, devolver ou encerrar | **Estado** do console (composer ativo; Assumir → Devolver/Encerrar) sobre a estrutura da tela 4 | Interpretação (texto PRD Anexo C) |
| SVG logo N | **Não** no repo | Priorizar asset oficial se surgir; senão SVG aproximado + nota de divergência | Técnica |
| Atalho ⌘J | Protótipo **exibe** o símbolo no botão Confirmar; **não** há especificação inequívoca de keybinding (SO, foco, preventDefault) | **Reproduzir o label visual** por fidelidade; **não implementar** handler de teclado no MVP | Técnica |

### Pendência / externo

Asset oficial do logo e arquivo Pencil editável acelerariam tipografia/medidas — úteis, **não** indispensáveis se as PNGs forem a referência visual do desafio.

---

## Consistência arquitetural (checagem)

As decisões acima permanecem compatíveis com:

- Next.js App Router + TS strict + Mastra + PG/Prisma  
- Domain separado do agent e do Ticket Service  
- Confirmação no servidor (UI); authz por funcionário  
- Pause do agent; persistência de histórico e `DecisionTrace`  
- Testes unit / integration (`nexo_e2e`) / E2E Playwright + CI  

Entregáveis PRD (README): como rodar · arquitetura · decisão do agent · qualidade · trade-offs · mais tempo · escolha do LLM · deploy (quando houver) — cobertos no `README.md` (2026-10-30).

**Não** se adiciona embedding store, calendário de feriados rígido, nem nova camada além do já planejado.
