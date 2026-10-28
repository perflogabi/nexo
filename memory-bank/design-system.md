# Design System — Nexo Assist

## Fonte da verdade visual

Protótipo oficial (Anexo C). **Não** usar layouts genéricos da internet.

| Tela | Arquivo de referência |
|------|------------------------|
| 1. Login | `docs/prototype/Identifica__o__desktop_-58d2e59b-682e-4cf4-ad51-be2944ccab94.png` (atual) · legado `…cfd7dac0…` |
| 2. Chat — novo chamado | `docs/prototype/Chat___Novo_chamado__desktop_-d1cc5381-7062-45a9-b07a-d5fc239a0e9d.png` |
| 3. Chat — consulta / transferência | `docs/prototype/Chat___Consulta_e_transfer_ncia__desktop_-003fd2e6-e3b2-4504-8e99-ed0df522713b.png` |
| 4. Console atendente | `docs/prototype/Atendente___Conversas__desktop_-2653730b-93d0-4f88-95e3-5c51053585ff.png` |
| Perfil (complementar) | `docs/prototype/Cliente___Meu_perfil__desktop_-e467a044-84a1-47a2-8eee-0ac430261ddc.png` |

Artefatos analisados em ~1024×640 (desktop). Cores abaixo foram **amostradas** das PNGs; valores com `~` são aproximações — ajustar fino na implementação lado a lado com a imagem.

---

## Princípios de fidelidade

1. Reproduzir estrutura, navegação, proporções, espaçamentos, cores, tipografia, bordas e hierarquia do protótipo.
2. **Não uniformizar** telas com estruturas diferentes (login ≠ shell funcionário ≠ console 3 painéis).
3. Cards só onde o protótipo mostra (draft, chamado, lista de seleção, perfil, itens da fila).
4. Não inventar dashboards, menus extras ou cores “AI purple”.
5. Estados loading / erro / vazio / interação: manter a mesma identidade (mesmos tokens, tipografia e densidade).
6. Acessibilidade e responsividade **sem** redesenhar o layout de referência no desktop.
7. Detalhe inseguro → registrar em **Dúvidas**, não inventar.

---

## Tokens (amostrados)

### Cores

```css
:root {
  /* Brand / ação */
  --color-brand-blue: #007AF8;      /* logo “N” nas shells claras */
  --color-primary: #0062C5;         /* botões Entrar / Confirmar / Assumir / Enviar (amostra protótipo) */
  --color-primary-hover: #0056AD;

  /* Superfícies */
  --color-navy: #1B2430;            /* painel esquerdo login (spec); bolha usuário */
  --color-bg: #FFFFFF;
  --color-bg-subtle: #F6F7F9;       /* rail / áreas secundárias console */
  --color-bg-chat-console: #EEF2F5; /* fundo da coluna central do atendente */
  --color-bg-ia-bubble: #E6EEF9;    /* bolha IA no console do atendente */
  --color-bg-nav-active: #E9EAEF;   /* item de menu ativo (amostra fraca — validar) */
  --color-bg-avatar: #E8F1FB;       /* hipótese: avatar AS azul-claro — validar */

  /* Texto */
  --color-text: #1B2531;
  --color-text-muted: #6B7280;      /* hipótese por contraste visual — hex exato não isolado */
  --color-text-on-navy: #FFFFFF;
  --color-text-on-navy-muted: #9AA3AD;

  /* Bordas */
  --color-border: #D8D9DD;
  --color-border-strong: #C5C7CC;   /* hipótese */

  /* Status */
  --color-success: #16A34A;         /* hipótese; pill online amostra ~#8BCBB1 (fundo) */
  --color-success-soft: #E8F7F0;    /* hipótese fundo “Assistente online” */
  --color-warning: #DBB03D;         /* “Aguardando analista” / prazo */
  --color-warning-text: #B45309;    /* hipótese texto âmbar */
  --color-danger: #BD4A54;          /* “Transferida” na fila */
  --color-priority-high: #C97820;   /* hipótese laranja “Alta” / “Aguardando confirmação” */

  /* Links */
  --color-link: var(--color-primary);
}
```

### Tipografia

