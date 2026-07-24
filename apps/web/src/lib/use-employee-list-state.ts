import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ListEmployeesParams } from './types';
import { useDebouncedValue } from './use-debounced-value';

export const EMPLOYEE_PAGE_SIZE = 25;

export type SortField = NonNullable<ListEmployeesParams['sort']>;
export type SortOrder = NonNullable<ListEmployeesParams['order']>;

export interface EmployeeFilters {
  department: string;
  country: string;
  level: string;
}

const EMPTY_FILTERS: EmployeeFilters = { department: '', country: '', level: '' };

export interface EmployeeListState {
  search: string;
  setSearch: (value: string) => void;
  filters: EmployeeFilters;
  setFilter: (key: keyof EmployeeFilters, value: string) => void;
  sort: { field: SortField; order: SortOrder };
  toggleSort: (field: SortField) => void;
  page: number;
  setPage: (page: number) => void;
  hasFilters: boolean;
  clearAll: () => void;
  /** Ready-to-query params derived from the state above. */
  params: ListEmployeesParams;
}

/**
 * All of the employee list's view state — search (debounced), filters, sort and
 * pagination — in one place, so the page component stays about layout. Changing
 * what we're looking at always returns to the first page.
 */
export function useEmployeeListState(): EmployeeListState {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [filters, setFilters] = useState<EmployeeFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ field: SortField; order: SortOrder }>({
    field: 'name',
    order: 'asc',
  });
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [debouncedSearch, filters, sort]);

  const setFilter = useCallback((key: keyof EmployeeFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    setSort((current) =>
      current.field === field
        ? { field, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field, order: field === 'salary' ? 'desc' : 'asc' },
    );
  }, []);

  const clearAll = useCallback(() => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  }, []);

  const hasFilters =
    search !== '' || filters.department !== '' || filters.country !== '' || filters.level !== '';

  const params = useMemo<ListEmployeesParams>(
    () => ({
      page,
      pageSize: EMPLOYEE_PAGE_SIZE,
      search: debouncedSearch || undefined,
      department: filters.department || undefined,
      country: filters.country || undefined,
      level: filters.level || undefined,
      sort: sort.field,
      order: sort.order,
    }),
    [page, debouncedSearch, filters, sort],
  );

  return {
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    toggleSort,
    page,
    setPage,
    hasFilters,
    clearAll,
    params,
  };
}
