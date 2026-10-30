# shellcheck shell=bash
# Env injetado para E2E local — NÃO sobrescreve .env do projeto.
# Uso: source scripts/e2e-env.sh

export NEXO_ENV=e2e
export AGENT_LLM=mock
export AUTH_SECRET="${AUTH_SECRET:-e2e-local-auth-secret}"
export DATABASE_URL="${DATABASE_URL:-postgresql://nexo_e2e:nexo_e2e@127.0.0.1:5433/nexo_e2e?schema=public}"
export DIRECT_URL="${DIRECT_URL:-postgresql://nexo_e2e:nexo_e2e@127.0.0.1:5433/nexo_e2e?schema=public}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3000}"
# Marcador interno: só o prepare/assert define OK após guardrail
unset E2E_DATABASE_OK
