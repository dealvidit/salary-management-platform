import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from './helpers.js';
import { seedEmployee } from './fixtures.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = createTestContext();
  // A small, known population spanning departments and currencies.
  await seedEmployee(ctx.prisma, { lastName: 'Ashwin', department: 'Engineering', currentSalaryUsdMinor: 9_000_000 });
  await seedEmployee(ctx.prisma, { lastName: 'Bianchi', department: 'Sales', currentSalaryUsdMinor: 6_000_000 });
  await seedEmployee(ctx.prisma, { lastName: 'Costa', department: 'Engineering', currentSalaryUsdMinor: 12_000_000 });
  // Local amount is huge (JPY) but normalized value is the smallest — proves we
  // sort on the normalized figure, not the raw local number.
  await seedEmployee(ctx.prisma, {
    lastName: 'Dubois',
    department: 'Sales',
    country: 'JP',
    currency: 'JPY',
    currentSalaryMinor: 8_000_000,
    currentSalaryUsdMinor: 5_000_000,
  });
});

afterAll(() => ctx.cleanup());

async function get(path: string) {
  const res = await ctx.app.inject({ method: 'GET', url: `/api${path}` });
  return { status: res.statusCode, body: res.json() };
}

describe('GET /employees', () => {
  it('paginates and reports the total', async () => {
    const { status, body } = await get('/employees?page=1&pageSize=2');
    expect(status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(4);
    expect(body.totalPages).toBe(2);
  });

  it('filters by department', async () => {
    const { body } = await get('/employees?department=Sales');
    expect(body.total).toBe(2);
    expect(body.data.every((e: { department: string }) => e.department === 'Sales')).toBe(true);
  });

  it('searches by name', async () => {
    const { body } = await get('/employees?search=costa');
    expect(body.total).toBe(1);
    expect(body.data[0].lastName).toBe('Costa');
  });

  it('sorts by normalized salary, not the raw local amount', async () => {
    const { body } = await get('/employees?sort=salary&order=asc');
    const names = body.data.map((e: { lastName: string }) => e.lastName);
    // Dubois has the largest local (JPY) amount but the smallest USD value.
    expect(names).toEqual(['Dubois', 'Bianchi', 'Ashwin', 'Costa']);
  });

  it('rejects an oversized page size', async () => {
    const { status, body } = await get('/employees?pageSize=500');
    expect(status).toBe(400);
    expect(body.error).toBe('ValidationError');
  });
});

describe('GET /employees/:id', () => {
  it('returns the employee with salary history', async () => {
    const created = await seedEmployee(ctx.prisma, { firstName: 'Detail', lastName: 'Check' });
    const { status, body } = await get(`/employees/${created.id}`);
    expect(status).toBe(200);
    expect(body.data.email).toBe(created.email);
    expect(body.data.salaryHistory).toHaveLength(1);
    expect(body.data.salaryHistory[0].reason).toBe('Initial salary');
  });

  it('returns 404 for an unknown employee', async () => {
    const { status, body } = await get('/employees/999999');
    expect(status).toBe(404);
    expect(body.error).toBe('NotFound');
  });
});
