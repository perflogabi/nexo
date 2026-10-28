# Project Brief — Nexo Assist

## Visão

Nexo Assist é um agente de atendimento de service desk de TI para ~2.000 funcionários da Nexo. O funcionário descreve o problema em linguagem natural; o agent consulta chamados, busca na central de ajuda, abre/atualiza chamados (com confirmação) e transfere para analista quando necessário.

## Fonte da verdade

- PRD: `Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf` (raiz do repositório)
- Protótipo visual: Anexo C / `docs/prototype/` — layout e estilo (liberdade nos detalhes)
- Regras de negócio: Anexo A (código + serviços; **não** só no prompt do LLM)
- Lacunas resolvidas: `memory-bank/requirements-resolution.md` (explícito vs interpretação vs técnica)

## Métricas de sucesso (PRD)

1. **Resolução sem fila** — dúvidas resolvidas no chat via central de ajuda
2. **Chamados bem abertos** — tipo, categoria, prioridade corretos; sem duplicidade
3. **Encaminhamento certo** — analista recebe contexto suficiente no momento certo
4. **Transparência** — visível o que o agent fez e por quê (critério mais importante)

## Escopo do protótipo

| # | Entrega | Obrigatório |
|---|---------|-------------|
| 1 | Login (funcionários de exemplo, qualquer senha) | Sim |
| 2 | Chat do funcionário (cards, rascunho, opções rápidas, limite 30 msgs) | Sim |
| 3 | Agent (Mastra preferido) + regras Anexo A | Sim |
| 4 | Serviço de chamados simulado (separado do agent) | Sim |
| 5 | Transferência para analista (agent pausado) | Sim |
| 6 | Console do analista (lista, assumir, devolver, encerrar, painel de chamados) | Sim |
| 7 | Visibilidade das decisões (ações + detalhe: entendimento, ação, confiança, motivo) | Sim (crítico) |
| — | Deploy (Vercel etc.) | Diferencial |
| — | Perfil do funcionário | No protótipo oficial; leitura + UI stub (não é SSO/reset real) |

## Fora de escopo (não inventar)

- Integração com ITSM real / ServiceNow / Jira
- App mobile nativo
- Multi-empresa / white-label
- Calendário de feriados no SLA (v1: seg–sex 08–18 SP, sem feriados)
- Autenticação SSO corporativa real (PRD aceita login simplificado)
- Alteração real de senha / e-mail recovery

## Stack alvo (priorizada)

- TypeScript `strict: true`
- Next.js App Router + Tailwind CSS (sem Bootstrap)
- Mastra + Google Gemini (`@google/genai`; mocks no CI)
- PostgreSQL no Neon + Prisma (`DATABASE_URL` pooled / `DIRECT_URL` migrations; ver `docs/database.md`)
- npm + `package-lock.json`
- Vitest + RTL + Playwright + Storybook
- ESLint, Prettier, Husky, lint-staged, GitHub Actions, Vercel
- Ver também `AGENTS.md`

## Critérios de avaliação (peso implícito)

1. Qualidade das decisões do agent (regras do service desk)
2. Condução da conversa (perguntar, confirmar, contexto)
3. Transparência das decisões
4. Interface fiel ao protótipo + loading/erro
5. Arquitetura e boas práticas
6. Clareza do README
7. Deploy (extra)
