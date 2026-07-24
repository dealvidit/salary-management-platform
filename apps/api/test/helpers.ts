import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '../src/config.js';
import { createPrismaClient, type PrismaClient } from '../src/prisma.js';
import { buildServer } from '../src/server.js';

export interface TestContext {
  app: FastifyInstance;
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
}

/**
 * Spin up the real app against a throwaway SQLite file with the schema applied.
 * Each test file gets its own database, so tests never share state and can run
 * in parallel. Fast enough (~1s of schema push) for the handful we have.
 */
export function createTestContext(): TestContext {
  const dir = mkdtempSync(join(tmpdir(), 'salary-test-'));
  const databaseUrl = `file:${join(dir, 'test.db')}`;

  execSync('npx prisma db push --skip-generate --schema=prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });

  const config = loadConfig({ ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'test' });
  const prisma = createPrismaClient(databaseUrl);
  const app = buildServer({ config, prisma });

  return {
    app,
    prisma,
    cleanup: async () => {
      await app.close();
      await prisma.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
