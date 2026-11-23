/** Display formatting. Inputs in USD millions unless noted. */

export const UNAVAILABLE = 'Data unavailable';

export function cn(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

/** $ millions → compact ($115.8B, $1.2T, $950M). */
export function usdM(v: number | null | undefined, opts: { digits?: number; sign?: boolean } = {}): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  const d = opts.digits ?? 1;
  const a = Math.abs(v);
  const s = v < 0 ? '−' : opts.sign && v > 0 ? '+' : '';
  if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(d + 1)}T`;
  if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(d)}B`;
  return `${s}$${a.toFixed(0)}M`;
}

/** Full millions with thousands separators, negatives in parentheses (statement style). */
export function millions(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  const r = Math.round(v).toLocaleString('en-US');
  return v < 0 ? `(${r.replace('-', '')})` : r;
}

export function pct(v: number | null | undefined, digits = 1, sign = false): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  const s = sign && v > 0 ? '+' : v < 0 ? '−' : '';
  return `${s}${Math.abs(v * 100).toFixed(digits)}%`;
}

export function mult(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  return `${v.toFixed(digits)}×`;
}

export function usd(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  return `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(digits)}`;
}

export function num(v: number | null | undefined, digits = 0): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function days(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return UNAVAILABLE;
  return `${v.toFixed(0)} d`;
}

export function date(iso: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString('en-US', style === 'short' ? { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' } : { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function isUnavailable(s: string) {
  return s === UNAVAILABLE;
}
