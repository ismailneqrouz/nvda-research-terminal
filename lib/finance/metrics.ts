import {
  average, cashConversionCycle, days, enterpriseValue, freeCashFlow, growth, interestCoverage, investedCapital,
  margin, marketCap, netDebt, nopat, returnOnAverage, roic, safeDiv, ttm,
} from './core';
import { ANNUAL_KEYS } from '../data/financials';
import type { FinancialStore } from '../data/store';
import { STATIC_STORE } from '../data/store';


/**
 * Analytics service: derives every ratio shown in the terminal from the
 * reported dataset. Periods: FY2022…FY2026 plus 'TTM' (Q4 FY2026 + 9M FY2027).
 * All outputs here are `calculated` / `ttm` status.
 */

export const METRIC_PERIODS = [...ANNUAL_KEYS, 'TTM'] as const;
export type MetricPeriod = (typeof METRIC_PERIODS)[number];

export interface PeriodMetrics {
  period: MetricPeriod;
  revenue: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  ebit: number | null;
  ebitMargin: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  fcf: number | null;
  fcfMargin: number | null;
  effectiveTaxRate: number | null;
  roe: number | null;
  roa: number | null;
  roic: number | null;
  rotic: number | null;
  investedCapital: number | null;
  assetTurnover: number | null;
  inventoryTurnover: number | null;
  dio: number | null;
  receivablesTurnover: number | null;
  dso: number | null;
  dpo: number | null;
  ccc: number | null;
  operatingWorkingCapital: number | null;
  owcToRevenue: number | null;
  cfoToNi: number | null;
  fcfToNi: number | null;
  sbc: number | null;
  sbcToRevenue: number | null;
  sbcToFcf: number | null;
  dilutedShareChange: number | null;
  nonOperatingShareOfPretax: number | null;
  totalDebt: number | null;
  liquidCash: number | null;
  netDebt: number | null;
  debtToEquity: number | null;
  netDebtToEbitda: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  interestCoverage: number | null;
  workingCapital: number | null;
  capexToRevenue: number | null;
  arGrowth: number | null;
  inventoryGrowth: number | null;
}

