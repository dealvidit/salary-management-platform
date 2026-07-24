import type { FastifyInstance } from 'fastify';
import { getPayBreakdown, getSummary } from './insights.service.js';

export function registerInsightsRoutes(app: FastifyInstance): void {
  app.get('/insights/summary', async () => {
    return { data: await getSummary(app.prisma) };
  });

  app.get('/insights/pay', async () => {
    return { data: await getPayBreakdown(app.prisma) };
  });
}
