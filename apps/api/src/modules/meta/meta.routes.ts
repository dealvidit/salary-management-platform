import type { FastifyInstance } from 'fastify';

// Filter option lists for the UI, derived from the data that actually exists so
// the dropdowns never offer a value with no matching employees.
export function registerMetaRoutes(app: FastifyInstance): void {
  app.get('/meta', async () => {
    const [departments, levels, countries] = await Promise.all([
      app.prisma.employee.findMany({
        distinct: ['department'],
        select: { department: true },
        orderBy: { department: 'asc' },
      }),
      app.prisma.employee.findMany({
        distinct: ['level'],
        select: { level: true },
        orderBy: { level: 'asc' },
      }),
      app.prisma.employee.findMany({
        distinct: ['country'],
        select: { country: true },
        orderBy: { country: 'asc' },
      }),
    ]);

    return {
      data: {
        departments: departments.map((row) => row.department),
        levels: levels.map((row) => row.level),
        countries: countries.map((row) => row.country),
      },
    };
  });
}