/** Build the analytics engine over any data store (static dataset or Postgres-backed). */
export function buildAnalytics(s: FinancialStore) {
  /** Sum of four consecutive quarters ending at `endKey` from the quarterly series. */
  function quarterTtm(field: 'revenue' | 'netIncome' | 'operatingIncome' | 'grossProfit' | 'freeCashFlow', endKey: string): number | null {
    const i = s.quarters.findIndex((q) => q.key === endKey);
    if (i < 3) return null;
    return s.quarters.slice(i - 3, i + 1).reduce((s, q) => s + q[field], 0);
  }

  /** Flow value for an annual key or TTM. */
  function flowValue(id: string, p: MetricPeriod): number | null {
    if (p === 'TTM') return ttm(s.val(id, 'FY2026'), s.val(id, '9M-FY27'), s.val(id, '9M-FY26'));
    return s.val(id, p);
  }

  /** Balance-sheet value at the end of the period ('TTM' → latest balance sheet, Oct 25, 2026). */
  function balanceEnd(id: string, p: MetricPeriod): number | null {
    return s.val(id, p === 'TTM' ? 'Q3-FY27' : p);
  }

  /** Balance at the start of the period (prior year end). FY2022 has no sourced prior balance → null. TTM uses Jan 25, 2026 as the opening proxy. */
  function balanceStart(id: string, p: MetricPeriod): number | null {
    if (p === 'TTM') return s.val(id, 'FY2026');
    const i = ANNUAL_KEYS.indexOf(p);
    return i <= 0 ? null : s.val(id, ANNUAL_KEYS[i - 1]);
  }

  function avgBal(id: string, p: MetricPeriod): number | null {
    const s = balanceStart(id, p);
    if (s == null) return null;
    return average(s, balanceEnd(id, p));
  }

  function totalDebt(p: MetricPeriod): number | null {
    const a = balanceEnd('shortTermDebt', p);
    const b = balanceEnd('longTermDebt', p);
    return a == null || b == null ? null : a + b;
  }
  function liquidCash(p: MetricPeriod): number | null {
    const a = balanceEnd('cash', p);
    const b = balanceEnd('marketableSecurities', p);
    return a == null || b == null ? null : a + b;
  }
  function icAt(key: string): number | null {
    const std = s.val('shortTermDebt', key);
    const ltd = s.val('longTermDebt', key);
    if (std == null || ltd == null) return null;
    return investedCapital({
      equity: s.val('equity', key),
      totalDebt: std + ltd,
      leaseLiabilities: s.val('leaseLiabilities', key),
      cash: s.val('cash', key),
      liquidInvestments: s.val('marketableSecurities', key),
      nonOperatingInvestments: s.val('nonMarketable', key),
    });
  }
  function tangibleIcAt(key: string): number | null {
    const ic = icAt(key);
    const gw = s.val('goodwill', key);
    const ia = s.val('intangibles', key);
    return ic == null || gw == null || ia == null ? null : ic - gw - ia;
  }
  function priorKey(p: MetricPeriod): string | null {
    if (p === 'TTM') return 'FY2026';
    const i = ANNUAL_KEYS.indexOf(p);
    return i <= 0 ? null : ANNUAL_KEYS[i - 1];
  }
  function endKey(p: MetricPeriod): string {
    return p === 'TTM' ? 'Q3-FY27' : p;
  }


  function computeMetrics(p: MetricPeriod): PeriodMetrics {
    const rev = flowValue('revenue', p);
    const prevRev = p === 'TTM' ? quarterTtm('revenue', 'Q3-FY26') : priorKey(p) ? s.val('revenue', priorKey(p)!) : null;
    const gp = flowValue('grossProfit', p);
    const op = flowValue('operatingIncome', p);
    const pretax = flowValue('pretaxIncome', p);
    const intExp = flowValue('interestExpense', p);
    const ni = flowValue('netIncome', p);
    const tax = flowValue('incomeTax', p);
    const da = flowValue('dna', p);
    const cogs = flowValue('costOfRevenue', p);
    const ocf = flowValue('ocf', p);
    const capex = flowValue('capex', p);
    const sbc = flowValue('sbc', p);
    const otherInc = flowValue('totalOther', p);
    const fcf = freeCashFlow(ocf, capex);
    const ebitda = op != null && da != null ? op + da : null;
    // EBIT = pre-tax income + interest expense (includes other non-operating income); operating income excludes it.
    const ebit = pretax != null && intExp != null ? pretax + Math.abs(intExp) : null;
    const etr = safeDiv(tax, pretax);
    const ek = endKey(p);
    const pk = priorKey(p);
    const icStart = pk ? icAt(pk) : null;
    const icEnd = icAt(ek);
    const ticStart = pk ? tangibleIcAt(pk) : null;
    const ticEnd = tangibleIcAt(ek);
    const nop = nopat(op, etr);

    const avgInv = avgBal('inventory', p);
    const avgAr = avgBal('receivables', p);
    const avgAp = avgBal('payables', p);
    const dio = days(avgInv, cogs);
    const dso = days(avgAr, rev);
    const dpo = days(avgAp, cogs);

    const debt = totalDebt(p);
    const liq = liquidCash(p);
    const tca = balanceEnd('totalCurrentAssets', p);
    const tcl = balanceEnd('totalCurrentLiabilities', p);
    const ar = balanceEnd('receivables', p);
    const owc =
      ar != null
        ? ar + (balanceEnd('inventory', p) ?? 0) + (balanceEnd('otherCurrentAssets', p) ?? 0) - (balanceEnd('payables', p) ?? 0) - (balanceEnd('accrued', p) ?? 0)
        : null;

    const dilNow = p === 'TTM' ? s.val('sharesDiluted', 'Q3-FY27') : s.val('sharesDiluted', p);
    const dilPrev = p === 'TTM' ? s.val('sharesDiluted', 'Q3-FY26') : pk ? s.val('sharesDiluted', pk) : null;

    return {
      period: p,
      revenue: rev,
      revenueGrowth: growth(rev, prevRev),
      grossMargin: margin(gp, rev),
      operatingMargin: margin(op, rev),
      ebit,
      ebitMargin: margin(ebit, rev),
      ebitda,
      ebitdaMargin: margin(ebitda, rev),
      netMargin: margin(ni, rev),
      fcf,
      fcfMargin: margin(fcf, rev),
      effectiveTaxRate: etr,
      roe: pk ? returnOnAverage(ni, s.val('equity', pk), s.val('equity', ek)) : null,
      roa: pk ? returnOnAverage(ni, s.val('totalAssets', pk), s.val('totalAssets', ek)) : null,
      roic: pk ? roic(nop, icStart, icEnd) : null,
      rotic: pk ? roic(nop, ticStart, ticEnd) : null,
      investedCapital: icEnd,
      assetTurnover: safeDiv(rev, avgBal('totalAssets', p)),
      inventoryTurnover: safeDiv(cogs, avgInv),
      dio,
      receivablesTurnover: safeDiv(rev, avgAr),
      dso,
      dpo,
      ccc: cashConversionCycle(dio, dso, dpo),
      operatingWorkingCapital: owc,
      owcToRevenue: safeDiv(owc, rev),
      cfoToNi: safeDiv(ocf, ni),
      fcfToNi: safeDiv(fcf, ni),
      sbc,
      sbcToRevenue: safeDiv(sbc, rev),
      sbcToFcf: safeDiv(sbc, fcf),
      dilutedShareChange: growth(dilNow, dilPrev),
      nonOperatingShareOfPretax: safeDiv(otherInc, pretax),
      totalDebt: debt,
      liquidCash: liq,
      netDebt: netDebt(debt, liq),
      debtToEquity: safeDiv(debt, balanceEnd('equity', p)),
      netDebtToEbitda: safeDiv(netDebt(debt, liq), ebitda),
      currentRatio: safeDiv(tca, tcl),
      quickRatio: liq != null && ar != null ? safeDiv(liq + ar, tcl) : null,
      cashRatio: safeDiv(liq, tcl),
      interestCoverage: interestCoverage(op, intExp),
      workingCapital: tca != null && tcl != null ? tca - tcl : null,
      capexToRevenue: capex != null ? safeDiv(Math.abs(capex), rev) : null,
      arGrowth: growth(balanceEnd('receivables', p), pk ? s.val('receivables', pk) : null),
      inventoryGrowth: growth(balanceEnd('inventory', p), pk ? s.val('inventory', pk) : null),
    };
  }

  const ALL_METRICS: Record<MetricPeriod, PeriodMetrics> = Object.fromEntries(
    METRIC_PERIODS.map((p) => [p, computeMetrics(p)]),
  ) as Record<MetricPeriod, PeriodMetrics>;

  // ── Valuation snapshot ─────────────────────────────────────────────────
  function valuationSnapshot(price = s.quote.price) {
    const t = ALL_METRICS.TTM;
    const shares = s.quote.sharesOutstanding;
    const mcap = marketCap(price, shares)!;
    const debt = t.totalDebt ?? 0;
    const ev = enterpriseValue({ marketCap: mcap, totalDebt: debt, cash: s.val('cash', 'Q3-FY27'), liquidInvestments: s.val('marketableSecurities', 'Q3-FY27') })!;
    const ttmEps = ttm(s.val('epsDiluted', 'FY2026'), s.val('epsDiluted', '9M-FY27'), s.val('epsDiluted', '9M-FY26'))!;
    const ni = flowValue('netIncome', 'TTM')!;
    const equity = s.val('equity', 'Q3-FY27')!;
    const opInc = flowValue('operatingIncome', 'TTM')!;
    const pe = price / ttmEps;
    const fwdEps = s.consensus.fy2027EpsAvg;
    const fwdPe = price / fwdEps;
    const epsGrowth = growth(fwdEps, s.val('epsDiluted', 'FY2026'));
    const annualDividend = s.quarterlyDividend * 4;
    return {
      price,
      shares,
      marketCap: mcap,
      enterpriseValue: ev,
      totalDebt: debt,
      liquidCash: t.liquidCash,
      nonMarketable: s.val('nonMarketable', 'Q3-FY27'),
      ttmEps,
      ttmNetIncome: ni,
      ttmRevenue: t.revenue!,
      ttmEbitda: t.ebitda!,
      ttmOperatingIncome: opInc,
      ttmFcf: t.fcf!,
      pe,
      forwardPe: fwdPe,
      forwardEps: fwdEps,
      peg: epsGrowth != null && epsGrowth > 0 ? pe / (epsGrowth * 100) : null,
      ps: mcap / t.revenue!,
      pb: mcap / equity,
      evEbitda: ev / t.ebitda!,
      evEbit: ev / opInc,
      evFcf: ev / t.fcf!,
      fcfYield: t.fcf! / mcap,
      earningsYield: ni / mcap,
      dividendYield: annualDividend / price,
      annualDividend,
      /** P/E excluding TTM non-operating gains (other income) taxed at the TTM effective rate. */
      peExOther: (() => {
        const other = flowValue('totalOther', 'TTM')!;
        const etr = t.effectiveTaxRate ?? 0.17;
        const adjNi = ni - other * (1 - etr);
        return mcap / adjNi;
      })(),
    };
  }
  return { flowValue, balanceEnd, balanceStart, totalDebt, computeMetrics, quarterTtm, ALL_METRICS, valuationSnapshot };
}

export type Analytics = ReturnType<typeof buildAnalytics>;

/** Default engine over the bundled, source-verified dataset. */
export const analytics = buildAnalytics(STATIC_STORE);
export const ALL_METRICS = analytics.ALL_METRICS;
export const valuationSnapshot = analytics.valuationSnapshot;
export const computeMetrics = analytics.computeMetrics;
export const flowValue = analytics.flowValue;
