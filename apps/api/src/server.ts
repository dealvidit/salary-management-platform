import { resolve } from 'node:path';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { setupErrorHandler } from './lib/errors.js';
import { registerEmployeeRoutes } from './modules/employees/employees.routes.js';
import { registerInsightsRoutes } from './modules/insights/insights.routes.js';
import { registerMetaRoutes } from './modules/meta/meta.routes.js';
import { registerSalaryRoutes } from './modules/salary/salary.routes.js';
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

  // All application endpoints live under /api, leaving the root free to serve
  // the frontend in production.
  app.register(
    async (api) => {
      registerHealthRoutes(api);
      registerEmployeeRoutes(api);
      registerSalaryRoutes(api);
      registerInsightsRoutes(api);
      registerMetaRoutes(api);
    },
    { prefix: '/api' },
  );

  if (config.WEB_DIST_PATH) {
    serveFrontend(app, config.WEB_DIST_PATH);
  }

  return app;
}

// Serve the built SPA: real files where they exist, and index.html for any other
// (non-API) path so client-side routing works on refresh and deep links.
function serveFrontend(app: FastifyInstance, root: string): void {
  app.register(fastifyStatic, { root: resolve(root), wildcard: false });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.status(404).send({ error: 'NotFound', message: 'Route not found' });
    }
    return reply.sendFile('index.html');
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
