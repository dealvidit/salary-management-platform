import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardSummary } from '@/lib/queries';
import type { DashboardSummary } from '@/lib/types';
import { DashboardPage } from './DashboardPage';

vi.mock('@/lib/queries', () => ({ useDashboardSummary: vi.fn() }));
const mocked = vi.mocked(useDashboardSummary);

const summary: DashboardSummary = {
  headcount: 10_000,
  totalPayrollUsdMinor: 85_328_774_000,
  meanUsdMinor: 8_532_877,
  medianUsdMinor: 7_239_000,
  countryCount: 9,
  mostExpensiveDepartment: { department: 'Engineering', totalUsdMinor: 300_000_000 },
  recentChangeCount: 102,
  recentWindowDays: 30,
  normalizedTo: 'USD',
  asOf: '2026-07-01T00:00:00.000Z',
};

function mockState(state: Record<string, unknown>) {
  mocked.mockReturnValue(state as unknown as ReturnType<typeof useDashboardSummary>);
}

beforeEach(() => vi.clearAllMocks());

describe('DashboardPage', () => {
  it('shows an error state with a working retry', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, isLoading: false, refetch });
    render(<DashboardPage />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the loading skeleton without card content', () => {
    mockState({ isLoading: true, isError: false });
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Total annual payroll')).not.toBeInTheDocument();
  });

  it('renders the numbers, and the cards are not clickable', () => {
    mockState({ isLoading: false, isError: false, data: summary });
    render(<DashboardPage />);

    expect(screen.getByText('Total annual payroll')).toBeInTheDocument();
    expect(screen.getByText('10,000')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText(/exchange rates as of/i)).toBeInTheDocument();
    // No card is a link.
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('handles a null most-expensive department', () => {
    mockState({
      isLoading: false,
      isError: false,
      data: { ...summary, mostExpensiveDepartment: null },
    });
    render(<DashboardPage />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });
});
