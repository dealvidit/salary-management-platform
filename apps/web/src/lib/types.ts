// Shapes returned by the API. Deliberately hand-written rather than shared from
// the backend via a package: the surface is small and stable, and a mirrored
// type here keeps the frontend build independent. See docs/tradeoffs.md.

export interface Money {
  amountMinor: number;
  usdMinor: number;
  effectiveOn: string;
}

export interface EmployeeSummary {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  level: string;
  jobTitle: string;
  country: string;
  currency: string;
  currentSalary: Money;
}

export interface SalaryHistoryEntry {
  id: number;
  amountMinor: number;
  currency: string;
  effectiveOn: string;
  reason: string;
  recordedAt: string;
}

export interface EmployeeDetail extends EmployeeSummary {
  email: string;
  hireDate: string;
  salaryHistory: SalaryHistoryEntry[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DashboardSummary {
  headcount: number;
  totalPayrollUsdMinor: number;
  meanUsdMinor: number | null;
  medianUsdMinor: number | null;
  countryCount: number;
  mostExpensiveDepartment: { department: string; totalUsdMinor: number } | null;
  recentChangeCount: number;
  recentWindowDays: number;
  normalizedTo: string;
  asOf: string | null;
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

export interface Distribution {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
  histogram: { fromUsdMinor: number; toUsdMinor: number; count: number }[];
}

export interface PayBreakdown {
  distribution: Distribution;
  byDepartment: GroupStat[];
  byLevel: GroupStat[];
  byCountry: GroupStat[];
  normalizedTo: string;
  asOf: string | null;
}

export interface Meta {
  departments: string[];
  levels: string[];
  countries: string[];
}

export interface ListEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  country?: string;
  level?: string;
  sort?: 'name' | 'salary' | 'hireDate';
  order?: 'asc' | 'desc';
}

export interface CreateRevisionInput {
  amountMinor: number;
  effectiveOn: string;
  reason: string;
}
