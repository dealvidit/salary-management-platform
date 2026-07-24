import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { useEmployee } from '@/lib/queries';
import type { EmployeeDetail } from '@/lib/types';
import { EmployeeDetailPage } from './EmployeeDetailPage';

vi.mock('@/lib/queries', () => ({ useEmployee: vi.fn() }));
const mocked = vi.mocked(useEmployee);

const base: EmployeeDetail = {
  id: 1,
  employeeNumber: 'EMP00001',
  firstName: 'Amara',
  lastName: 'Andersson',
  department: 'Finance',
  level: 'L2',
  jobTitle: 'Financial Analyst',
  country: 'CA',
  currency: 'CAD',
  email: 'amara.andersson@acme.example',
  hireDate: '2024-02-20T00:00:00.000Z',
  currentSalary: {
    amountMinor: 9_000_000,
    usdMinor: 6_570_000,
    effectiveOn: '2026-01-08T00:00:00.000Z',
  },
  salaryHistory: [
    {
      id: 3,
      amountMinor: 9_000_000,
      currency: 'CAD',
      effectiveOn: '2026-01-08T00:00:00.000Z',
      reason: 'Promotion',
      recordedAt: '2026-01-08T00:00:00.000Z',
    },
    {
      id: 1,
      amountMinor: 7_800_000,
      currency: 'CAD',
      effectiveOn: '2024-02-20T00:00:00.000Z',
      reason: 'Initial salary',
      recordedAt: '2024-02-20T00:00:00.000Z',
    },
  ],
};

function mockState(state: Record<string, unknown>) {
  mocked.mockReturnValue(state as unknown as ReturnType<typeof useEmployee>);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <EmployeeDetailPage />
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('EmployeeDetailPage', () => {
  it('renders a loading skeleton', () => {
    mockState({ isLoading: true, isError: false });
    renderPage();
    expect(screen.getByText(/back to employees/i)).toBeInTheDocument();
    expect(screen.queryByText('Salary history')).not.toBeInTheDocument();
  });

  it('shows a friendly message for a 404', () => {
    mockState({ isError: true, isLoading: false, error: new ApiError(404, 'gone') });
    renderPage();
    expect(screen.getByText(/doesn’t exist/i)).toBeInTheDocument();
  });

  it('shows a retryable error for other failures', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, isLoading: false, error: new Error('boom'), refetch });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders details, history and an increase indicator', () => {
    mockState({ isLoading: false, isError: false, data: base });
    renderPage();
    expect(screen.getByRole('heading', { name: 'Amara Andersson' })).toBeInTheDocument();
    expect(screen.getByText('Salary history')).toBeInTheDocument();
    expect(screen.getByText(/CA\$12,000\.00/)).toBeInTheDocument(); // delta 9,000,000 - 7,800,000
    expect(screen.getByRole('link', { name: /update salary/i })).toHaveAttribute(
      'href',
      '/employees/1/salary',
    );
  });

  it('renders a decrease indicator when pay dropped', () => {
    mockState({
      isLoading: false,
      isError: false,
      data: {
        ...base,
        salaryHistory: [
          {
            id: 2,
            amountMinor: 8_000_000,
            currency: 'CAD',
            effectiveOn: '2026-01-08T00:00:00.000Z',
            reason: 'Correction',
            recordedAt: '2026-01-08T00:00:00.000Z',
          },
          {
            id: 1,
            amountMinor: 9_000_000,
            currency: 'CAD',
            effectiveOn: '2024-02-20T00:00:00.000Z',
            reason: 'Initial salary',
            recordedAt: '2024-02-20T00:00:00.000Z',
          },
        ],
      },
    });
    renderPage();
    expect(screen.getByText(/CA\$10,000\.00/)).toBeInTheDocument(); // delta 8,000,000 - 9,000,000
  });
});
