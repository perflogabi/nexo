# Docker — rodar o Nexo Assist localmente

Caminho **opcional** para avaliadores e demos: sobe a app Next.js + PostgreSQL 16 sem conta Neon.

O banco **oficial** do projeto continua sendo o **Neon** (produção / Vercel). Ver `docs/database.md`.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2+

## Subir

Na raiz do repositório:

```bash
docker compose up --build
```

Abra [http://localhost:3000](http://localhost:3000).

Se a porta 3000 já estiver em uso:

```bash
APP_PORT=3001 docker compose up --build
# → http://localhost:3001
```

No primeiro boot o container `app`:

1. espera o Postgres ficar saudável
2. aplica `prisma migrate deploy`
3. roda o seed demo
4. inicia o Next.js (`output: 'standalone'`)

## Contas demo (qualquer senha)

| Perfil      | E-mail                  |
| ----------- | ----------------------- |
| Funcionário | `ana.souza@nexo.com.br` |
| Analista    | `analista@nexo.local`   |

Outros funcionários do seed: `carla.mendes@nexo.com.br`, `bruno.tavares@nexo.com.br`, etc.

## Agent / Gemini

Por padrão o Compose usa `AGENT_LLM=mock` (sem chave).

Para Gemini real:

```bash
GEMINI_API_KEY=sua-chave docker compose up --build
```

(opcional) `GEMINI_MODEL=gemini-flash-lite-latest`

## Parar / limpar

```bash
docker compose down          # mantém volume do Postgres
docker compose down -v       # apaga dados do banco local
```

## Scripts npm

```bash
npm run docker:up      # alias de compose up --build
npm run docker:down
```

## Troubleshooting

| Sintoma                                 | O que checar                                          |
| --------------------------------------- | ----------------------------------------------------- |
| `app` reinicia em loop                  | logs: `docker compose logs -f app` — migrate/seed/URL |
| Porta 3000 ou 5432 ocupada              | `APP_PORT=3001 docker compose up --build`             |
| Mudou o schema Prisma                   | rebuild: `docker compose up --build`                  |
| Quer Neon em vez de Postgres do Compose | use `.env` com URLs Neon e `npm run dev` (sem Docker) |

Smoke validado: migrate + seed + `/login` HTTP 200 com `APP_PORT=3001`.
