import type { FastifyInstance } from 'fastify';

// Liveness + a cheap readiness check (can we reach the database?). Handy for
// container health checks and for confirming the app is wired up end to end.
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/health', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  });
}
