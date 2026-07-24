import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEmployees, useMeta } from '@/lib/queries';
import type { EmployeeSummary, Meta, Paginated } from '@/lib/types';
import { EmployeesPage } from './EmployeesPage';

vi.mock('@/lib/queries', () => ({ useEmployees: vi.fn(), useMeta: vi.fn() }));
const mockedEmployees = vi.mocked(useEmployees);
const mockedMeta = vi.mocked(useMeta);

const rows: EmployeeSummary[] = [
  {
    id: 1,
    employeeNumber: 'EMP00001',
    firstName: 'Amara',
    lastName: 'Andersson',
    department: 'Finance',
    level: 'L2',
    jobTitle: 'Financial Analyst',
    country: 'IN',
    currency: 'INR',
    currentSalary: {
      amountMinor: 200_000_000,
      usdMinor: 2_400_000,
      effectiveOn: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 2,
    employeeNumber: 'EMP00002',
    firstName: 'John',
    lastName: 'Doe',
    department: 'Engineering',
    level: 'L3',
    jobTitle: 'Senior Software Engineer',
    country: 'US',
    currency: 'USD',
    currentSalary: {
      amountMinor: 12_000_000,
      usdMinor: 12_000_000,
      effectiveOn: '2026-01-01T00:00:00.000Z',
    },
  },
];

const meta: Meta = {
  departments: ['Engineering', 'Finance'],
  countries: ['IN', 'US'],
  levels: ['L2', 'L3'],
};

function page(overrides: Partial<Paginated<EmployeeSummary>> = {}): Paginated<EmployeeSummary> {
  return { data: rows, page: 1, pageSize: 25, total: 60, totalPages: 3, ...overrides };
}

function mockEmployees(state: Record<string, unknown>) {
  mockedEmployees.mockReturnValue(state as unknown as ReturnType<typeof useEmployees>);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedMeta.mockReturnValue({ data: meta } as unknown as ReturnType<typeof useMeta>);
});

describe('EmployeesPage', () => {
  it('shows a loading state before data arrives', () => {
    mockEmployees({ isLoading: true, isError: false, data: undefined });
    renderPage();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows a retryable error', async () => {
    const refetch = vi.fn();
    mockEmployees({ isLoading: false, isError: true, refetch });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows an empty state when nothing matches', () => {
    mockEmployees({ isLoading: false, isError: false, data: page({ data: [], total: 0 }) });
    renderPage();
    expect(screen.getByText('No matching employees')).toBeInTheDocument();
  });

  it('renders rows with normalized pay and paginates', async () => {
    mockEmployees({ isLoading: false, isError: false, data: page() });
    renderPage();

    expect(screen.getByRole('link', { name: 'Amara Andersson' })).toBeInTheDocument();
    expect(screen.getByText('₹2,000,000.00')).toBeInTheDocument(); // local INR
    expect(screen.getByText('$24,000.00')).toBeInTheDocument(); // normalized USD shown for non-USD
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–25 of 60');

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('toggles sort when a sortable header is clicked', async () => {
    mockEmployees({ isLoading: false, isError: false, data: page() });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /current salary/i }));
    expect(screen.getByRole('columnheader', { name: /current salary/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('reveals a clear-all control once searching', async () => {
    mockEmployees({ isLoading: false, isError: false, data: page() });
    renderPage();
    await userEvent.type(screen.getByRole('searchbox'), 'ada');
    const clear = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clear);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('lets a filter dropdown be set and inline-cleared', async () => {
    mockEmployees({ isLoading: false, isError: false, data: page() });
    renderPage();
    await userEvent.selectOptions(screen.getByLabelText(/filter by department/i), 'Engineering');
    const clear = screen.getByLabelText('Clear selection');
    await userEvent.click(clear);
    expect(screen.queryByLabelText('Clear selection')).not.toBeInTheDocument();
  });
});
