import { describe, expect, it } from 'vitest';
import { COUNTRIES, DEPARTMENTS, FX_RATES, jobTitle, LEVELS, salaryStep } from './reference.js';

describe('jobTitle', () => {
  const eng = DEPARTMENTS.find((d) => d.name === 'Engineering')!;

  it('prefixes IC titles with the level (senior, staff…)', () => {
    const senior = LEVELS.find((l) => l.code === 'L3')!;
    expect(jobTitle(senior, eng)).toBe('Senior Software Engineer');
  });

  it('omits an empty prefix for the baseline IC level', () => {
    const mid = LEVELS.find((l) => l.code === 'L2')!;
    expect(jobTitle(mid, eng)).toBe('Software Engineer');
  });

  it('names management levels after the department', () => {
    expect(
      jobTitle(
        LEVELS.find((l) => l.code === 'M1')!,
        eng,
      ),
    ).toBe('Engineering Manager');
    expect(
      jobTitle(
        LEVELS.find((l) => l.code === 'M2')!,
        eng,
      ),
    ).toBe('Director of Engineering');
    expect(
      jobTitle(
        LEVELS.find((l) => l.code === 'VP')!,
        eng,
      ),
    ).toBe('VP of Engineering');
  });
});

describe('salaryStep', () => {
  it('uses currency-appropriate rounding steps', () => {
    expect(salaryStep('JPY')).toBe(100_000);
    expect(salaryStep('INR')).toBe(25_000);
    expect(salaryStep('BRL')).toBe(2_500);
    expect(salaryStep('USD')).toBe(1_000);
  });
});

describe('reference data integrity', () => {
  it('has an FX rate for every country currency', () => {
    for (const country of COUNTRIES) {
      expect(FX_RATES[country.currency], `missing rate for ${country.currency}`).toBeDefined();
    }
  });
});
