# Banco de dados — Neon + Prisma

O Nexo Assist usa **Neon** (PostgreSQL gerenciado) como banco oficial e **Prisma** (v6) para schema, client e migrations.  
**Não** é necessário instalar ou manter PostgreSQL local.

## Escolha técnica inicial (pooling)

| Uso                                 | Variável       | Endpoint Neon           | Motivo                                                  |
| ----------------------------------- | -------------- | ----------------------- | ------------------------------------------------------- |
| App (Next.js / serverless)          | `DATABASE_URL` | **Pooled** (`-pooler`)  | Menos conexões abertas em ambiente serverless           |
| Migrations / `migrate` / introspect | `DIRECT_URL`   | **Direct** (sem pooler) | Engine de migration do Prisma precisa de conexão direta |

No `prisma/schema.prisma` (Prisma 6.x instalado):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Essa configuração é a recomendação habitual Neon + Prisma 6.  
A hipótese “validar pooling em produção no projeto Neon real” permanece **aberta** até haver credenciais e um smoke em deploy — **não** é requisito do PRD.

## Configuração local

1. Crie um projeto no [painel Neon](https://console.neon.tech) (ou use um existente).
2. Em **Connection details**, copie:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
3. `cp .env.example .env` e substitua `USER`, `PASSWORD`, hosts e database pelos valores do painel.
4. Nunca commite `.env`.
5. Gere o client e valide o schema (sem aplicar migrate ainda, se preferir):

```bash
npm run db:generate
npm run db:validate
```

## Migrations

Com `.env` apontando para o **seu** projeto Neon:

```bash
# Desenvolvimento — cria migration e aplica no banco configurado
npm run db:migrate:dev -- --name init

# Produção / CI controlado — aplica migrations já versionadas
npm run db:migrate:deploy

# Inspeção visual opcional (não altera schema)
npm run db:studio
```

**Não** rode `migrate` contra um banco compartilhado/produção sem autorização explícita.  
Este repositório **não** aplica migrations automaticamente no bootstrap.

## Deploy (Vercel + Neon)

1. No Vercel: Project → Settings → Environment Variables.
2. Defina `DATABASE_URL` (pooled) e `DIRECT_URL` (direct) a partir do Neon.
3. Defina também `AUTH_SECRET` e demais variáveis do `.env.example`.
4. Em build/release, use `npm run db:migrate:deploy` apenas no pipeline/comando autorizado (não no `prisma validate` do CI padrão).

## O que ainda depende do painel Neon

- Criação do projeto e branch de database
- Usuário, senha e hosts reais (pooled + direct)
- Limites de compute / scaling (fora do escopo do app)
- Smoke de conexão real e validação de pooling sob carga serverless