| Uso | Família | Tamanho | Onde |
|-----|---------|---------|------|
| Headline login (painel esquerdo) | **Newsreader** | 46px (54px xl+) | Login esquerda |
| Descrição login esquerda | **Schibsted Grotesk** | 16px | Login esquerda |
| Métricas (números) footer login | **Newsreader** | 22px | Login esquerda |
| Texto sob métricas | **Schibsted Grotesk** | 12px | Login esquerda |
| Título “Entrar” | **Newsreader** | 40px | Login form |
| Descrição do form | **Schibsted Grotesk** | 15.5px | Login form |
| Labels / inputs / checkbox / erros | **Schibsted Grotesk** | 15.5px | Login form |
| Botão “Entrar” | **Schibsted Grotesk** | 15.5px | Login form |
| UI / corpo (shells) | **Schibsted Grotesk** | — | Chat, console, perfil |

**Decisão aprovada (assets oficiais):** **Newsreader** (display) + **Schibsted Grotesk** (UI). Classes: `.font-display` / `.font-ui` (também `--font-sans` / `--font-serif` no Tailwind).

### Logos oficiais

| Variante | Arquivo | Uso |
|----------|---------|-----|
| Brand (branco) | `public/brand/nexo-brand.png` | Painel navy do login |
| Logo (app) | `public/brand/nexo-logo.png` | Sidebar funcionário, rail analista |

### Raios e bordas

| Elemento | Observação |
|----------|------------|
| Inputs / botões secundários / cards | ~8px, borda 1px `--color-border` |
| Bolhas de chat | ~12–16px |
| Pills (quick reply, status, filtros) | ~999px ou ~20px (bastante arredondado) |
| Avatar | círculo |
| Focus input (login senha) | borda azul primary |

### Espaçamento (qualitativo)

- Login: form com whitespace generoso, coluna direita ~44% da largura (split ~0.56 esquerda).
- Chat: gap confortável entre bolhas; composer com padding inferior + contador de sessão.
- Console: painéis separados por divisores verticais 1px; densidade maior que o chat do funcionário.
- Perfil: conteúdo centralizado com largura máxima moderada; cards empilhados com gap claro.

---

## Layouts por tela (não misturar)

### Tela 1 — Login (`/login`)

**Estrutura:** split-screen (≈56% navy | ≈44% branco).

**Esquerda (navy `#1B2430`) — em código (`LoginShowcase`), não imagem:**
- 3 slots: logo · story+chat (centro) · métricas — largura `LOGIN_LEFT_BLOCK` (520 → 640 em 2xl)
- Tokens/copy em `login-layout.ts`; quebras tipográficas via `BrokenLines` (`whitespace-nowrap` + `<br />`)
- PNGs showcase/stats só como **referência visual** (não renderizados)
- Breakpoint: compacto &lt; 2xl (~15″); 2xl+ (~27″) com tipografia/offset maiores

**Direita (branco — referência `nexo-login-signin.png`):**
- Fundo **sempre branco** (`#FFFFFF`)
- Help no topo; form centrado H+V; footer no rodapé
- Largura do form: `270px` → `320px` (xl) → `380px` (2xl)
- Título Newsreader 40 “Entrar” + descrição Schibsted 15.5
- `Input` / `Checkbox` / `Button` (CTA “Entrar →”) + divisor abaixo do botão
- Footer: © 2026 · Privacidade

**Não fazer:** login centralizado único painel; cards de features extras.

### Shell do funcionário (`/chat`, `/profile`)

**Estrutura:** sidebar estreita + conteúdo principal (2 colunas). **Não** é o console de 3 painéis.

**Sidebar:**
- Logo azul “N” + “Nexo Assist”
- Nav: **Atendimento** | **Meu perfil** (ícones outline; ativo = fundo suave + texto/ícone azul)
- Rodapé: avatar iniciais, nome, e-mail, **Sair**

**Header do conteúdo:**
- Breadcrumb `Service desk de TI > …`
- Pill “Assistente online” (dot verde) no chat — **ausente** no perfil

### Tela 2–3 — Chat (`/chat`)

Mesma shell; conteúdo = thread.

