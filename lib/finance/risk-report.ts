import { MONTHLY, type MonthRow } from '../data/returns';
import {
  annualizedReturn, annualizedVolatility, beta, calmarRatio, captureRatios, conditionalVaR, correlation, downsideDeviation,
  historicalVaR, hitRate, informationRatio, jensensAlpha, maxDrawdown, mean, parametricVaR, sharpeRatio, simpleReturns,
  skewness, sortinoRatio, stdev, subtract, totalReturn, trackingError, treynorRatio,
} from './risk';

export type Window = '1Y' | '3Y' | '5Y';
export const WINDOWS: Record<Window, number> = { '1Y': 12, '3Y': 36, '5Y': 59 };

export interface ReturnRow {
  month: string;
  nvdaPrice: number;
  spyPrice: number;
  nvda: number; // monthly return
  spy: number;
  rf: number; // monthly risk-free
  excess: number; // nvda − rf
  spyExcess: number;
  downsideSq: number; // min(excess, 0)²
}

/** Monthly rows for the last `n` returns (needs n + 1 prices). `rfOverride` (annual, decimal) replaces TB3MS when set. */
export function returnRows(n: number, rfOverride?: number | null, data: MonthRow[] = MONTHLY): ReturnRow[] {
  const slice = data.slice(data.length - (n + 1));
  const rows: ReturnRow[] = [];
  for (let i = 1; i < slice.length; i++) {
    const nvda = slice[i].nvda / slice[i - 1].nvda - 1;
    const spy = slice[i].spy / slice[i - 1].spy - 1;
    const rf = (rfOverride ?? slice[i].rfAnnualPct / 100) / 12;
    const excess = nvda - rf;
    rows.push({ month: slice[i].month, nvdaPrice: slice[i].nvda, spyPrice: slice[i].spy, nvda, spy, rf, excess, spyExcess: spy - rf, downsideSq: Math.min(0, excess) ** 2 });
  }
  return rows;
}

export interface SeriesStats {
  totalReturn: number;
  cagr: number;
  meanMonthly: number;
  volatility: number;
  sharpe: number;
  sortino: number;
  downsideDeviation: number;
  maxDrawdown: number;
  mddPeak: string;
  mddTrough: string;
  calmar: number | null;
  var95: number;
  varParam95: number;
  cvar95: number;
  bestMonth: number;
  worstMonth: number;
  hitRate: number;
  skew: number;
}

export interface RiskReport {
  window: Window;
  months: number;
  from: string;
  to: string;
  avgRf: number; // annual
  nvda: SeriesStats;
  spy: SeriesStats;
  beta: number;
  correlation: number;
  rSquared: number;
  alpha: number;
  treynor: number;
  trackingError: number;
  informationRatio: number;
  upCapture: number | null;
  downCapture: number | null;
  rows: ReturnRow[];
}

function stats(prices: number[], rs: number[], rf: number[], months: string[]): SeriesStats {
  const cagr = annualizedReturn(rs);
  const dd = maxDrawdown(prices);
  return {
    totalReturn: totalReturn(rs),
    cagr,
    meanMonthly: mean(rs),
    volatility: annualizedVolatility(rs),
    sharpe: sharpeRatio(rs, rf),
    sortino: sortinoRatio(rs, rf),
    downsideDeviation: downsideDeviation(rs, rf),
    maxDrawdown: dd.maxDrawdown,
    mddPeak: months[dd.peakIndex],
    mddTrough: months[dd.troughIndex],
    calmar: calmarRatio(cagr, dd.maxDrawdown),
    var95: historicalVaR(rs),
    varParam95: parametricVaR(rs),
    cvar95: conditionalVaR(rs),
    bestMonth: Math.max(...rs),
    worstMonth: Math.min(...rs),
    hitRate: hitRate(rs),
    skew: skewness(rs),
  };
}

export function riskReport(window: Window, rfOverride?: number | null, data: MonthRow[] = MONTHLY): RiskReport {
  const n = WINDOWS[window];
  const rows = returnRows(n, rfOverride, data);
  const slice = data.slice(data.length - (n + 1));
  const months = slice.map((m) => m.month);
  const nv = rows.map((r) => r.nvda);
  const sp = rows.map((r) => r.spy);
  const rf = rows.map((r) => r.rf);
  const b = beta(nv, sp);
  const corr = correlation(nv, sp);
  const cap = captureRatios(nv, sp);
  return {
    window,
    months: n,
    from: rows[0].month,
    to: rows[rows.length - 1].month,
    avgRf: mean(rf) * 12,
    nvda: stats(slice.map((m) => m.nvda), nv, rf, months),
    spy: stats(slice.map((m) => m.spy), sp, rf, months),
    beta: b,
    correlation: corr,
    rSquared: corr * corr,
    alpha: jensensAlpha(nv, sp, rf),
    treynor: treynorRatio(nv, rf, b),
    trackingError: trackingError(nv, sp),
    informationRatio: informationRatio(nv, sp),
    upCapture: cap.up,
    downCapture: cap.down,
    rows,
  };
}

/** Sample stdev of excess returns — exposed for the teaching spreadsheet. */
export function excessStats(rows: ReturnRow[]) {
  const ex = rows.map((r) => r.excess);
  return { mean: mean(ex), sd: stdev(ex), dd: Math.sqrt(rows.reduce((a, r) => a + r.downsideSq, 0) / rows.length), n: rows.length, active: subtract(rows.map((r) => r.nvda), rows.map((r) => r.spy)) };
}

export const RISK_1Y = riskReport('1Y');
export const RISK_3Y = riskReport('3Y');
export const RISK_5Y = riskReport('5Y');
export { simpleReturns };
