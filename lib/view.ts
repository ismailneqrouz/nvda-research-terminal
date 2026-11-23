import type { Analytics } from './finance/metrics';
import { ANNUAL_KEYS } from './data/financials';
import type { Quarter } from './data/schema';

/** Shape analytics into chart rows (server-side). */
export function annualRows(a: Analytics, fields: Record<string, (p: (typeof ANNUAL_KEYS)[number] | 'TTM') => number | null>, includeTtm = true) {
  const keys = includeTtm ? [...ANNUAL_KEYS, 'TTM' as const] : [...ANNUAL_KEYS];
  return keys.map((k) => {
    const row: Record<string, string | number | null> = { label: k === 'TTM' ? 'TTM Q3 FY27' : k };
    for (const [name, fn] of Object.entries(fields)) row[name] = fn(k);
    return row;
  });
}

export function quarterRows(quarters: Quarter[], fields: Record<string, (q: Quarter) => number | null>) {
  return quarters.map((q) => {
    const row: Record<string, string | number | null> = { label: q.label };
    for (const [name, fn] of Object.entries(fields)) row[name] = fn(q);
    return row;
  });
}

export const QUARTER_NOTE = 'Quarterly series: Q3 FY25–Q2 FY27 from StockAnalysis (sourced from NVIDIA filings); Q3 FY26–Q3 FY27 cross-checked to NVIDIA releases. FCF calculated as OCF − capex.';
export const TTM_NOTE = 'TTM = Q4 FY2026 + Q1–Q3 FY2027 (calculated). Fiscal years end late January.';
