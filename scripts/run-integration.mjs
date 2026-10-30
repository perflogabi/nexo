#!/usr/bin/env node
/**
 * Roda Vitest de integração somente após guardrail do banco e2e.
 * Não carrega .env do app — use env injetado ou defaults locais 5433.
 */
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
};

const env = { ...process.env, ...defaults };

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(process.execPath, [path.join(root, 'scripts/assert-e2e-database.mjs')]);
env.E2E_DATABASE_OK = '1';
run('npx', ['vitest', 'run', '--config', 'vitest.integration.config.ts']);
