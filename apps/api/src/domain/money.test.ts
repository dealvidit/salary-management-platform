import { describe, expect, it } from 'vitest';
import { fromMinorUnits, normalizeToUsdMinor, toMinorUnits } from './money.js';

describe('minor units', () => {
  it('scales major units by the currency’s number of decimal places', () => {
    expect(toMinorUnits(1000, 'USD')).toBe(100_000); // $1,000.00 -> cents
    expect(toMinorUnits(1500.5, 'EUR')).toBe(150_050);
  });

  it('treats zero-decimal currencies (JPY) as having no minor unit', () => {
    // 8,000,000 JPY has no sub-unit — minor units equal the major amount.
    expect(toMinorUnits(8_000_000, 'JPY')).toBe(8_000_000);
  });

  it('round-trips major -> minor -> major', () => {
    expect(fromMinorUnits(toMinorUnits(2_000_000, 'INR'), 'INR')).toBe(2_000_000);
  });

  it('rejects currencies it has no decimal rule for', () => {
    expect(() => toMinorUnits(10, 'XYZ')).toThrow(/currency/i);
  });
});

describe('normalizeToUsdMinor', () => {
  it('is identity for USD at a rate of 1', () => {
    // $1,000.00 -> 100,000 USD cents.
    expect(normalizeToUsdMinor(100_000, 'USD', 1)).toBe(100_000);
  });

  it('converts a 2-decimal currency to USD cents', () => {
    // 2,000,000 INR (=200,000,000 paise) at 0.012 USD/INR = $24,000.00.
    expect(normalizeToUsdMinor(200_000_000, 'INR', 0.012)).toBe(2_400_000);
  });

  it('converts a 0-decimal currency to USD cents', () => {
    // 8,000,000 JPY at 0.0067 USD/JPY = $53,600.00.
    expect(normalizeToUsdMinor(8_000_000, 'JPY', 0.0067)).toBe(5_360_000);
  });

  it('rounds to the nearest USD cent', () => {
    // 100 units at 0.12345 USD/unit = $12.345 -> rounds to $12.35 (1,235 cents).
    expect(normalizeToUsdMinor(toMinorUnits(100, 'USD'), 'USD', 0.12345)).toBe(1235);
  });
});
