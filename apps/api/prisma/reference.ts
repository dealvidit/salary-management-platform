// Static reference data for the seed. Chosen to make the seeded org look real:
// a country mix weighted toward India and the US, departments and levels with
// different pay, and a level pyramid. Numbers are approximate market anchors,
// not precise — the point is realistic *shape*, deterministically produced.

/** The date the seeded world is "as of". Fixed so the seed is reproducible. */
export const REFERENCE_DATE = new Date('2026-07-01T00:00:00.000Z');

export interface Country {
  code: string; // ISO-3166 alpha-2
  currency: string; // ISO-4217
  /** Annual salary anchor for a mid-level IC, in local major units. */
  baseAnnual: number;
  /** Relative headcount weight. */
  weight: number;
}

export const COUNTRIES: Country[] = [
  { code: 'IN', currency: 'INR', baseAnnual: 1_800_000, weight: 32 },
  { code: 'US', currency: 'USD', baseAnnual: 120_000, weight: 24 },
  { code: 'GB', currency: 'GBP', baseAnnual: 65_000, weight: 10 },
  { code: 'DE', currency: 'EUR', baseAnnual: 75_000, weight: 9 },
  { code: 'CA', currency: 'CAD', baseAnnual: 110_000, weight: 6 },
  { code: 'AU', currency: 'AUD', baseAnnual: 120_000, weight: 5 },
  { code: 'SG', currency: 'SGD', baseAnnual: 95_000, weight: 5 },
  { code: 'BR', currency: 'BRL', baseAnnual: 180_000, weight: 5 },
  { code: 'JP', currency: 'JPY', baseAnnual: 8_000_000, weight: 4 },
];

/** USD per 1 major local unit, as of REFERENCE_DATE. Seeded, not fetched. */
export const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  BRL: 0.18,
  JPY: 0.0067,
};

export interface Department {
  name: string;
  /** Role noun used to build IC job titles. */
  role: string;
  /** Pay multiplier relative to the country anchor. */
  multiplier: number;
  weight: number;
}

export const DEPARTMENTS: Department[] = [
  { name: 'Engineering', role: 'Software Engineer', multiplier: 1.15, weight: 30 },
  { name: 'Product', role: 'Product Manager', multiplier: 1.15, weight: 8 },
  { name: 'Data', role: 'Data Scientist', multiplier: 1.15, weight: 8 },
  { name: 'Design', role: 'Product Designer', multiplier: 1.0, weight: 6 },
  { name: 'Sales', role: 'Account Executive', multiplier: 1.05, weight: 14 },
  { name: 'Marketing', role: 'Marketing Specialist', multiplier: 0.95, weight: 8 },
  { name: 'Finance', role: 'Financial Analyst', multiplier: 1.0, weight: 6 },
  { name: 'People', role: 'People Partner', multiplier: 0.9, weight: 5 },
  { name: 'Operations', role: 'Operations Analyst', multiplier: 0.9, weight: 8 },
  { name: 'Support', role: 'Support Specialist', multiplier: 0.8, weight: 5 },
  { name: 'Legal', role: 'Legal Counsel', multiplier: 1.1, weight: 2 },
];

export interface Level {
  code: string;
  /** Prefix for IC titles ("Senior" -> "Senior Software Engineer"). */
  titlePrefix: string;
  multiplier: number;
  weight: number;
  kind: 'ic' | 'management';
}

export const LEVELS: Level[] = [
  { code: 'L1', titlePrefix: 'Junior', multiplier: 0.7, weight: 18, kind: 'ic' },
  { code: 'L2', titlePrefix: '', multiplier: 0.9, weight: 26, kind: 'ic' },
  { code: 'L3', titlePrefix: 'Senior', multiplier: 1.15, weight: 25, kind: 'ic' },
  { code: 'L4', titlePrefix: 'Staff', multiplier: 1.5, weight: 13, kind: 'ic' },
  { code: 'L5', titlePrefix: 'Principal', multiplier: 1.9, weight: 5, kind: 'ic' },
  { code: 'M1', titlePrefix: 'Manager', multiplier: 1.6, weight: 7, kind: 'management' },
  { code: 'M2', titlePrefix: 'Director', multiplier: 2.3, weight: 5, kind: 'management' },
  { code: 'VP', titlePrefix: 'VP', multiplier: 3.2, weight: 1, kind: 'management' },
];

export function jobTitle(level: Level, department: Department): string {
  if (level.kind === 'management') {
    if (level.code === 'M1') return `${department.name} Manager`;
    if (level.code === 'M2') return `Director of ${department.name}`;
    return `VP of ${department.name}`;
  }
  return `${level.titlePrefix} ${department.role}`.trim();
}

/** Rounding step (local major units) so seeded salaries look human. */
export function salaryStep(currency: string): number {
  if (currency === 'JPY') return 100_000;
  if (currency === 'INR') return 25_000;
  if (currency === 'BRL') return 2_500;
  return 1_000;
}

export const FIRST_NAMES = [
  'Aarav', 'Priya', 'Wei', 'Sofia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Mateo', 'Yuki',
  'Ananya', 'Diego', 'Amara', 'Hiroshi', 'Ingrid', 'Rohan', 'Chloe', 'Omar', 'Fatima', 'Lucas',
  'Mei', 'Isabella', 'Arjun', 'Nadia', 'Sven', 'Leila', 'Kenji', 'Camila', 'Ethan', 'Zara',
  'Tomas', 'Aisha', 'Hana', 'Marco', 'Neha', 'Gabriel', 'Sara', 'Vikram', 'Elena', 'Kwame',
];

export const LAST_NAMES = [
  'Sharma', 'Chen', 'Garcia', 'Smith', 'Patel', 'Muller', 'Tanaka', 'Silva', 'Johnson', 'Kim',
  'Nguyen', 'Rossi', 'Okafor', 'Andersson', 'Reddy', 'Martin', 'Costa', 'Wang', 'Dubois', 'Hassan',
  'Ivanov', 'Lopez', 'Yamamoto', 'Brown', 'Fernandez', 'Kowalski', 'Mehta', 'Santos', 'Park', 'Weber',
];
