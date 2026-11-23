/**
 * Unlevered free-cash-flow DCF model. Every input is an explicit assumption;
 * outputs are model estimates, never facts.
 *
 * Revenue path:
 *   year 1          : g1
 *   years 2–3       : g2
 *   years 4–5       : g3
 *   years 6..N      : linear fade from g3 to the terminal growth rate
 * Operating margin moves linearly from `startMargin` to `targetMargin` over
 * `marginYears`, then stays flat.
 * FCFF = EBIT × (1 − tax) + D&A − capex − ΔNWC
 */

export interface DcfInputs {
  baseRevenue: number; // USD m, year-0 revenue
  g1: number;
  g2: number;
  g3: number;
  terminalGrowth: number;
  years: number; // explicit forecast horizon (≥ 6)
  startMargin: number;
  targetMargin: number;
  marginYears: number;
  taxRate: number;
  daPct: number; // D&A as % of revenue
  capexPct: number; // capex as % of revenue
  nwcPct: number; // incremental net working capital as % of incremental revenue
  wacc: number;
  cash: number; // cash + liquid marketable securities, USD m
  nonOperatingAssets: number; // e.g. non-marketable investments, USD m
  debt: number; // total debt, USD m
  dilutedShares: number; // millions
  midYear: boolean;
}

export interface DcfYear {
  year: number;
  growth: number;
  revenue: number;
  margin: number;
  ebit: number;
  nopat: number;
  da: number;
  capex: number;
  deltaNwc: number;
  fcff: number;
  discountFactor: number;
  pv: number;
}

export interface DcfResult {
  years: DcfYear[];
  sumPv: number;
  terminalValue: number;
  pvTerminal: number;
  enterpriseValue: number;
  equityValue: number;
  perShare: number;
  terminalShareOfEv: number;
  impliedExitEvEbit: number;
}

export class DcfError extends Error {}

export function growthPath(i: { g1: number; g2: number; g3: number; terminalGrowth: number; years: number }): number[] {
  const out: number[] = [];
  for (let y = 1; y <= i.years; y++) {
    if (y === 1) out.push(i.g1);
    else if (y <= 3) out.push(i.g2);
    else if (y <= 5) out.push(i.g3);
    else {
      const span = i.years - 5;
      const t = span <= 0 ? 1 : (y - 5) / span;
      out.push(i.g3 + (i.terminalGrowth - i.g3) * t);
    }
  }
  return out;
}

export function marginPath(i: { startMargin: number; targetMargin: number; marginYears: number; years: number }): number[] {
  const out: number[] = [];
  const m = Math.max(1, i.marginYears);
  for (let y = 1; y <= i.years; y++) {
    const t = Math.min(1, y / m);
    out.push(i.startMargin + (i.targetMargin - i.startMargin) * t);
  }
  return out;
}

export function validateDcf(i: DcfInputs): void {
  if (!(i.baseRevenue > 0)) throw new DcfError('Base revenue must be positive.');
  if (i.years < 6 || i.years > 20) throw new DcfError('Forecast horizon must be between 6 and 20 years.');
  if (!(i.wacc > 0)) throw new DcfError('WACC must be positive.');
  if (i.wacc <= i.terminalGrowth) throw new DcfError('WACC must exceed the terminal growth rate; otherwise terminal value is undefined.');
  if (i.terminalGrowth > 0.06) throw new DcfError('Terminal growth above 6% exceeds plausible long-run nominal GDP growth.');
  if (!(i.dilutedShares > 0)) throw new DcfError('Diluted shares must be positive.');
  if (i.taxRate < 0 || i.taxRate >= 1) throw new DcfError('Tax rate must be between 0% and 100%.');
}

export function runDcf(i: DcfInputs): DcfResult {
  validateDcf(i);
  const gs = growthPath(i);
  const ms = marginPath(i);
  const years: DcfYear[] = [];
  let prevRev = i.baseRevenue;
  let sumPv = 0;
  for (let y = 1; y <= i.years; y++) {
    const growth = gs[y - 1];
    const revenue = prevRev * (1 + growth);
    const margin = ms[y - 1];
    const ebit = revenue * margin;
    const nopat = ebit * (1 - i.taxRate);
    const da = revenue * i.daPct;
    const capex = revenue * i.capexPct;
    const deltaNwc = (revenue - prevRev) * i.nwcPct;
    const fcff = nopat + da - capex - deltaNwc;
    const t = i.midYear ? y - 0.5 : y;
    const discountFactor = 1 / Math.pow(1 + i.wacc, t);
    const pv = fcff * discountFactor;
    sumPv += pv;
    years.push({ year: y, growth, revenue, margin, ebit, nopat, da, capex, deltaNwc, fcff, discountFactor, pv });
    prevRev = revenue;
  }
  const last = years[years.length - 1];
  // Terminal-year cash flow: grow revenue once more, keep margin; ΔNWC on terminal growth.
  const tRev = last.revenue * (1 + i.terminalGrowth);
  const tFcff = tRev * last.margin * (1 - i.taxRate) + tRev * i.daPct - tRev * i.capexPct - (tRev - last.revenue) * i.nwcPct;
  const terminalValue = tFcff / (i.wacc - i.terminalGrowth);
  const tDisc = 1 / Math.pow(1 + i.wacc, i.midYear ? i.years - 0.5 : i.years);
  const pvTerminal = terminalValue * tDisc;
  const enterpriseValue = sumPv + pvTerminal;
  const equityValue = enterpriseValue + i.cash + i.nonOperatingAssets - i.debt;
  return {
    years,
    sumPv,
    terminalValue,
    pvTerminal,
    enterpriseValue,
    equityValue,
    perShare: equityValue / i.dilutedShares,
    terminalShareOfEv: pvTerminal / enterpriseValue,
    impliedExitEvEbit: terminalValue / last.ebit,
  };
}

/** Per-share value, or null when the combination is invalid (e.g. WACC ≤ g). */
export function perShareOrNull(i: DcfInputs): number | null {
  try {
    return runDcf(i).perShare;
  } catch {
    return null;
  }
}

export interface SensitivityGrid {
  rowLabel: string;
  colLabel: string;
  rows: number[];
  cols: number[];
  values: (number | null)[][];
}

/** Two-way sensitivity: vary two inputs, everything else held at `base`. */
export function sensitivity<K1 extends keyof DcfInputs, K2 extends keyof DcfInputs>(
  base: DcfInputs,
  rowKey: K1,
  rows: number[],
  colKey: K2,
  cols: number[],
  labels: { row: string; col: string },
): SensitivityGrid {
  const values = rows.map((r) => cols.map((c) => perShareOrNull({ ...base, [rowKey]: r, [colKey]: c } as DcfInputs)));
  return { rowLabel: labels.row, colLabel: labels.col, rows, cols, values };
}

/** Symmetric steps around a centre value, e.g. steps(0.11, 0.01, 2) → [0.09 … 0.13]. */
export function steps(center: number, step: number, n: number): number[] {
  const out: number[] = [];
  for (let k = -n; k <= n; k++) out.push(Math.round((center + k * step) * 1e6) / 1e6);
  return out;
}
