import { summarize } from '../../domain/stats.js';

// Pure aggregation over a lightweight per-employee projection. Everything here
// works on the normalized USD value so figures compare across countries. Kept
// free of Prisma so it's trivially unit-tested.

export interface SalaryRow {
  department: string;
  level: string;
  country: string;
  currency: string;
  usdMinor: number;
}

export interface GroupStat {
  key: string;
  headcount: number;
  totalUsdMinor: number;
  meanUsdMinor: number;
  medianUsdMinor: number;
  minUsdMinor: number;
  maxUsdMinor: number;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Group rows by a key and summarize each group, most expensive first. */
export function groupStats(rows: SalaryRow[], keyOf: (row: SalaryRow) => string): GroupStat[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = keyOf(row);
    let values = groups.get(key);
    if (!values) {
      values = [];
      groups.set(key, values);
    }
    values.push(row.usdMinor);
  }

  return [...groups.entries()]
    .map(([key, values]) => {
      const stats = summarize(values);
      return {
        key,
        headcount: stats.count,
        totalUsdMinor: sum(values),
        meanUsdMinor: stats.mean ?? 0,
        medianUsdMinor: stats.median ?? 0,
        minUsdMinor: stats.min ?? 0,
        maxUsdMinor: stats.max ?? 0,
      };
    })
    .sort((a, b) => b.totalUsdMinor - a.totalUsdMinor || a.key.localeCompare(b.key));
}

export interface HistogramBucket {
  fromUsdMinor: number;
  toUsdMinor: number;
  count: number;
}

/** Even-width buckets across the salary range — the shape of the pay distribution. */
export function histogram(values: number[], bucketCount: number): HistogramBucket[] {
  if (values.length === 0 || bucketCount < 1) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Degenerate range (everyone paid the same) — one bucket holding everyone.
  if (min === max) return [{ fromUsdMinor: min, toUsdMinor: max, count: values.length }];

  const width = (max - min) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    fromUsdMinor: Math.round(min + i * width),
    toUsdMinor: Math.round(min + (i + 1) * width),
    count: 0,
  }));

  for (const value of values) {
    const index = Math.min(bucketCount - 1, Math.floor((value - min) / width));
    buckets[index]!.count += 1;
  }
  return buckets;
}

export function buildSummary(rows: SalaryRow[]) {
  const values = rows.map((row) => row.usdMinor);
  const stats = summarize(values);
  const byDepartment = groupStats(rows, (row) => row.department);
  const mostExpensive = byDepartment[0];

  return {
    headcount: stats.count,
    totalPayrollUsdMinor: sum(values),
    meanUsdMinor: stats.mean,
    medianUsdMinor: stats.median,
    countryCount: new Set(rows.map((row) => row.country)).size,
    mostExpensiveDepartment: mostExpensive
      ? { department: mostExpensive.key, totalUsdMinor: mostExpensive.totalUsdMinor }
      : null,
  };
}
