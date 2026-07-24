import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from './helpers.js';
import { seedEmployee } from './fixtures.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = createTestContext();
  await ctx.prisma.fxRate.create({
    data: { currency: 'USD', usdPerUnit: 1, effectiveOn: new Date('2026-07-01') },
  });
  // Known population: Engineering totals more than Sales.
  await seedEmployee(ctx.prisma, {
    department: 'Engineering',
    country: 'US',
    currentSalaryUsdMinor: 10_000_000,
  });
  await seedEmployee(ctx.prisma, {
    department: 'Engineering',
    country: 'US',
    currentSalaryUsdMinor: 20_000_000,
  });
  await seedEmployee(ctx.prisma, {
    department: 'Sales',
    country: 'IN',
    currentSalaryUsdMinor: 6_000_000,
  });
});

afterAll(() => ctx.cleanup());

async function get(path: string) {
  const res = await ctx.app.inject({ method: 'GET', url: `/api${path}` });
  return { status: res.statusCode, body: res.json() };
}

describe('GET /insights/summary', () => {
  it('reports payroll, headcount and the most expensive department', async () => {
    const { status, body } = await get('/insights/summary');
    expect(status).toBe(200);
    expect(body.data.headcount).toBe(3);
    expect(body.data.totalPayrollUsdMinor).toBe(36_000_000);
    expect(body.data.medianUsdMinor).toBe(10_000_000);
    expect(body.data.countryCount).toBe(2);
    expect(body.data.mostExpensiveDepartment).toEqual({
      department: 'Engineering',
      totalUsdMinor: 30_000_000,
    });
    expect(body.data.asOf).toBeTruthy();
  });
});

describe('GET /insights/pay', () => {
  it('breaks pay down by department with medians and a distribution', async () => {
    const { body } = await get('/insights/pay');
    expect(body.data.byDepartment[0]).toMatchObject({
      key: 'Engineering',
      headcount: 2,
      medianUsdMinor: 15_000_000,
    });
    expect(body.data.distribution.count).toBe(3);
    expect(body.data.distribution.histogram.length).toBeGreaterThan(0);
  });
});

describe('GET /meta', () => {
  it('lists the filter options present in the data', async () => {
    const { body } = await get('/meta');
    expect(body.data.departments).toEqual(['Engineering', 'Sales']);
    expect(body.data.countries).toEqual(['IN', 'US']);
  });
});
