import { describe, expect, it } from 'vitest';
import {
  annualizedReturn, annualizedVolatility, beta, calmarRatio, captureRatios, conditionalVaR, correlation, downsideDeviation,
  historicalVaR, informationRatio, jensensAlpha, maxDrawdown, mean, parametricVaR, percentile, sharpeRatio, simpleReturns,
  sortinoRatio, stdev, treynorRatio,
} from '@/lib/finance/risk';
import { MONTHLY } from '@/lib/data/returns';
import { RISK_1Y, RISK_3Y, RISK_5Y, returnRows, riskReport } from '@/lib/finance/risk-report';
import { QUOTE } from '@/lib/data/market';

const r = [0.1, -0.05, 0.02, 0.04, -0.03, 0.06];
const rf = r.map(() => 0.004);

describe('risk primitives (hand-checked)', () => {
  it('simple returns, mean and sample stdev', () => {
    expect(simpleReturns([100, 110, 99])).toEqual([0.10000000000000009, -0.09999999999999998]);
    expect(mean(r)).toBeCloseTo(0.0233333, 6);
    // Σ(x−m)² = 0.0157333…; /5 = 0.00314667; √ = 0.0560952
    expect(stdev(r)).toBeCloseTo(0.0560952, 6);
  });

  it('annualisation', () => {
    expect(annualizedVolatility(r)).toBeCloseTo(0.0560952 * Math.sqrt(12), 6);
    const growth = 1.1 * 0.95 * 1.02 * 1.04 * 0.97 * 1.06;
    expect(annualizedReturn(r)).toBeCloseTo(growth ** 2 - 1, 10); // 6 months → square for a year
  });

  it('Sharpe = mean(excess)/sd(excess)·√12; constant rf leaves sd unchanged', () => {
    expect(sharpeRatio(r, rf)).toBeCloseTo(((0.0233333 - 0.004) / 0.0560952) * Math.sqrt(12), 4);
  });

  it('Sortino uses downside deviation over all observations', () => {
    // excess negatives: −0.054, −0.034 → squares 0.002916, 0.001156 → /6 = 0.000678667
    const dd = Math.sqrt(0.000678667) * Math.sqrt(12);
    expect(downsideDeviation(r, rf)).toBeCloseTo(dd, 6);
    expect(sortinoRatio(r, rf)).toBeCloseTo((0.0193333 * 12) / dd, 4);
    expect(sortinoRatio([0.01, 0.02], [0, 0])).toBe(Infinity);
  });

  it('max drawdown, peak/trough/recovery and Calmar', () => {
    const d = maxDrawdown([100, 120, 90, 60, 80, 130, 125]);
    expect(d.maxDrawdown).toBeCloseTo(-0.5, 10);
    expect([d.peakIndex, d.troughIndex, d.recoveryIndex]).toEqual([1, 3, 5]);
    expect(calmarRatio(0.25, -0.5)).toBeCloseTo(0.5, 10);
    expect(calmarRatio(0.25, 0)).toBeNull();
  });

  it('beta, correlation, alpha, Treynor and information ratio', () => {
    const m = [0.05, -0.02, 0.01, 0.02, -0.01, 0.03];
    const a = m.map((x) => 2 * x + 0.001); // exact linear relation
    expect(beta(a, m)).toBeCloseTo(2, 10);
    expect(correlation(a, m)).toBeCloseTo(1, 10);
    const z = m.map(() => 0);
    expect(jensensAlpha(a, m, z)).toBeCloseTo(0.012, 10); // 0.001 × 12
    expect(treynorRatio(a, z, 2)).toBeCloseTo((mean(a) * 12) / 2, 10);
    expect(informationRatio(a, m)).toBeCloseTo((mean(a.map((x, i) => x - m[i])) / stdev(a.map((x, i) => x - m[i]))) * Math.sqrt(12), 10);
  });

  it('VaR / CVaR / percentiles', () => {
    const xs = [-0.2, -0.1, 0, 0.1, 0.2];
    expect(percentile(xs, 0.5)).toBe(0);
    expect(percentile(xs, 0.05)).toBeCloseTo(-0.18, 10);
    expect(historicalVaR(xs)).toBeCloseTo(0.18, 10);
    expect(conditionalVaR(xs)).toBeCloseTo(0.2, 10);
    expect(parametricVaR(xs)).toBeCloseTo(1.6448536 * stdev(xs), 6);
  });

  it('capture ratios', () => {
    const c = captureRatios([0.04, -0.02, 0.02], [0.02, -0.01, 0.01]);
    expect(c.up).toBeCloseTo(2, 10);
    expect(c.down).toBeCloseTo(2, 10);
  });
});

describe('NVDA risk report (real data)', () => {
  it('dataset: 60 month-ends, Nov 2021 – Oct 2026, positive prices', () => {
    expect(MONTHLY).toHaveLength(60);
    expect(MONTHLY[0].month).toBe('2021-11');
    expect(MONTHLY[59].month).toBe('2026-10');
    for (const m of MONTHLY) expect(m.nvda > 0 && m.spy > 0 && m.rfAnnualPct >= 0).toBe(true);
  });

  it('windows have the right number of returns', () => {
    expect(RISK_1Y.rows).toHaveLength(12);
    expect(RISK_3Y.rows).toHaveLength(36);
    expect(RISK_5Y.rows).toHaveLength(59);
  });

  it('5-year monthly beta matches Yahoo Finance’s published 5Y beta (2.25) within 0.05', () => {
    expect(Math.abs(RISK_5Y.beta - QUOTE.beta5y)).toBeLessThan(0.05);
  });

  it('2022 drawdown is the 5-year maximum (≈ −63% month-end basis)', () => {
    expect(RISK_5Y.nvda.mddTrough).toBe('2022-09');
    expect(RISK_5Y.nvda.maxDrawdown).toBeCloseTo(12.1 / 32.53 - 1, 2);
  });

  it('risk-free override changes Sharpe in the expected direction', () => {
    const lo = riskReport('3Y', 0).nvda.sharpe;
    const hi = riskReport('3Y', 0.08).nvda.sharpe;
    expect(lo).toBeGreaterThan(hi);
    expect(returnRows(3, 0.12)[0].rf).toBeCloseTo(0.01, 10);
  });
});
