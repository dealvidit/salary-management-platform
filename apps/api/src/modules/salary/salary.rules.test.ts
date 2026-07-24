import { describe, expect, it } from 'vitest';
import { assertValidEffectiveDate, SalaryUpdateError } from './salary.rules.js';

const currentEffective = new Date('2024-01-01T00:00:00.000Z');
const now = new Date('2026-07-01T00:00:00.000Z');

describe('assertValidEffectiveDate', () => {
  it('accepts a date between the current effective date and now', () => {
    expect(() =>
      assertValidEffectiveDate(new Date('2025-06-01'), currentEffective, now),
    ).not.toThrow();
  });

  it('accepts the boundaries (equal to current effective, equal to now)', () => {
    expect(() => assertValidEffectiveDate(currentEffective, currentEffective, now)).not.toThrow();
    expect(() => assertValidEffectiveDate(now, currentEffective, now)).not.toThrow();
  });

  it('rejects a future effective date', () => {
    // Our current-salary projection assumes the newest revision is in effect, so
    // future-dating (scheduled raises) is deliberately out of scope.
    expect(() => assertValidEffectiveDate(new Date('2026-08-01'), currentEffective, now)).toThrow(
      SalaryUpdateError,
    );
  });

  it('rejects an effective date before the current salary took effect', () => {
    expect(() => assertValidEffectiveDate(new Date('2023-01-01'), currentEffective, now)).toThrow(
      /on or after/i,
    );
  });
});
