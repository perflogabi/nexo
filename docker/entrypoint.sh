#!/bin/sh
set -eu

cd /prisma-tools
export PATH="/prisma-tools/node_modules/.bin:$PATH"

echo "[nexo] aguardando Postgres..."
i=0
until node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(async () => { await p.\$disconnect(); process.exit(0); })
  .catch(async () => { try { await p.\$disconnect(); } catch {} process.exit(1); });
" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[nexo] timeout aguardando banco (DATABASE_URL / DIRECT_URL)" >&2
    exit 1
  fi
  sleep 2
done

echo "[nexo] aplicando migrations..."
npx prisma migrate deploy

echo "[nexo] seed demo..."
node --experimental-strip-types ./prisma/seed.ts

echo "[nexo] iniciando Next.js (porta ${PORT:-3000})..."
cd /app
exec node server.js
