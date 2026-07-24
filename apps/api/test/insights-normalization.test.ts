import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from './helpers.js';
import { seedEmployee } from './fixtures.js';

// When no FX rates are configured, aggregates still work (the normalized value is
// already stored) and the "as of" date is simply absent.
let ctx: TestContext;

beforeAll(async () => {
  ctx = createTestContext();
  await seedEmployee(ctx.prisma, { currentSalaryUsdMinor: 5_000_000 });
  await seedEmployee(ctx.prisma, { currentSalaryUsdMinor: 7_000_000 });
});

afterAll(() => ctx.cleanup());

async function get(path: string) {
  const res = await ctx.app.inject({ method: 'GET', url: `/api${path}` });
  return res.json();
}

describe('insights without FX rates', () => {
  it('summary reports totals with a null as-of date', async () => {
    const { data } = await get('/insights/summary');
    expect(data.headcount).toBe(2);
    expect(data.totalPayrollUsdMinor).toBe(12_000_000);
    expect(data.asOf).toBeNull();
  });

  it('pay breakdown also has a null as-of date', async () => {
    const { data } = await get('/insights/pay');
    expect(data.asOf).toBeNull();
    expect(data.byLevel.length).toBeGreaterThan(0);
  });
});