| Elemento | Padrão |
|----------|--------|
| Bolha usuário | Direita, fundo navy, texto branco |
| Bloco agent | Esquerda: label “Nexo Assist” + chips `✓ ação` em muted; bolha branca com borda |
| Quick replies | Pills brancas borda cinza, em linha |
| Lista seleção de chamados | Card com radio rows (número · título · status · data) |
| Card chamado | Header id+status; título; descrição; grid meta 4 cols; CTAs pill |
| Card rascunho | Header “Novo chamado • Rascunho …”; status “Aguardando confirmação” (âmbar); grid 3 cols; **Confirmar** (primary; label ⌘J no protótipo) · **Editar** · **Cancelar** |
| Composer | Input “Escreva para o Nexo…” + botão azul “Enviar” (ícone seta); abaixo `N/30 mensagens nesta sessão` (limite = **por conversa** no servidor) |

Transparência mínima do protótipo = chips `✓ …` acima/ao lado do nome. Detalhe expandido de decisão (PRD) deve **estender** esse padrão (accordion/painel), sem inventar um dashboard.

### Tela 4 — Console do atendente (`/analyst`)

**Estrutura obrigatória de quatro faixas:**

1. **Rail de ícones** (~56–64px): logo N, ícone conversas com badge numérico, avatar analista (dot online) embaixo  
2. **Lista Conversas**: título + “Disponível”; busca; filtros pill (`Todas` / `Para você` / `Com o agent` / `Minhas`); itens com avatar, snippet, hora, status (ex. “Transferida” em vermelho); selecionado = barra azul lateral. Scroll: classe `.nexo-scroll-thin` (5px, sem setas nativas; thumb discreto) — evita barra grossa em desktops menores; largura da coluna `300 → 320(xl) → 340(2xl)`  
3. **Chat central**: header (avatar, nome, meta online·área·INC, badge “Aguardando atendente”); transcript (bolhas funcionário brancas à esquerda; bolhas IA azul-claras à direita com badge **IA**; label “Nexo Assist” + badge **IA** acima da bolha; hora + ✓✓ dentro); evento de sistema com divisor; barra “espera atendente” + **Devolver ao agent** + **Assumir atendimento**; composer desabilitado até assumir. **Overflow:** scrollbar nativa oculta; botão circular ↓ (“Ver mensagens mais abaixo”) quando há conteúdo abaixo da viewport (útil em desktops menores) — clique rola suavemente até o fim.  
4. **Painel Chamados**: “Chamados da {Nome}”; contagem abertos/encerrados; card “Desta conversa”; lista “Outros chamados”; CTA “Ver todos os chamados…”

**Não colapsar** os três painéis de conteúdo em um único chat no desktop (`lg+`, ≥1024px). Em viewport estreita (decisão UX):

| Viewport | Layout |
|----------|--------|
| **&lt; md** (&lt;768) | Master-detail: lista **ou** chat; rail **inferior**; chamados = **bottom sheet** (ícone ticket no header) |
| **md – lg** (768–1023) | Lista + chat lado a lado; rail **inferior**; chamados = **drawer** direito |
| **lg+** | 4 faixas do protótipo (rail lateral + lista + chat + chamados inline) |

Mesmos componentes (`AnalystRail`, `ConversationList`, `AnalystChatPane`, `AnalystTicketsPanel`); só muda composição/chrome.

### Perfil (`/profile`)

Mesma sidebar do funcionário; **Meu perfil** ativo.

- Breadcrumb `… > Meu perfil`
- Título + subtítulo
- Card dados: linhas Nome / E-mail (e-mail com “Gerenciado pela TI” + lock) — **somente leitura**
- Card senha: ícone chave, “Alterada há X dias”, botão “Redefinir senha”, faixa info de e-mail — **stub visual** (sem alteração real de senha; sem requisito PRD)

Sem gráficos, sem lista de chamados nesta tela.

---

## Componentes reutilizáveis (Storybook)

Agrupar por domínio; **não** forçar o mesmo shell em todas as histórias.

| Domínio | Componentes (implementados) |
|---------|------------------------------|
| ui | `Typography`, `Button` (`icon` esquerdo · `iconEnd` seta), `Input` (label/ícones/ação), `Checkbox` |
| brand | `NexoLogo` (`brand` \| `app`) |
| auth | `LoginSplitLayout`, `LoginForm`, `LoginShowcase` (asset Showcase oficial) |

