import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePayBreakdown } from '@/lib/queries';
import type { GroupStat, PayBreakdown } from '@/lib/types';
import { InsightsPage } from './InsightsPage';

vi.mock('@/lib/queries', () => ({ usePayBreakdown: vi.fn() }));
const mocked = vi.mocked(usePayBreakdown);

function group(key: string, median: number): GroupStat {
  return {
    key,
    headcount: 2,
    totalUsdMinor: median * 2,
    meanUsdMinor: median,
    medianUsdMinor: median,
    minUsdMinor: median - 1_000_000,
    maxUsdMinor: median + 1_000_000,
  };
}

const breakdown: PayBreakdown = {
  distribution: {
    count: 3,
    min: 5_000_000,
    max: 9_000_000,
    mean: 7_000_000,
    median: 7_000_000,
    p25: 5_500_000,
    p75: 8_500_000,
    p90: null, // exercises the "—" fallback
    histogram: [
      { fromUsdMinor: 5_000_000, toUsdMinor: 7_000_000, count: 1 },
      { fromUsdMinor: 7_000_000, toUsdMinor: 9_000_000, count: 2 },
    ],
  },
  byDepartment: [group('Engineering', 12_000_000), group('Finance', 8_000_000)],
  byLevel: [group('L3', 11_000_000), group('L1', 6_000_000)],
  byCountry: [group('US', 12_000_000)],
  normalizedTo: 'USD',
  asOf: '2026-07-01T00:00:00.000Z',
};

function mockState(state: Record<string, unknown>) {
  mocked.mockReturnValue(state as unknown as ReturnType<typeof usePayBreakdown>);
}

beforeEach(() => vi.clearAllMocks());

describe('InsightsPage', () => {
  it('renders a loading skeleton', () => {
    mockState({ isLoading: true, isError: false });
    render(<InsightsPage />);
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.queryByText('Pay distribution')).not.toBeInTheDocument();
  });

  it('shows a retryable error', async () => {
    const refetch = vi.fn();
    mockState({ isError: true, isLoading: false, refetch });
    render(<InsightsPage />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the distribution stats, breakdowns and level bands', () => {
    mockState({ isLoading: false, isError: false, data: breakdown });
    render(<InsightsPage />);

    expect(screen.getByText('Pay distribution')).toBeInTheDocument();
    expect(screen.getByText('Median pay by department')).toBeInTheDocument();
    expect(screen.getByText('Median pay by country')).toBeInTheDocument();
    expect(screen.getByText('Pay bands by level')).toBeInTheDocument();

    // Stat strip: the middle-50% range rendered, and the null p90 falls back to a dash.
    expect(screen.getByText('$55,000.00 – $85,000.00')).toBeInTheDocument();
    expect(screen.getByText('90th percentile').parentElement).toHaveTextContent('—');

    // Level bands ordered junior -> senior, with a spread multiple.
    const rowHeaders = screen.getAllByRole('cell').map((c) => c.textContent);
    expect(rowHeaders).toContain('L1');
    expect(screen.getAllByText(/×$/).length).toBeGreaterThan(0);
    expect(screen.getByText(/rates as of/i)).toBeInTheDocument();
  });
});
