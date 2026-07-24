import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { setupErrorHandler } from './lib/errors.js';
import { registerEmployeeRoutes } from './modules/employees/employees.routes.js';
import type { PrismaClient } from './prisma.js';
import { registerHealthRoutes } from './routes/health.js';

export interface ServerDeps {
  config: Config;
  prisma: PrismaClient;
}

// Build the app from injected dependencies so tests can wire an in-memory
// database and inspect requests without binding a real port.
export function buildServer({ config, prisma }: ServerDeps): FastifyInstance {
  const app = Fastify({
    logger: config.NODE_ENV !== 'test',
  });

  app.register(cors, { origin: config.CORS_ORIGIN });

  app.decorate('prisma', prisma);

  setupErrorHandler(app);
  registerHealthRoutes(app);
  registerEmployeeRoutes(app);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
