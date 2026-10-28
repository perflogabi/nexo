# AGENTS.md — Nexo Assist

Instruções permanentes para agentes e contribuidores humanos.

## Antes de qualquer tarefa

1. Ler o PRD `Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`.
2. Consultar o Memory Bank em `memory-bank/` (em especial `progress.md`, `architecture.md`, `implementation-plan.md`, `requirements-resolution.md`).
3. Respeitar as regras em `.cursor/rules/` e a fidelidade visual em `docs/prototype/`.
4. Distinguir: **requisito explícito do PRD** · **decisão aprovada** · **hipótese**.

## Como trabalhar

- Etapas pequenas, escopo claro, validação ao final.
- Tarefas com várias alterações: apresentar **plano curto** e listar arquivos afetados antes de editar em massa.
- Não implementar fora do escopo pedido.
- Não alterar decisões arquiteturais **em silêncio** — propor, registrar em `progress.md` / `architecture.md`, só então aplicar.
- Não declarar conclusão se lint, typecheck, testes ou build obrigatórios da fase estiverem pendentes (exceto quando inexistentes — aí declarar a pendência).
- Atualizar o Memory Bank quando mudar arquitetura, decisão, requisito, progresso ou pendência.
- Não sobrescrever alterações preexistentes do usuário sem autorização.
- Não executar comandos destrutivos (`rm -rf`, `git reset --hard`, `push --force`, etc.) sem explicar o impacto e obter autorização.

## Stack aprovada (decisões do projeto)

| Item            | Escolha                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| App             | Next.js App Router                                                      |
| Linguagem       | TypeScript `strict: true`                                               |
| Estilo          | Tailwind CSS (**sem** Bootstrap CSS)                                    |
| Pacotes         | npm + `package-lock.json`                                               |
| Agent           | Mastra                                                                  |
| LLM             | Google Gemini via `@google/genai` (fase de integração); **mocks no CI** |
| Dados           | PostgreSQL + Prisma                                                     |
| Testes          | Vitest, RTL, Playwright                                                 |
| UI docs         | Storybook                                                               |
| Qualidade       | ESLint, Prettier, Husky, lint-staged                                    |
| CI              | GitHub Actions                                                          |
| Deploy previsto | Vercel (sujeito a validação)                                            |

Regras de negócio críticas ficam no **domain** (código testável), não só no LLM. Autorização e privacidade conforme PRD.

## Segredos

- Nunca versionar `.env`, chaves API, tokens ou credenciais.
- Usar `.env.example` apenas com nomes de variáveis, sem valores secretos.
- CI **não** deve chamar a API Gemini de verdade.

## Git

Ver `.cursor/rules/git-workflow.mdc`.

- Commit e push **somente** com autorização explícita do usuário.
- Conventional Commits; unidades de trabalho pequenas e coerentes.

## Qualidade

Ver `.cursor/rules/quality-and-testing.mdc`.

Contrato de scripts previsto no `package.json` (criar no bootstrap):

- `lint` · `typecheck` · `test` · `build` · (`test:e2e` / `storybook` quando existirem)

## Estado atual (atualizar em `progress.md`)

Planejamento **aprovado**. Bootstrap Next.js **concluído**. Repositório Git ainda pode não existir — `git init`/commit/push só com autorização. Próximo marco: domínio + Ticket Service (não UI completa).
