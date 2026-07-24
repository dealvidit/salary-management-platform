import type { Prisma } from '@prisma/client';
import { NotFoundError } from '../../lib/errors.js';
import type { PrismaClient } from '../../prisma.js';
import type { ListEmployeesQuery } from './employees.schema.js';

function buildWhere(query: ListEmployeesQuery): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {};
  if (query.department) where.department = query.department;
  if (query.country) where.country = query.country;
  if (query.level) where.level = query.level;
  if (query.search) {
    // SQLite LIKE is case-insensitive for ASCII, which is all we need here.
    where.OR = [
      { firstName: { contains: query.search } },
      { lastName: { contains: query.search } },
      { employeeNumber: { contains: query.search } },
    ];
  }
  return where;
}

function buildOrderBy(query: ListEmployeesQuery): Prisma.EmployeeOrderByWithRelationInput[] {
  switch (query.sort) {
    case 'salary':
      // Sort on the normalized value so it's comparable across currencies.
      return [{ currentSalaryUsdMinor: query.order }];
    case 'hireDate':
      return [{ hireDate: query.order }];
    case 'name':
      return [{ lastName: query.order }, { firstName: query.order }];
  }
}

export async function listEmployees(prisma: PrismaClient, query: ListEmployeesQuery) {
  const where = buildWhere(query);
  const [rows, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: buildOrderBy(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.employee.count({ where }),
  ]);
  return { rows, total };
}

export async function getEmployeeById(prisma: PrismaClient, id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { revisions: { orderBy: { effectiveOn: 'desc' } } },
  });
  if (!employee) throw new NotFoundError(`Employee ${id} not found`);
  return employee;
}
