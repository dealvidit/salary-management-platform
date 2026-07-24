import { PrismaClient, type Prisma } from '@prisma/client';
import { normalizeToUsdMinor, toMinorUnits } from '../src/domain/money.js';
import {
  COUNTRIES,
  DEPARTMENTS,
  FIRST_NAMES,
  FX_RATES,
  jobTitle,
  LAST_NAMES,
  LEVELS,
  REFERENCE_DATE,
  salaryStep,
  type Country,
  type Department,
  type Level,
} from './reference.js';

const EMPLOYEE_COUNT = 10_000;
const SEED = 20260701; // fixed → identical dataset on every run
const DAY_MS = 24 * 60 * 60 * 1000;

// --- deterministic randomness -------------------------------------------------

/** mulberry32: tiny, fast, seedable PRNG. Enough for realistic-looking data. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick from empty list');
  return item;
}

function weightedPick<T extends { weight: number }>(rng: () => number, items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = rng() * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item;
  }
  return items[items.length - 1]!;
}

function roundToStep(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

function daysAgo(days: number): Date {
  return new Date(REFERENCE_DATE.getTime() - days * DAY_MS);
}

// --- salary + history ---------------------------------------------------------

/** Current salary in local major units, with within-band spread and rare outliers. */
function currentSalary(rng: () => number, country: Country, dept: Department, level: Level): number {
  const anchor = country.baseAnnual * dept.multiplier * level.multiplier;
  let amount = anchor * (0.82 + rng() * 0.36); // ±~18% spread within a band

  const roll = rng();
  if (roll < 0.02) amount *= 0.68; // clearly underpaid — gives outlier insights signal
  else if (roll > 0.98) amount *= 1.4; // clearly overpaid

  return roundToStep(amount, salaryStep(country.currency));
}

const RAISE_REASONS = ['Annual review', 'Promotion', 'Market adjustment', 'Retention adjustment'];

interface Revision {
  amountMajor: number;
  effectiveOn: Date;
  reason: string;
}

/**
 * Build an append-only salary history ending at `current`. Works backwards from
 * the current amount, dividing by each raise so earlier salaries are lower, and
 * spreads effective dates across the employee's tenure. The last revision is the
 * current salary; the first is the hire-date "Initial salary".
 */
function buildHistory(
  rng: () => number,
  current: number,
  currency: string,
  hireDate: Date,
): Revision[] {
  const raiseCount = weightedPick(rng, [
    { value: 0, weight: 40 },
    { value: 1, weight: 35 },
    { value: 2, weight: 20 },
    { value: 3, weight: 5 },
  ]).value;

  const step = salaryStep(currency);
  const amounts = [current];
  for (let i = 0; i < raiseCount; i++) {
    const previous = roundToStep(amounts[0]! / (1.03 + rng() * 0.06), step);
    amounts.unshift(previous);
  }

  // Ascending effective dates: hire date first, then random points up to "now".
  const hireDays = Math.round((REFERENCE_DATE.getTime() - hireDate.getTime()) / DAY_MS);
  const dates = [hireDate];
  for (let i = 0; i < raiseCount; i++) {
    dates.push(daysAgo(Math.floor(rng() * Math.max(1, hireDays - 1))));
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  return amounts.map((amountMajor, i) => ({
    amountMajor,
    effectiveOn: dates[i]!,
    reason: i === 0 ? 'Initial salary' : pick(rng, RAISE_REASONS),
  }));
}

// --- generation ---------------------------------------------------------------

function buildDataset() {
  const rng = mulberry32(SEED);
  const employees: Prisma.EmployeeCreateManyInput[] = [];
  const revisions: Prisma.SalaryRevisionCreateManyInput[] = [];

  for (let id = 1; id <= EMPLOYEE_COUNT; id++) {
    const country = weightedPick(rng, COUNTRIES);
    const dept = weightedPick(rng, DEPARTMENTS);
    const level = weightedPick(rng, LEVELS);
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);

    const hireDate = daysAgo(30 + Math.floor(rng() * (8 * 365)));
    const current = currentSalary(rng, country, dept, level);
    const history = buildHistory(rng, current, country.currency, hireDate);
    const latest = history[history.length - 1]!;

    const currentSalaryMinor = toMinorUnits(latest.amountMajor, country.currency);
    const employeeNumber = `EMP${String(id).padStart(5, '0')}`;

    employees.push({
      id,
      employeeNumber,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${id}@acme.example`.toLowerCase(),
      country: country.code,
      currency: country.currency,
      department: dept.name,
      level: level.code,
      jobTitle: jobTitle(level, dept),
      hireDate,
      currentSalaryMinor,
      currentSalaryUsdMinor: normalizeToUsdMinor(
        currentSalaryMinor,
        country.currency,
        FX_RATES[country.currency]!,
      ),
      currentSalaryEffectiveOn: latest.effectiveOn,
    });

    for (const revision of history) {
      revisions.push({
        employeeId: id,
        amountMinor: toMinorUnits(revision.amountMajor, country.currency),
        effectiveOn: revision.effectiveOn,
        reason: revision.reason,
      });
    }
  }

  return { employees, revisions };
}

// --- persistence --------------------------------------------------------------

async function chunkedCreateMany<T>(
  rows: T[],
  size: number,
  insert: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const startedAt = Date.now();

  try {
    console.warn('Clearing existing data…');
    await prisma.salaryRevision.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.fxRate.deleteMany();

    await prisma.fxRate.createMany({
      data: Object.entries(FX_RATES).map(([currency, usdPerUnit]) => ({
        currency,
        usdPerUnit,
        effectiveOn: REFERENCE_DATE,
      })),
    });

    console.warn(`Generating ${EMPLOYEE_COUNT.toLocaleString()} employees…`);
    const { employees, revisions } = buildDataset();

    console.warn('Inserting…');
    await chunkedCreateMany(employees, 1_000, (batch) =>
      prisma.employee.createMany({ data: batch }),
    );
    await chunkedCreateMany(revisions, 1_000, (batch) =>
      prisma.salaryRevision.createMany({ data: batch }),
    );

    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.warn(
      `Seeded ${employees.length.toLocaleString()} employees and ` +
        `${revisions.length.toLocaleString()} salary revisions in ${seconds}s.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
