import type { FastifyInstance } from 'fastify';
import { employeeIdParam } from '../employees/employees.schema.js';
import { toEmployeeDetail } from '../employees/employees.serialize.js';
import { createRevisionBody } from './salary.schema.js';
import { updateSalary } from './salary.service.js';

export function registerSalaryRoutes(app: FastifyInstance): void {
  app.post('/employees/:id/salary-revisions', async (request, reply) => {
    const { id } = employeeIdParam.parse(request.params);
    const body = createRevisionBody.parse(request.body);
    const employee = await updateSalary(app.prisma, id, body);
    reply.status(201);
    return { data: toEmployeeDetail(employee) };
  });
}
