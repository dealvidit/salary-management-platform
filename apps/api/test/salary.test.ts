import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from './helpers.js';
import { seedEmployee } from './fixtures.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = createTestContext();
  await ctx.prisma.fxRate.createMany({
    data: [
      { currency: 'USD', usdPerUnit: 1, effectiveOn: new Date('2026-07-01') },
      { currency: 'INR', usdPerUnit: 0.012, effectiveOn: new Date('2026-07-01') },
    ],
  });
});

afterAll(() => ctx.cleanup());

function post(id: number, body: unknown) {
  return ctx.app.inject({ method: 'POST', url: `/api/employees/${id}/salary-revisions`, payload: body });
}

describe('POST /employees/:id/salary-revisions', () => {
  it('appends a revision and moves the current-salary projection', async () => {
    const employee = await seedEmployee(ctx.prisma, {
      currency: 'INR',
      country: 'IN',
      currentSalaryMinor: 200_000_000, // 2,000,000 INR
      currentSalaryUsdMinor: 2_400_000,
      hireDate: new Date('2020-01-01'),
    });

    const res = await post(employee.id, {
      amountMinor: 250_000_000, // 2,500,000 INR
      effectiveOn: '2025-06-01',
      reason: 'Promotion',
    });
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.data.currentSalary.amountMinor).toBe(250_000_000);
    // 2,500,000 INR * 0.012 = $30,000.00 -> 3,000,000 USD cents.
    expect(body.data.currentSalary.usdMinor).toBe(3_000_000);
    expect(body.data.salaryHistory).toHaveLength(2);
    expect(body.data.salaryHistory[0].reason).toBe('Promotion'); // newest first

    // The stored projection reflects the new revision.
    const stored = await ctx.prisma.employee.findUnique({ where: { id: employee.id } });
    expect(stored?.currentSalaryMinor).toBe(250_000_000);
    expect(stored?.currentSalaryUsdMinor).toBe(3_000_000);
  });

  it('rejects a future effective date', async () => {
    const employee = await seedEmployee(ctx.prisma, { currency: 'USD' });
    const res = await post(employee.id, {
      amountMinor: 15_000_000,
      effectiveOn: '2999-01-01',
      reason: 'Raise',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('BadRequest');
  });

  it('rejects an effective date before the current salary took effect', async () => {
    const employee = await seedEmployee(ctx.prisma, {
      currency: 'USD',
      hireDate: new Date('2023-01-01'),
    });
    const res = await post(employee.id, {
      amountMinor: 15_000_000,
      effectiveOn: '2022-01-01',
      reason: 'Backdated',
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a non-positive amount', async () => {
    const employee = await seedEmployee(ctx.prisma, { currency: 'USD' });
    const res = await post(employee.id, { amountMinor: 0, effectiveOn: '2025-01-01', reason: 'x' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('ValidationError');
  });

  it('returns 404 for an unknown employee', async () => {
    const res = await post(999_999, { amountMinor: 100, effectiveOn: '2025-01-01', reason: 'x' });
    expect(res.statusCode).toBe(404);
  });
});
