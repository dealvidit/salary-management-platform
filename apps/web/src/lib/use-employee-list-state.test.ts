import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMPLOYEE_PAGE_SIZE, useEmployeeListState } from './use-employee-list-state';

describe('useEmployeeListState', () => {
  it('starts on page 1 with default sort and no filters', () => {
    const { result } = renderHook(() => useEmployeeListState());
    expect(result.current.params).toMatchObject({
      page: 1,
      pageSize: EMPLOYEE_PAGE_SIZE,
      sort: 'name',
      order: 'asc',
    });
    expect(result.current.hasFilters).toBe(false);
  });

  it('toggles sort order on the same field and resets order when switching fields', () => {
    const { result } = renderHook(() => useEmployeeListState());

    act(() => result.current.toggleSort('name'));
    expect(result.current.sort).toEqual({ field: 'name', order: 'desc' });

    act(() => result.current.toggleSort('salary'));
    // Switching to salary defaults to descending (highest first).
    expect(result.current.sort).toEqual({ field: 'salary', order: 'desc' });
  });

  it('sets a filter, marks filters active, and returns to page 1', async () => {
    const { result } = renderHook(() => useEmployeeListState());

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setFilter('department', 'Engineering'));
    expect(result.current.hasFilters).toBe(true);
    expect(result.current.params.department).toBe('Engineering');
    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it('clears search and filters', () => {
    const { result } = renderHook(() => useEmployeeListState());
    act(() => {
      result.current.setSearch('ada');
      result.current.setFilter('country', 'US');
    });
    expect(result.current.hasFilters).toBe(true);

    act(() => result.current.clearAll());
    expect(result.current.search).toBe('');
    expect(result.current.filters).toEqual({ department: '', country: '', level: '' });
  });
});
