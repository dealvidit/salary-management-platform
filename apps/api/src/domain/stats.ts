// Distribution statistics over salary values (USD minor units). SQLite has no
// median/percentile, and 10k integers are cheap to pull, so we compute these in
// application code where they're easy to read and test. All inputs and outputs
// are integer minor units; percentiles are rounded to whole cents.

export interface Summary {
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  p90: number | null;
}

/**
 * Linear-interpolation percentile (the "R-7" method NumPy and Excel use).
 * Expects a non-empty array; callers guard empties via `summarize`.
 */
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return percentileOfSorted(sorted, p);
}

function percentileOfSorted(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low]!;
  const weight = rank - low;
  return Math.round(sorted[low]! + weight * (sorted[high]! - sorted[low]!));
}

export function summarize(values: number[]): Summary {
  if (values.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      p25: null,
      p75: null,
      p90: null,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);

  return {
    count: sorted.length,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    mean: Math.round(sum / sorted.length),
    median: percentileOfSorted(sorted, 50),
    p25: percentileOfSorted(sorted, 25),
    p75: percentileOfSorted(sorted, 75),
    p90: percentileOfSorted(sorted, 90),
  };
}
