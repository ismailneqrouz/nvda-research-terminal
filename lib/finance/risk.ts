/**
 * Risk & return statistics for periodic (here: monthly) return series.
 * All functions are pure. Conventions:
 *  - simple (arithmetic) period returns r_t = P_t / P_{t-1} − 1
 *  - sample standard deviation (n − 1)
 *  - annualisation with `ppy` periods per year (12 for monthly): mean × ppy, σ × √ppy
 *  - risk-free per period supplied as a series (same length as returns), already de-annualised
 */

export const PPY = 12;

export function simpleReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(prices[i] / prices[i - 1] - 1);
  return out;
}

export function mean(xs: number[]): number {
  if (!xs.length) throw new Error('mean of empty series');
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) throw new Error('stdev needs ≥ 2 observations');
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function covariance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) throw new Error('covariance needs equal-length series ≥ 2');
  const ma = mean(a);
  const mb = mean(b);
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}

export function correlation(a: number[], b: number[]): number {
  return covariance(a, b) / (stdev(a) * stdev(b));
}

export function subtract(a: number[], b: number[]): number[] {
  if (a.length !== b.length) throw new Error('length mismatch');
  return a.map((x, i) => x - b[i]);
}

/** Geometric annualised return (CAGR) from period returns. */
export function annualizedReturn(rs: number[], ppy = PPY): number {
  const growth = rs.reduce((g, r) => g * (1 + r), 1);
  return Math.pow(growth, ppy / rs.length) - 1;
}

export function totalReturn(rs: number[]): number {
  return rs.reduce((g, r) => g * (1 + r), 1) - 1;
}

export function annualizedVolatility(rs: number[], ppy = PPY): number {
  return stdev(rs) * Math.sqrt(ppy);
}

/** Sharpe ratio: mean excess return ÷ standard deviation of excess return, annualised by √ppy. */
export function sharpeRatio(rs: number[], rf: number[], ppy = PPY): number {
  const ex = subtract(rs, rf);
  return (mean(ex) / stdev(ex)) * Math.sqrt(ppy);
}

/** Downside deviation relative to a per-period target series (default: the risk-free rate). Uses all n observations in the denominator. */
export function downsideDeviation(rs: number[], target: number[], ppy = PPY): number {
  const ex = subtract(rs, target);
  const sq = ex.reduce((a, x) => a + Math.min(0, x) ** 2, 0) / ex.length;
  return Math.sqrt(sq) * Math.sqrt(ppy);
}

/** Sortino ratio: annualised mean excess return ÷ annualised downside deviation. */
export function sortinoRatio(rs: number[], rf: number[], ppy = PPY): number {
  const ex = subtract(rs, rf);
  const dd = downsideDeviation(rs, rf, ppy);
  if (dd === 0) return Infinity;
  return (mean(ex) * ppy) / dd;
}

export interface Drawdown {
  maxDrawdown: number; // negative number, e.g. −0.55
  peakIndex: number;
  troughIndex: number;
  recoveryIndex: number | null; // first index back at/above the prior peak, null if not recovered
  series: number[]; // drawdown at each point
}

/** Maximum drawdown from a price (or wealth-index) series. */
export function maxDrawdown(prices: number[]): Drawdown {
  if (prices.length < 2) throw new Error('need ≥ 2 prices');
  let peak = prices[0];
  let peakIdx = 0;
  let best = { dd: 0, peakIdx: 0, troughIdx: 0 };
  const series: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
      peakIdx = i;
    }
    const dd = prices[i] / peak - 1;
    series.push(dd);
    if (dd < best.dd) best = { dd, peakIdx, troughIdx: i };
  }
  let recoveryIndex: number | null = null;
  for (let i = best.troughIdx + 1; i < prices.length; i++) {
    if (prices[i] >= prices[best.peakIdx]) {
      recoveryIndex = i;
      break;
    }
  }
  return { maxDrawdown: best.dd, peakIndex: best.peakIdx, troughIndex: best.troughIdx, recoveryIndex, series };
}

export function calmarRatio(cagr: number, mdd: number): number | null {
  if (mdd >= 0) return null;
  return cagr / Math.abs(mdd);
}

/** OLS beta of asset vs market (raw returns, as most data vendors quote it). */
export function beta(asset: number[], market: number[]): number {
  return covariance(asset, market) / covariance(market, market);
}

/** Jensen's alpha, annualised: (mean excess asset − β · mean excess market) × ppy. */
export function jensensAlpha(asset: number[], market: number[], rf: number[], ppy = PPY): number {
  const ea = subtract(asset, rf);
  const em = subtract(market, rf);
  const b = covariance(ea, em) / covariance(em, em);
  return (mean(ea) - b * mean(em)) * ppy;
}

/** Treynor ratio: annualised mean excess return per unit of beta. */
export function treynorRatio(asset: number[], rf: number[], b: number, ppy = PPY): number {
  return (mean(subtract(asset, rf)) * ppy) / b;
}

export function trackingError(asset: number[], bench: number[], ppy = PPY): number {
  return stdev(subtract(asset, bench)) * Math.sqrt(ppy);
}

export function informationRatio(asset: number[], bench: number[], ppy = PPY): number {
  const act = subtract(asset, bench);
  return (mean(act) / stdev(act)) * Math.sqrt(ppy);
}

/** Linear-interpolated percentile (p in [0,1]). */
export function percentile(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/** Historical Value-at-Risk at confidence c (e.g. 0.95), reported as a positive loss fraction. */
export function historicalVaR(rs: number[], c = 0.95): number {
  return -percentile(rs, 1 - c);
}

/** Parametric (normal) VaR: −(μ − z·σ). z = 1.6449 for 95%. */
export function parametricVaR(rs: number[], z = 1.6448536269514722): number {
  return -(mean(rs) - z * stdev(rs));
}

/** Conditional VaR / expected shortfall: average loss in the worst (1 − c) tail, as a positive fraction. */
export function conditionalVaR(rs: number[], c = 0.95): number {
  const cut = percentile(rs, 1 - c);
  const tail = rs.filter((r) => r <= cut);
  return -mean(tail);
}

/** Up/down capture ratios (arithmetic means of periods where the market rose / fell). */
export function captureRatios(asset: number[], market: number[]) {
  const up: number[] = [];
  const upM: number[] = [];
  const dn: number[] = [];
  const dnM: number[] = [];
  market.forEach((m, i) => {
    if (m > 0) { up.push(asset[i]); upM.push(m); }
    else if (m < 0) { dn.push(asset[i]); dnM.push(m); }
  });
  return {
    up: up.length ? mean(up) / mean(upM) : null,
    down: dn.length ? mean(dn) / mean(dnM) : null,
    upMonths: up.length,
    downMonths: dn.length,
  };
}

export function skewness(xs: number[]): number {
  const n = xs.length;
  const m = mean(xs);
  const s = stdev(xs);
  const sum3 = xs.reduce((a, x) => a + ((x - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum3;
}

export function hitRate(xs: number[]): number {
  return xs.filter((x) => x > 0).length / xs.length;
}
