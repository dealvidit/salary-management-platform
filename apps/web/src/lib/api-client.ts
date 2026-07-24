import type {
  CreateRevisionInput,
  DashboardSummary,
  EmployeeDetail,
  EmployeeSummary,
  ListEmployeesParams,
  Meta,
  Paginated,
  PayBreakdown,
} from './types';

// In dev, Vite proxies /api to the backend; in prod the base is set at build.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** An API call that came back non-2xx, carrying the server's message if any. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Is the API running?');
  }

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => body?.message ?? response.statusText)
      .catch(() => response.statusText);
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api = {
  listEmployees(params: ListEmployeesParams): Promise<Paginated<EmployeeSummary>> {
    return request(`/employees${queryString({ ...params })}`);
  },

  getEmployee(id: number): Promise<{ data: EmployeeDetail }> {
    return request(`/employees/${id}`);
  },

  updateSalary(id: number, body: CreateRevisionInput): Promise<{ data: EmployeeDetail }> {
    return request(`/employees/${id}/salary-revisions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getSummary(): Promise<{ data: DashboardSummary }> {
    return request('/insights/summary');
  },

  getPayBreakdown(): Promise<{ data: PayBreakdown }> {
    return request('/insights/pay');
  },

  getMeta(): Promise<{ data: Meta }> {
    return request('/meta');
  },
};
