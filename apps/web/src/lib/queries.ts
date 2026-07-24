import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';
import type { CreateRevisionInput, ListEmployeesParams } from './types';

// One place for all server-state hooks. Query keys are structured so a salary
// update can precisely invalidate the affected employee plus the aggregates.
export const keys = {
  employees: (params: ListEmployeesParams) => ['employees', params] as const,
  employee: (id: number) => ['employee', id] as const,
  meta: ['meta'] as const,
  summary: ['insights', 'summary'] as const,
  payBreakdown: ['insights', 'pay'] as const,
};

export function useEmployees(params: ListEmployeesParams) {
  return useQuery({
    queryKey: keys.employees(params),
    queryFn: () => api.listEmployees(params),
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: keys.employee(id),
    queryFn: () => api.getEmployee(id).then((r) => r.data),
  });
}

export function useMeta() {
  return useQuery({
    queryKey: keys.meta,
    queryFn: () => api.getMeta().then((r) => r.data),
    staleTime: 5 * 60_000, // filter options barely change
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: keys.summary,
    queryFn: () => api.getSummary().then((r) => r.data),
  });
}

export function usePayBreakdown() {
  return useQuery({
    queryKey: keys.payBreakdown,
    queryFn: () => api.getPayBreakdown().then((r) => r.data),
  });
}

export function useUpdateSalary(employeeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRevisionInput) => api.updateSalary(employeeId, input),
    onSuccess: () => {
      // The change moves current salary and every aggregate, so refresh them.
      queryClient.invalidateQueries({ queryKey: keys.employee(employeeId) });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
