import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from '@/app/query-client';
import { api } from './api-client';
import {
  useDashboardSummary,
  useEmployee,
  useEmployees,
  useMeta,
  usePayBreakdown,
  useUpdateSalary,
} from './queries';

vi.mock('./api-client', () => ({
  api: {
    listEmployees: vi.fn(),
    getEmployee: vi.fn(),
    getMeta: vi.fn(),
    getSummary: vi.fn(),
    getPayBreakdown: vi.fn(),
    updateSalary: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => vi.clearAllMocks());

describe('read hooks', () => {
  it('shares a preconfigured query client', () => {
    expect(queryClient).toBeDefined();
  });

  it('useEmployees returns the paginated list', async () => {
    mockedApi.listEmployees.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEmployees({ page: 1 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.listEmployees).toHaveBeenCalledWith({ page: 1 });
  });

  it('useEmployee, useMeta, summary and pay unwrap the data envelope', async () => {
    mockedApi.getEmployee.mockResolvedValue({ data: { id: 1 } } as never);
    mockedApi.getMeta.mockResolvedValue({
      data: { departments: ['Eng'], levels: [], countries: [] },
    });
    mockedApi.getSummary.mockResolvedValue({ data: { headcount: 5 } } as never);
    mockedApi.getPayBreakdown.mockResolvedValue({ data: { byDepartment: [] } } as never);
    const { wrapper } = makeWrapper();

    const employee = renderHook(() => useEmployee(1), { wrapper });
    const meta = renderHook(() => useMeta(), { wrapper });
    const summary = renderHook(() => useDashboardSummary(), { wrapper });
    const pay = renderHook(() => usePayBreakdown(), { wrapper });

    await waitFor(() => expect(employee.result.current.data).toEqual({ id: 1 }));
    await waitFor(() => expect(meta.result.current.data?.departments).toEqual(['Eng']));
    await waitFor(() => expect(summary.result.current.data).toEqual({ headcount: 5 }));
    await waitFor(() => expect(pay.result.current.data).toEqual({ byDepartment: [] }));
  });
});

describe('useUpdateSalary', () => {
  it('calls the API and invalidates the affected caches on success', async () => {
    mockedApi.updateSalary.mockResolvedValue({ data: {} } as never);
    const { client, wrapper } = makeWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSalary(42), { wrapper });
    await result.current.mutateAsync({
      amountMinor: 100,
      effectiveOn: '2025-01-01',
      reason: 'Raise',
    });

    expect(mockedApi.updateSalary).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ amountMinor: 100 }),
    );
    expect(invalidate).toHaveBeenCalledTimes(3);
  });
});
