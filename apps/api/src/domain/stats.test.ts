import { describe, expect, it } from 'vitest';
import { percentile, summarize } from './stats.js';

describe('summarize', () => {
  it('reports nothing but a zero count for an empty group', () => {
    expect(summarize([])).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      p25: null,
      p75: null,
      p90: null,
    });
  });

  it('handles a single value (every statistic is that value)', () => {
    const s = summarize([4200]);
    expect(s).toMatchObject({ count: 1, min: 4200, max: 4200, mean: 4200, median: 4200 });
  });

  it('takes the middle value as the median for an odd count', () => {
    expect(summarize([10, 30, 20]).median).toBe(20);
  });

  it('averages the two middle values as the median for an even count', () => {
    expect(summarize([10, 20, 30, 40]).median).toBe(25);
  });

  it('computes count, min, max and mean regardless of input order', () => {
    const s = summarize([30, 10, 50, 20, 40]);
    expect(s).toMatchObject({ count: 5, min: 10, max: 50, mean: 30 });
  });

  it('rounds the mean to a whole minor unit', () => {
    // (10 + 20 + 25) / 3 = 18.33… -> 18 cents
    expect(summarize([10, 20, 25]).mean).toBe(18);
  });
});

describe('percentile', () => {
  const values = [0, 25, 50, 75, 100];

  it('interpolates between ranks', () => {
    expect(percentile(values, 25)).toBe(25);
    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 75)).toBe(75);
    expect(percentile(values, 90)).toBe(90);
  });

  it('returns the bounds at the extremes', () => {
    expect(percentile(values, 0)).toBe(0);
    expect(percentile(values, 100)).toBe(100);
  });

  it('is order-independent', () => {
    expect(percentile([100, 0, 50, 25, 75], 50)).toBe(50);
  });
});
