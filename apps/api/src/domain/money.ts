// Money is stored and computed in integer minor units (cents, paise, yen) so
// sums are exact. The number of minor digits varies by currency; this map is
// static ISO-4217 reference data, not application state.
export const CURRENCY_MINOR_DIGITS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CAD: 2,
  AUD: 2,
  SGD: 2,
  BRL: 2,
  JPY: 0,
};

const USD_MINOR_DIGITS = 2;

export function minorDigits(currency: string): number {
  const digits = CURRENCY_MINOR_DIGITS[currency];
  if (digits === undefined) throw new Error(`Unknown currency: ${currency}`);
  return digits;
}

export function toMinorUnits(major: number, currency: string): number {
  return Math.round(major * 10 ** minorDigits(currency));
}

export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** minorDigits(currency);
}

/**
 * Convert a local amount (in minor units) to USD minor units (cents).
 *
 * `usdPerUnit` is the value of one *major* local unit in USD (e.g. 0.012 for
 * INR). We multiply the integer minor amount first and divide by the currency's
 * scale last, then round once — this keeps floating-point error away from the
 * rounding boundary far better than converting to major units up front.
 */
export function normalizeToUsdMinor(
  localMinor: number,
  currency: string,
  usdPerUnit: number,
): number {
  const scale = 10 ** (USD_MINOR_DIGITS - minorDigits(currency));
  return Math.round(localMinor * usdPerUnit * scale);
}
