/**
 * Pure financial-calculation primitives. No data access here — every function
 * takes explicit inputs so it can be unit-tested and reused for any company.
 * Functions return `null` rather than NaN/Infinity when an input is missing
 * or a denominator is zero, so the UI can show "Data unavailable".
 */

export type N = number | null | undefined;

const isNum = (x: N): x is number => typeof x === 'number' && Number.isFinite(x);

export function safeDiv(a: N, b: N): number | null {
  if (!isNum(a) || !isNum(b) || b === 0) return null;
  return a / b;
}

/** Margin = numerator / revenue. */
export function margin(numerator: N, revenue: N): number | null {
  return safeDiv(numerator, revenue);
}

/** Period-over-period growth. Uses |prev| so growth from a negative base keeps its sign meaning. */
export function growth(current: N, previous: N): number | null {
  if (!isNum(current) || !isNum(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** Compound annual growth rate over `years`. Undefined for non-positive endpoints. */
export function cagr(start: N, end: N, years: number): number | null {
  if (!isNum(start) || !isNum(end) || start <= 0 || end <= 0 || years <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

export function average(a: N, b: N): number | null {
  if (!isNum(a) && !isNum(b)) return null;
  if (!isNum(a)) return b as number;
  if (!isNum(b)) return a;
  return (a + b) / 2;
}

export function sum(...xs: N[]): number | null {
  if (xs.some((x) => !isNum(x))) return null;
  return (xs as number[]).reduce((s, x) => s + x, 0);
}

/** Free cash flow = operating cash flow − capital expenditures. Capex may be passed signed (negative) or as a positive outflow. */
export function freeCashFlow(operatingCashFlow: N, capex: N): number | null {
  if (!isNum(operatingCashFlow) || !isNum(capex)) return null;
  return operatingCashFlow - Math.abs(capex);
}

/** Trailing twelve months from a fiscal year plus year-to-date periods: FY + YTD(current) − YTD(prior). */
export function ttm(fiscalYear: N, ytdCurrent: N, ytdPrior: N): number | null {
  if (!isNum(fiscalYear) || !isNum(ytdCurrent) || !isNum(ytdPrior)) return null;
  return fiscalYear + ytdCurrent - ytdPrior;
}

/** Net debt = total debt − cash − liquid investments. Negative result = net cash. */
export function netDebt(totalDebt: N, cash: N, liquidInvestments: N = 0): number | null {
  if (!isNum(totalDebt) || !isNum(cash)) return null;
  return totalDebt - cash - (isNum(liquidInvestments) ? liquidInvestments : 0);
}

export function marketCap(price: N, sharesOutstanding: N): number | null {
  if (!isNum(price) || !isNum(sharesOutstanding)) return null;
  return price * sharesOutstanding;
}

/**
 * Enterprise value = market cap + total debt (+ optional lease liabilities, minority interest, preferred)
 * − cash and liquid investments.
 */
export function enterpriseValue(args: {
  marketCap: N;
  totalDebt: N;
  cash: N;
  liquidInvestments?: N;
  leaseLiabilities?: N;
  minorityInterest?: N;
}): number | null {
  const { marketCap: mc, totalDebt, cash } = args;
  if (!isNum(mc) || !isNum(totalDebt) || !isNum(cash)) return null;
  const inv = isNum(args.liquidInvestments) ? args.liquidInvestments : 0;
  const lease = isNum(args.leaseLiabilities) ? args.leaseLiabilities : 0;
  const mi = isNum(args.minorityInterest) ? args.minorityInterest : 0;
  return mc + totalDebt + lease + mi - cash - inv;
}

export function nopat(ebit: N, taxRate: N): number | null {
  if (!isNum(ebit) || !isNum(taxRate)) return null;
  return ebit * (1 - taxRate);
}

/**
 * Operating invested capital (financing approach): equity + debt + lease liabilities
 * − cash − liquid investments − non-operating investments.
 */
export function investedCapital(args: {
  equity: N;
  totalDebt: N;
  leaseLiabilities?: N;
  cash: N;
  liquidInvestments?: N;
  nonOperatingInvestments?: N;
}): number | null {
  const { equity, totalDebt, cash } = args;
  if (!isNum(equity) || !isNum(totalDebt) || !isNum(cash)) return null;
  const lease = isNum(args.leaseLiabilities) ? args.leaseLiabilities : 0;
  const liq = isNum(args.liquidInvestments) ? args.liquidInvestments : 0;
  const nonop = isNum(args.nonOperatingInvestments) ? args.nonOperatingInvestments : 0;
  return equity + totalDebt + lease - cash - liq - nonop;
}

/** ROIC = NOPAT / average invested capital. */
export function roic(nopatValue: N, investedCapitalStart: N, investedCapitalEnd: N): number | null {
  const avg = average(investedCapitalStart, investedCapitalEnd);
  if (avg == null || avg <= 0) return null;
  return safeDiv(nopatValue, avg);
}

export function returnOnAverage(numerator: N, start: N, end: N): number | null {
  const avg = average(start, end);
  if (avg == null || avg <= 0) return null;
  return safeDiv(numerator, avg);
}

/** Days metric: average balance / flow × days in period. */
export function days(avgBalance: N, flowValue: N, daysInPeriod = 365): number | null {
  const r = safeDiv(avgBalance, flowValue);
  return r == null ? null : r * daysInPeriod;
}

export function cashConversionCycle(dio: N, dso: N, dpo: N): number | null {
  if (!isNum(dio) || !isNum(dso) || !isNum(dpo)) return null;
  return dio + dso - dpo;
}

export function interestCoverage(ebit: N, interestExpense: N): number | null {
  if (!isNum(interestExpense) || interestExpense === 0) return null;
  return safeDiv(ebit, Math.abs(interestExpense));
}

/** Percentage change in diluted share count (positive = dilution, negative = net reduction). */
export function shareChange(sharesNow: N, sharesBefore: N): number | null {
  return growth(sharesNow, sharesBefore);
}

/** Upside / downside of intrinsic value vs price. */
export function upside(intrinsic: N, price: N): number | null {
  if (!isNum(intrinsic) || !isNum(price) || price === 0) return null;
  return intrinsic / price - 1;
}

/** Margin of safety = 1 − price / intrinsic value (negative when the price exceeds the estimate). */
export function marginOfSafety(intrinsic: N, price: N): number | null {
  if (!isNum(intrinsic) || !isNum(price) || intrinsic <= 0) return null;
  return 1 - price / intrinsic;
}

/** CAPM cost of equity. */
export function costOfEquity(riskFree: number, beta: number, equityRiskPremium: number): number {
  return riskFree + beta * equityRiskPremium;
}

/** WACC from market-value weights. */
export function wacc(args: { equityValue: number; debtValue: number; costOfEquity: number; preTaxCostOfDebt: number; taxRate: number }): number {
  const { equityValue: E, debtValue: D, costOfEquity: ke, preTaxCostOfDebt: kd, taxRate: t } = args;
  const V = E + D;
  if (V <= 0) throw new Error('Capital base must be positive');
  return (E / V) * ke + (D / V) * kd * (1 - t);
}
