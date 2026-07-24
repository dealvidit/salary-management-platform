import { describe, expect, it } from 'vitest';
import { formatMoney, majorToMinor, minorToMajor } from './format';

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
