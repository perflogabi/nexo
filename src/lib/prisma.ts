import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton (Next.js).
 * Não usar no client bundle. Migrations/seed ficam para fases posteriores.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
