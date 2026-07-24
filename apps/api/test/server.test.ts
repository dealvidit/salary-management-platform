import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { createPrismaClient, type PrismaClient } from '../src/prisma.js';
import { buildServer } from '../src/server.js';

let app: FastifyInstance;
let prisma: PrismaClient;
let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'salary-server-'));
  const databaseUrl = `file:${join(dir, 'test.db')}`;
  execSync('npx prisma db push --skip-generate --schema=prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });

  const webDir = join(dir, 'web');
  mkdirSync(webDir);
  writeFileSync(join(webDir, 'index.html'), '<!doctype html><title>App shell</title>');

  const config = loadConfig({
    ...process.env,
    DATABASE_URL: databaseUrl,
    NODE_ENV: 'test',
    WEB_DIST_PATH: webDir,
  });
  prisma = createPrismaClient(databaseUrl);
  app = buildServer({ config, prisma });
  // A route that blows up, to exercise the 500 fallback.
  app.get('/boom', async () => {
    throw new Error('kaboom');
  });
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

describe('server wiring', () => {
  it('reports health at /api/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('returns JSON 404 for an unknown API route', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('NotFound');
  });

  it('serves the SPA shell for non-API paths (client-side routing)', async () => {
    const res = await app.inject({ method: 'GET', url: '/insights' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('App shell');
  });

  it('maps an unexpected error to a 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe('InternalServerError');
  });
});
