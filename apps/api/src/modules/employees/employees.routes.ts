import type { FastifyInstance } from 'fastify';
import { employeeIdParam, listEmployeesQuery } from './employees.schema.js';
import { getEmployeeById, listEmployees } from './employees.service.js';
import { toEmployeeDetail, toEmployeeSummary } from './employees.serialize.js';

export function registerEmployeeRoutes(app: FastifyInstance): void {
  app.get('/employees', async (request) => {
    const query = listEmployeesQuery.parse(request.query);
    const { rows, total } = await listEmployees(app.prisma, query);
    return {
      data: rows.map(toEmployeeSummary),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  });

  app.get('/employees/:id', async (request) => {
    const { id } = employeeIdParam.parse(request.params);
    const employee = await getEmployeeById(app.prisma, id);
    return { data: toEmployeeDetail(employee) };
  });
}
