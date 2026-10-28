import { createAuthService, createPrismaEmployeeDirectory } from '@/services/auth';
import { createConversationService, createPrismaConversationStore } from '@/services/conversations';
import { prisma } from '@/lib/prisma';

export function getAuthService() {
  return createAuthService(createPrismaEmployeeDirectory(prisma));
}

export function getConversationService() {
  return createConversationService({
    store: createPrismaConversationStore(prisma),
  });
}