| Domínio | Componentes (próximas telas — layout já especificado acima) |
|---------|---------------------------------------------------------------|
| chrome | `EmployeeSidebar` (expandido/encolhido), `EmployeeShell` |
| chat | `EmployeeChatThread`, bolhas, `TicketSelectList`, `TicketDetailCard`, `ChatQuickReplies`, `ChatComposer` (consulta/transferência — estático) |
| analyst | `AnalystRail`, `ConversationList`, `AnalystChatPane`, `AnalystTicketsPanel`, `AnalystShell` |
| tickets / profile | stubs / em construção |
| feedback | `LoadingSkeleton` / `InlineError` / `EmptyState` — **no estilo** dos cards/bordas existentes |

Cada story: default + loading + erro + vazio + disabled (quando couber), lado a lado com a PNG de referência.

---

## Estados (identidade preservada)

| Estado | Direção visual |
|--------|----------------|
| Loading | Skeleton com raios/bordas dos cards/bolhas; sem spinners genéricos coloridos fora da marca |
| Erro | Texto/danger `#BD4A54` ou banner discreto alinhado à coluna; botão secondary “Tentar de novo” |
| Vazio | Lista/painel com mensagem muted + hierarquia tipográfica existente |
| Disabled | Composer cinza (como “Assuma o atendimento…”); botões primary com opacidade reduzida |
| Selecionado | Radio azul; item de fila com barra primary; nav com fundo suave |
| Pausado / transferido | Badge âmbar + copy de agent pausado (console) |

---

## Acessibilidade e responsividade

- Contraste: texto muted sobre branco e texto branco sobre navy — validar AA nos badges âmbar/vermelho.
- Focus visível = borda primary (como no campo senha).
- Quick replies, radios e Confirmar/Cancelar como controles focáveis reais (não só `div`).
- `aria-expanded` no detalhe de decisão; labels nos ícones do rail.
- **Desktop-first** conforme PNGs. Breakpoints mobile **não** aparecem no protótipo → ver dúvidas.

---

## Mapeamento protótipo → rotas

| Protótipo | Rota |
|-----------|------|
| Identificação | `/login` |
| Chat novo chamado / consulta | `/chat` (estados) |
| Meu perfil | `/profile` |
| Atendente conversas | `/analyst` (+ detalhe por seleção; assumir = estado da mesma surface) |

---

## Decisões de UI alinhadas à revisão

| Tema | Decisão |
|------|---------|
| Perfil / senha | Reproduzir elementos do protótipo; **não** implementar reset/alteração real |
| Limite 30 | Copy do protótipo (“nesta sessão”); regra de produto = **por conversa** no servidor |
| Console | Manter **três painéis de conteúdo** + rail de ícones; não colapsar no desktop |
| Atalho ⌘J | Protótipo **exibe** o símbolo no Confirmar; PRD não especifica keybinding. **MVP: label visual apenas; sem handler de teclado** (`requirements-resolution.md` §2.7) |
| Logo | Priorizar asset oficial; se ausente, SVG aproximado + divergência registrada |
| Tela 5 | Sem PNG dedicada; PRD Anexo C descreve o estado — composer ativo + Devolver/Encerrar na mesma estrutura do console |

## Hipóteses visuais ainda abertas (não são requisitos PRD)

1. **Famílias tipográficas** — nomes ilegíveis nas PNGs; escolher por comparação na Fase 5.
2. **Hover/pressed** — não mostrados; escurecer primary ~8–12% (hipótese).
3. **Hex muted / pills** — amostras fracas; afinar lado a lado.
4. **Larguras px** — usar proporções (~sidebar 220px, rail 60px) e afinar.
5. **Breakpoints** — desktop-first; &lt;1024 stack/drawer — **resolvido** (tabela Tela 4 acima).
6. **Nav active `#E9EAEF`** — amostra fraca.
7. **SVG oficial do logo** — pendente no repo.

---

## Checklist antes de implementar cada tela

- [ ] PNG de referência aberta lado a lado
- [ ] Estrutura de painéis correta (split / sidebar+main / rail+3 colunas)
- [ ] Tokens deste doc; sem paleta inventada
- [ ] Componentes no Storybook com estados
- [ ] Divergência inevitável anotada em `progress.md`
