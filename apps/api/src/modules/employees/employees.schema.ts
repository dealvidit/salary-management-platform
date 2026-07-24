import { z } from 'zod';

// Query contract for the employee list. Defaults keep the endpoint usable with
// no params; caps keep a careless client from asking for everything at once.
export const listEmployeesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  level: z.string().trim().min(1).optional(),
  sort: z.enum(['name', 'salary', 'hireDate']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuery>;

export const employeeIdParam = z.object({
  id: z.coerce.number().int().positive(),
});
