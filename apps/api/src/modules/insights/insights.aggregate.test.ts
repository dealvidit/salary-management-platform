import { describe, expect, it } from 'vitest';
import { buildSummary, groupStats, histogram, type SalaryRow } from './insights.aggregate.js';

const rows: SalaryRow[] = [
  { department: 'Engineering', level: 'L3', country: 'US', currency: 'USD', usdMinor: 100 },
  { department: 'Engineering', level: 'L4', country: 'US', currency: 'USD', usdMinor: 300 },
  { department: 'Sales', level: 'L3', country: 'IN', currency: 'INR', usdMinor: 200 },
];

describe('buildSummary', () => {
  it('summarizes headcount, payroll and the pay midpoint', () => {
    const summary = buildSummary(rows);
    expect(summary.headcount).toBe(3);
    expect(summary.totalPayrollUsdMinor).toBe(600);
    expect(summary.meanUsdMinor).toBe(200);
    expect(summary.medianUsdMinor).toBe(200);
    expect(summary.countryCount).toBe(2);
  });

  it('identifies the most expensive department by total cost', () => {
    // Engineering totals 400 (100 + 300) vs Sales 200.
    expect(buildSummary(rows).mostExpensiveDepartment).toEqual({
      department: 'Engineering',
      totalUsdMinor: 400,
    });
  });

  it('has no most-expensive department when there is no data', () => {
    expect(buildSummary([]).mostExpensiveDepartment).toBeNull();
  });
});

describe('groupStats', () => {
  it('groups, summarizes and orders by total cost descending', () => {
    const byDept = groupStats(rows, (row) => row.department);
    expect(byDept.map((g) => g.key)).toEqual(['Engineering', 'Sales']);
    expect(byDept[0]).toMatchObject({
      key: 'Engineering',
      headcount: 2,
      totalUsdMinor: 400,
      medianUsdMinor: 200,
      minUsdMinor: 100,
      maxUsdMinor: 300,
    });
  });
});

describe('histogram', () => {
  it('counts values into even-width buckets', () => {
    const buckets = histogram([100, 200, 300], 2);
    expect(buckets).toHaveLength(2);
    expect(buckets.map((b) => b.count)).toEqual([1, 2]); // 100 | 200,300
  });

  it('collapses to a single bucket when everyone is paid the same', () => {
    expect(histogram([500, 500], 5)).toEqual([{ fromUsdMinor: 500, toUsdMinor: 500, count: 2 }]);
  });

  it('returns nothing for an empty population', () => {
    expect(histogram([], 5)).toEqual([]);
  });
});
