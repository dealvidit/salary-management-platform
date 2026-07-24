// Presentation helpers for money and dates. Money crosses the wire as integer
// minor units; the UI converts to major units using the currency's own decimal
// rules (via Intl) so we never hard-code "cents" and get JPY/INR right for free.

function fractionDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function minorToMajor(minor: number, currency: string): number {
  return minor / 10 ** fractionDigits(currency);
}

export function majorToMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** fractionDigits(currency));
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(
    minorToMajor(minor, currency),
  );
}

export function formatUsd(usdMinor: number): string {
  return formatMoney(usdMinor, 'USD');
}

/** Compact form for large totals, e.g. "$853.3M". */
export function formatUsdCompact(usdMinor: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(usdMinor / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
