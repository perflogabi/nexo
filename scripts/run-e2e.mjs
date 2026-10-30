#!/usr/bin/env node
/**
 * Playwright E2E após guardrail. Env injetado; não altera .env do projeto.
 *
 * Espelha o Dockerfile: o server standalone só serve /_next/static se os
 * assets estiverem em `.next/standalone/.next/static` (senão /login fica em
 * “Carregando…” — Suspense de useSearchParams sem hidratação).
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const defaults = {
  NEXO_ENV: 'e2e',
  AGENT_LLM: 'mock',
  AUTH_SECRET: process.env.AUTH_SECRET || 'e2e-local-auth-secret',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://nexo_e2e:nexo_e2e@127.0.0.1:5433/nexo_e2e?schema=public',
  DIRECT_URL:
    process.env.DIRECT_URL ||
    'postgresql://nexo_e2e:nexo_e2e@127.0.0.1:5433/nexo_e2e?schema=public',
  PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
  // Limites folgados no job E2E (proteção permanece ativa; IPs distintos nos helpers).
  RATE_LIMIT_LOGIN_MAX: process.env.RATE_LIMIT_LOGIN_MAX || '100',
  RATE_LIMIT_AGENT_MAX: process.env.RATE_LIMIT_AGENT_MAX || '200',
};

const env = { ...process.env, ...defaults };

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

/**
 * Copia assets para o tree standalone (idempotente; seguro reexecutar).
 */
function prepareStandaloneAssets() {
  const standaloneDir = path.join(root, '.next', 'standalone');
  const staticSrc = path.join(root, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  const publicSrc = path.join(root, 'public');
  const publicDest = path.join(standaloneDir, 'public');

  if (!existsSync(standaloneDir)) {
    console.error(
      '[run-e2e] `.next/standalone` ausente. Execute `npm run build` (output: standalone).',
    );
    process.exit(1);
  }
  if (!existsSync(staticSrc)) {
    console.error('[run-e2e] `.next/static` ausente. Execute `npm run build` antes do E2E.');
    process.exit(1);
  }

  mkdirSync(path.join(standaloneDir, '.next'), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log('[run-e2e] assets: .next/static → .next/standalone/.next/static');

  if (existsSync(publicSrc) && !existsSync(publicDest)) {
    cpSync(publicSrc, publicDest, { recursive: true });
    console.log('[run-e2e] assets: public → .next/standalone/public');
  }
}

run(process.execPath, [path.join(root, 'scripts/assert-e2e-database.mjs')]);
env.E2E_DATABASE_OK = '1';
if (!existsSync(path.join(root, '.next'))) {
  console.log('[run-e2e] .next ausente — executando npm run build…');
  run('npm', ['run', 'build']);
}
prepareStandaloneAssets();
run('npx', ['playwright', 'test', ...process.argv.slice(2)]);
