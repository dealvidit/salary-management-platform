import { PrismaClient } from '@prisma/client';

// A single client per process. Fastify shares this instance across requests;
// tests build their own against a throwaway database.
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );
}

export type { PrismaClient };
