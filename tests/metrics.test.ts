import { describe, expect, it } from 'vitest';
import { ALL_METRICS, analytics, valuationSnapshot } from '@/lib/finance/metrics';
import { PROVIDER_NVDA, PROVIDER_NVDA_LATEST, QUOTE } from '@/lib/data/market';
import { StaticProvider } from '@/lib/data/provider';

describe('company metrics (calculated from reported data)', () => {
  it('TTM flows = FY2026 + 9M FY2027 − 9M FY2026', () => {
    expect(analytics.flowValue('revenue', 'TTM')).toBe(361808);
    expect(analytics.flowValue('netIncome', 'TTM')).toBe(226257);
    expect(ALL_METRICS.TTM.fcf).toBe(148723);
  });

  it('margins for FY2026', () => {
    const m = ALL_METRICS.FY2026;
    expect(m.grossMargin).toBeCloseTo(0.7107, 4); // NVIDIA reported 71.1%
    expect(m.operatingMargin).toBeCloseTo(0.6038, 4);
    expect(m.netMargin).toBeCloseTo(0.556, 3);
    expect(m.revenueGrowth).toBeCloseTo(0.6547, 4); // reported +65%
  });

  it('TTM revenue growth uses the prior four quarters', () => {
    expect(ALL_METRICS.TTM.revenueGrowth).toBeCloseTo(361808 / 187142 - 1, 6);
  });

  it('net cash and leverage at Oct 25, 2026', () => {
    const t = ALL_METRICS.TTM;
    expect(t.totalDebt).toBe(32371);
    expect(t.netDebt).toBe(-65360);
    expect(t.currentRatio).toBeCloseTo(221994 / 54361, 6);
  });

  it('ROIC is NOPAT over average operating invested capital', () => {
    const m = ALL_METRICS.FY2026;
    const etr = 21383 / 141450;
    const nopat = 130387 * (1 - etr);
    const ic25 = 79327 + 8463 + 1519 - 8589 - 34621 - 3387;
    const ic26 = 157293 + 999 + 7469 + 2572 - 10605 - 51951 - 22251;
    expect(m.roic).toBeCloseTo(nopat / ((ic25 + ic26) / 2), 8);
    expect(ALL_METRICS.FY2022.roic).toBeNull(); // no sourced FY2021 balance sheet → no average
  });

  it('working-capital days', () => {
    const m = ALL_METRICS.FY2026;
    expect(m.dso).toBeCloseTo(((23065 + 38466) / 2 / 215938) * 365, 6);
    expect(m.dio).toBeCloseTo(((10080 + 21403) / 2 / 62475) * 365, 6);
    expect(m.ccc).toBeCloseTo(m.dio! + m.dso! - m.dpo!, 8);
  });

  it('earnings quality: CFO / NI and SBC', () => {
    expect(ALL_METRICS.FY2026.cfoToNi).toBeCloseTo(102718 / 120067, 8);
    expect(ALL_METRICS.FY2026.sbcToRevenue).toBeCloseTo(6386 / 215938, 8);
  });
});

describe('valuation snapshot cross-checks against an independent provider', () => {
  const v = valuationSnapshot(PROVIDER_NVDA.price);
  it.each([
    ['pe', PROVIDER_NVDA.pe],
    ['ps', PROVIDER_NVDA.ps],
    ['evEbitda', PROVIDER_NVDA.evEbitda],
    ['evEbit', PROVIDER_NVDA.evEbit],
    ['evFcf', PROVIDER_NVDA.evFcf],
  ] as const)('%s within 1% of StockAnalysis', (k, ref) => {
    expect(Math.abs((v[k] as number) / ref - 1)).toBeLessThan(0.01);
  });
  it('market cap, EV, FCF yield and dividend yield', () => {
    expect(v.marketCap / 1e6).toBeCloseTo(3.03, 2);
    expect(v.enterpriseValue / 1e6).toBeCloseTo(2.97, 2);
    expect(v.fcfYield).toBeCloseTo(PROVIDER_NVDA.fcfYield, 3);
    expect(v.dividendYield).toBeCloseTo(PROVIDER_NVDA.dividendYield, 3);
  });
  it('valuation responds to price', () => {
    expect(valuationSnapshot(251.06).pe).toBeCloseTo(v.pe * 2, 6);
  });
  it('latest close matches Yahoo Finance P/E and market cap within 1%', () => {
    const now = valuationSnapshot();
    expect(QUOTE.price).toBe(PROVIDER_NVDA_LATEST.price);
    expect(Math.abs(now.pe / PROVIDER_NVDA_LATEST.pe - 1)).toBeLessThan(0.01);
    expect(Math.abs(now.marketCap / 1e6 / PROVIDER_NVDA_LATEST.marketCapT - 1)).toBeLessThan(0.01);
  });
});

describe('static provider', () => {
  it('loads, validates and builds the same analytics', async () => {
    const d = await StaticProvider.load();
    expect(d.provider).toBe('static');
    expect(d.analytics.ALL_METRICS.TTM.revenue).toBe(361808);
  });
});
