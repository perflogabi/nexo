/**
 * Escopo TI do service desk (Anexo A / testing-strategy §1.7).
 * Categorias do ticket (ACESSO, REDE_VPN, …) são domínio TI.
 * Pedidos de RH / financeiro / facilities → fora de escopo (redirecionar).
 */

import type { Category, RequestDomain } from './types';

const TI_CATEGORIES: ReadonlySet<Category> = new Set([
  'ACESSO',
  'REDE_VPN',
  'HARDWARE',
  'SOFTWARE',
  'EMAIL',
  'OUTROS',
]);

export function isTiCategory(category: Category): boolean {
  return TI_CATEGORIES.has(category);
}

/** Domínio classificado (pelo agent/serviço) está no escopo do Nexo Assist? */
export function isInTiScope(domain: RequestDomain): boolean {
  return domain === 'TI';
}
