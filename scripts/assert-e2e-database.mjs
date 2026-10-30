#!/usr/bin/env node
/**
 * Valida destino autorizado do banco E2E antes de migrate/seed/testes.
 * Não altera .env; só lê process.env injetado.
 *
 * Exige:
 * - NEXO_ENV=e2e|test
 * - E2E_DATABASE_OK=1 (só após este script, ou setado pelo wrapper pós-assert)
 * - DATABASE_URL e DIRECT_URL com dbname nexo_e2e
 * - host local (127.0.0.1|localhost) ou hostname CI allowlist
 * - porta 5433 em local; 5432 permitido só com host de service CI
 */

const ALLOWED_NEXO_ENV = new Set(['e2e', 'test']);
const ALLOWED_USERS = new Set(['nexo_e2e']);
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const CI_HOSTS = new Set(['postgres', '127.0.0.1', 'localhost']);
const DB_NAME = 'nexo_e2e';

function fail(msg) {
  console.error(`[e2e-db-guard] BLOQUEADO: ${msg}`);
  process.exit(1);
}

function parsePgUrl(raw, label) {
  if (!raw?.trim()) fail(`${label} ausente`);
  let u;
  try {
    u = new URL(raw);
  } catch {
    fail(`${label} inválida`);
  }
  if (u.protocol !== 'postgresql:' && u.protocol !== 'postgres:') {
    fail(`${label}: protocolo deve ser postgresql`);
  }
  const host = u.hostname.toLowerCase();
  const port = u.port ? Number(u.port) : 5432;
  const user = decodeURIComponent(u.username || '');
  const db = decodeURIComponent((u.pathname || '').replace(/^\//, '').split('?')[0] || '');

  if (!host) fail(`${label}: host vazio`);
  if (host.includes('neon.tech') || host.includes('neon.')) {
    fail(`${label}: Neon/proibido (${host})`);
  }
  if (db !== DB_NAME) fail(`${label}: database deve ser "${DB_NAME}" (obtido "${db}")`);
  if (!ALLOWED_USERS.has(user)) fail(`${label}: user deve ser nexo_e2e (obtido "${user}")`);

  return { host, port, user, db };
}

function assertHostPort(parsed, label) {
  const inCi = process.env.CI === 'true' || process.env.CI === '1';
  if (inCi) {
    if (!CI_HOSTS.has(parsed.host)) {
      fail(`${label}: host CI não autorizado (${parsed.host})`);
    }
    return;
  }
  if (!LOCAL_HOSTS.has(parsed.host)) {
    fail(`${label}: host local deve ser 127.0.0.1 ou localhost (obtido ${parsed.host})`);
  }
  if (parsed.port !== 5433) {
    fail(`${label}: porta local E2E deve ser 5433 (obtido ${parsed.port})`);
  }
}

const nexoEnv = (process.env.NEXO_ENV || '').trim().toLowerCase();
if (!ALLOWED_NEXO_ENV.has(nexoEnv)) {
  fail(`NEXO_ENV deve ser e2e|test (obtido "${process.env.NEXO_ENV || ''}")`);
}
if ((process.env.NEXO_ENV || '').trim().toLowerCase() === 'production') {
  fail('NEXO_ENV=production não pode rodar E2E');
}

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const a = parsePgUrl(databaseUrl, 'DATABASE_URL');
const b = parsePgUrl(directUrl, 'DIRECT_URL');
assertHostPort(a, 'DATABASE_URL');
assertHostPort(b, 'DIRECT_URL');
if (a.db !== b.db) fail('DATABASE_URL e DIRECT_URL devem apontar para o mesmo database');

console.log(
  `[e2e-db-guard] OK host=${a.host} port=${a.port} db=${a.db} user=${a.user} NEXO_ENV=${nexoEnv}`,
);
