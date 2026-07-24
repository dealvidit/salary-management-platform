import { summarize } from '../../domain/stats.js';
import type { PrismaClient } from '../../prisma.js';
import { buildSummary, groupStats, histogram, type SalaryRow } from './insights.aggregate.js';

const RECENT_WINDOW_DAYS = 30;
const HISTOGRAM_BUCKETS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

// One cheap query feeds every aggregate: at 10k rows, pulling the normalized
// salaries and grouping in memory is far simpler than pushing medians and
// percentiles into SQL, and fast enough to not matter. See docs/performance.md.
async function loadSalaryRows(prisma: PrismaClient): Promise<SalaryRow[]> {
  const rows = await prisma.employee.findMany({
    select: {
      department: true,
      level: true,
      country: true,
      currency: true,
      currentSalaryUsdMinor: true,
    },
  });
  return rows.map((row) => ({
    department: row.department,
    level: row.level,
    country: row.country,
    currency: row.currency,
    usdMinor: row.currentSalaryUsdMinor,
  }));
}

/** The date the normalization rates are effective, shown alongside USD figures. */
async function normalizedAsOf(prisma: PrismaClient): Promise<Date | null> {
  const latest = await prisma.fxRate.findFirst({ orderBy: { effectiveOn: 'desc' } });
  return latest?.effectiveOn ?? null;
}

export async function getSummary(prisma: PrismaClient, now: Date = new Date()) {
  const [rows, asOf] = await Promise.all([loadSalaryRows(prisma), normalizedAsOf(prisma)]);
  const since = new Date(now.getTime() - RECENT_WINDOW_DAYS * DAY_MS);
  const recentChangeCount = await prisma.salaryRevision.count({
    where: { effectiveOn: { gte: since }, reason: { not: 'Initial salary' } },
  });

  return {
    ...buildSummary(rows),
    recentChangeCount,
    recentWindowDays: RECENT_WINDOW_DAYS,
    normalizedTo: 'USD',
    asOf,
  };
}

export async function getPayBreakdown(prisma: PrismaClient) {
  const [rows, asOf] = await Promise.all([loadSalaryRows(prisma), normalizedAsOf(prisma)]);
  const values = rows.map((row) => row.usdMinor);

  return {
    distribution: { ...summarize(values), histogram: histogram(values, HISTOGRAM_BUCKETS) },
    byDepartment: groupStats(rows, (row) => row.department),
    byLevel: groupStats(rows, (row) => row.level),
    byCountry: groupStats(rows, (row) => row.country),
    normalizedTo: 'USD',
    asOf,
  };
}
