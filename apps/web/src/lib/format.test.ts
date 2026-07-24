import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatMoney,
  formatUsd,
  formatUsdCompact,
  majorToMinor,
  minorToMajor,
} from './format';

describe('minor/major conversion', () => {
  it('uses two decimals for USD', () => {
    expect(minorToMajor(150_000, 'USD')).toBe(1500);
    expect(majorToMinor(1500, 'USD')).toBe(150_000);
  });

  it('uses no decimals for JPY', () => {
    expect(majorToMinor(8_000_000, 'JPY')).toBe(8_000_000);
    expect(minorToMajor(8_000_000, 'JPY')).toBe(8_000_000);
  });
});

describe('formatMoney', () => {
  it('formats in the given currency', () => {
    expect(formatMoney(150_000, 'USD')).toBe('$1,500.00');
    // Zero-decimal currency renders without a fractional part.
    expect(formatMoney(8_000_000, 'JPY')).toBe('¥8,000,000');
  });
});

describe('formatUsd', () => {
  it('formats USD minor units as dollars', () => {
    expect(formatUsd(12_345_600)).toBe('$123,456.00');
  });
});

describe('formatUsdCompact', () => {
  it('abbreviates large totals', () => {
    expect(formatUsdCompact(85_328_774_000)).toBe('$853.3M');
    // Whether the trailing ".0" shows depends on the runtime's ICU version, so
    // accept both "$15K" and "$15.0K".
    expect(formatUsdCompact(1_500_000)).toMatch(/^\$15(\.0)?K$/);
  });
});

describe('formatDate', () => {
  it('renders an ISO date as a readable day', () => {
    expect(formatDate('2026-07-01T00:00:00.000Z')).toMatch(/Jul .*2026/);
  });
});
