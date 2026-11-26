import type { Peer, PricePoint } from './schema';

export const COMPANY = {
  name: 'NVIDIA Corporation',
  ticker: 'NVDA',
  exchange: 'NASDAQ',
  currency: 'USD',
  cik: '0001045810',
  hq: 'Santa Clara, California',
  fiscalYearEnd: 'Last Sunday of January',
  founded: 1993,
};

export const QUOTE = {
  price: 149.3,
  previousClose: 155.38,
  change: -6.08,
  changePct: -0.0391,
  afterHours: 151.22,
  volume: 356_800_000,
  week52High: 243.37,
  week52HighDate: '2026-10-06',
  week52Low: 124.5,
  week52LowDate: '2026-11-20',
  recordClose: 239.24,
  recordCloseDate: '2026-10-06',
  asOf: '2026-11-25T16:00:00-05:00',
  asOfLabel: 'Close, Wed Nov 25, 2026, 4:00 PM ET',
  nextSession: 'US markets closed Thu Nov 26 (Thanksgiving); Fri Nov 27 early close',
  sharesOutstanding: 24150, // millions
  beta5y: 2.25,
  insiderOwnership: 0.039,
  institutionalOwnership: 0.7043,
  sourceIds: ['yahoo-nvda-quote', 'gotrade-nov25', 'sa-nvda-stats'],
};

export const DATA_LAST_UPDATED = '2026-11-26T08:00:00+01:00';
export const LATEST_REPORT = {
  label: 'Q3 FY2027 (quarter ended Oct 25, 2026)',
  filed: '2026-11-17',
  sourceId: 'nvda-q3fy27-pr',
};

export const CONSENSUS = {
  fy2027RevenueAvg: 423800,
  fy2027RevenueLow: 412400,
  fy2027RevenueHigh: 431700,
  fy2027EpsAvg: 9.67, // non-GAAP
  fy2027EpsLow: 9.39,
  fy2027EpsHigh: 10.52,
  forwardPe: 8.65,
  priceTargetLow: 130,
  priceTargetAvg: 244.18, // StockAnalysis, Nov 19
  priceTargetAvgLatest: 242.43, // Yahoo Finance 1y target estimate, Nov 25
  priceTargetLatestSourceId: 'yahoo-nvda-quote',
  priceTargetMedian: 235,
  priceTargetHigh: 425,
  analysts: 63,
  ratings: { strongBuy: 34, buy: 11, hold: 16, sell: 0, strongSell: 2 },
  asOf: '2026-11-19',
  sourceId: 'sa-nvda-forecast',
  note: 'Consensus EPS is non-GAAP (adjusted). Estimates were largely set before the Nov 20 accounting-probe report and may lag.',
};

/** Provider-reported valuation metrics for NVDA at the Nov 20 close ($125.53) — used to cross-check our own calculations. */
export const PROVIDER_NVDA = {
  price: 125.53,
  marketCapB: 3030,
  evB: 2970,
  pe: 13.48,
  forwardPe: 8.65,
  peg: 0.18,
  ps: 8.38,
  pb: 11.35,
  evEbitda: 12.21,
  evEbit: 12.43,
  evFcf: 19.98,
  fcfYield: 0.0491,
  dividendYield: 0.008,
  sourceId: 'sa-nvda-stats',
};

/** Second, later cross-check: Yahoo Finance at the Nov 25 close. */
export const PROVIDER_NVDA_LATEST = { price: 149.3, pe: 16.04, marketCapT: 3.605, sourceId: 'yahoo-nvda-quote' };

/**
 * Price history: calendar year-end closes (adjusted, Macrotrends) plus 2026
 * daily closes that were verified from StockAnalysis / NVIDIA IR. No
 * interpolated points.
 */
export const PRICE_HISTORY: PricePoint[] = [
  { date: '2019-12-31', close: 5.86, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2020-12-31', close: 13.02, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2021-12-31', close: 29.35, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2022-12-30', close: 14.6, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2023-12-29', close: 49.49, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2024-12-31', close: 134.25, sourceId: 'mt-nvda-history', kind: 'year-end' },
  { date: '2025-12-31', close: 186.5, sourceId: 'peak-fourweek', kind: 'year-end' },
  ...(
    [
      ['2026-09-14', 210.96], ['2026-09-15', 212.17], ['2026-09-16', 213.9], ['2026-09-17', 219.34], ['2026-09-18', 222.27],
      ['2026-09-21', 227.38], ['2026-09-22', 228.87], ['2026-09-23', 225.51], ['2026-09-24', 224.58], ['2026-09-25', 225.07],
      ['2026-09-28', 228.86], ['2026-09-29', 227.21], ['2026-09-30', 228.38], ['2026-10-01', 230.86], ['2026-10-02', 233.95],
      ['2026-10-05', 238.9], ['2026-10-06', 239.24], ['2026-10-07', 237.47], ['2026-10-08', 230.48], ['2026-10-09', 229.28],
      ['2026-10-12', 226.32], ['2026-10-13', 228.52], ['2026-10-14', 221.3], ['2026-10-15', 217.23], ['2026-10-16', 214.13],
      ['2026-10-19', 217.09], ['2026-10-20', 216.47], ['2026-10-21', 221.97], ['2026-10-22', 212.21], ['2026-10-23', 210.96],
      ['2026-10-26', 215.42], ['2026-10-27', 217.94], ['2026-10-28', 215.38], ['2026-10-29', 213.66], ['2026-10-30', 204.64],
      ['2026-11-02', 202.06], ['2026-11-03', 206.69], ['2026-11-04', 200.13], ['2026-11-05', 181.6], ['2026-11-06', 186.64],
      ['2026-11-09', 178.67], ['2026-11-10', 168.89], ['2026-11-11', 173.73], ['2026-11-12', 166.19], ['2026-11-13', 162.85],
      ['2026-11-16', 156.14], ['2026-11-17', 155.46], ['2026-11-18', 150.96], ['2026-11-19', 145.98], ['2026-11-20', 125.53],
      ['2026-11-23', 165.05], ['2026-11-24', 155.38], ['2026-11-25', 149.3],
    ] as [string, number][]
  ).map(([date, close]) => ({
    date,
    close,
    sourceId: date >= '2026-11-23' ? 'yahoo-nvda-quote' : date === '2026-10-26' ? 'investing-history' : 'sa-nvda-history',
    kind: 'daily' as const,
  })),
];

/** Peer snapshot: StockAnalysis TTM statistics at the Nov 20, 2026 close (latest consistent provider snapshot available). */
export const PEERS_AS_OF = 'Nov 20, 2026 close';
export const PEERS: Peer[] = [
  {
    ticker: 'AMD', name: 'Advanced Micro Devices', price: 424.39, marketCapB: 702.39, evB: 695.83,
    pe: 91.99, forwardPe: 28.19, peg: 0.4, ps: 15.46, pb: 10.18, evEbitda: 62.45, evEbit: 85.94, evFcf: 98.62,
    fcfYield: 0.01, dividendYield: null, ttmRevenueB: 45.44, grossMargin: 0.56, operatingMargin: 0.1782, netMargin: 0.1677,
    roe: 0.1196, roic: 0.1282, debtEquity: 0.13, currentRatio: 2.72, asOf: '2026-11-20', sourceId: 'sa-amd',
    businessModel: 'Fabless CPUs (EPYC, Ryzen), Instinct GPUs, embedded (Xilinx). Direct merchant-GPU competitor.',
    comparabilityNote: 'Closest business-model peer, but multiples embed expectations of share gains from a small AI base (MI450/Helios commitments), so its P/E reflects growth optionality rather than current earnings.',
  },
  {
    ticker: 'AVGO', name: 'Broadcom', price: 304.41, marketCapB: 1450, evB: 1490,
    pe: 38.86, forwardPe: 17.52, peg: 0.32, ps: 16.31, pb: 14.58, evEbitda: 28.48, evEbit: 34.22, evFcf: 37.78,
    fcfYield: 0.0271, dividendYield: 0.0085, ttmRevenueB: 89.1, grossMargin: 0.7552, operatingMargin: 0.4881, netMargin: 0.4294,
    roe: 0.4425, roic: 0.3068, debtEquity: 0.6, currentRatio: 2.5, asOf: '2026-11-20', sourceId: 'sa-avgo',
    businessModel: 'Custom AI accelerators (XPUs) for Google, Meta, OpenAI and others; Ethernet networking; infrastructure software (VMware).',
    comparabilityNote: 'Competes with NVIDIA through customers’ in-house chips rather than merchant GPUs. ~Half of profit comes from software, and acquisition amortization depresses GAAP earnings — GAAP P/E overstates its relative expensiveness.',
  },
  {
    ticker: 'INTC', name: 'Intel', price: 51.28, marketCapB: 272.55, evB: 268.37,
    pe: null, forwardPe: 36.84, peg: 0.49, ps: 4.55, pb: 2.37, evEbitda: 14.03, evEbit: 43.43, evFcf: 71.22,
    fcfYield: 0.0138, dividendYield: null, ttmRevenueB: 59.89, grossMargin: 0.4015, operatingMargin: 0.1032, netMargin: -0.2009,
    roe: -0.0962, roic: 0.0491, debtEquity: 0.38, currentRatio: 2.21, asOf: '2026-11-20', sourceId: 'sa-intc',
    businessModel: 'Integrated device manufacturer: x86 CPUs plus a capital-intensive foundry business; Gaudi AI accelerators.',
    comparabilityNote: 'Not a like-for-like peer: owns fabs (heavy capex and depreciation), currently loss-making on a GAAP basis, so P/E is not meaningful and EV/EBITDA flatters it relative to fabless designers.',
  },
  {
    ticker: 'TSM', name: 'Taiwan Semiconductor (ADR)', price: 318.71, marketCapB: 1570, evB: 1490,
    pe: 21.56, forwardPe: 15.26, peg: null, ps: 10.14, pb: 7.17, evEbitda: 13.15, evEbit: 16.52, evFcf: 33.07,
    fcfYield: 0.0285, dividendYield: 0.0141, ttmRevenueB: 155.16, grossMargin: 0.6585, operatingMargin: 0.5796, netMargin: 0.5112,
    roe: 0.4186, roic: 0.6405, debtEquity: 0.15, currentRatio: 2.58, asOf: '2026-11-20', sourceId: 'sa-tsm',
    businessModel: 'Pure-play foundry and advanced packaging (CoWoS) — NVIDIA’s manufacturing partner and a supplier, not a competitor.',
    comparabilityNote: 'Supplier rather than competitor; trades at a Taiwan geopolitical discount and carries far higher capital intensity. Useful as an “AI picks-and-shovels” reference.',
  },
];

export const MARKET_CONTEXT = {
  nasdaq100Nov20: { close: 25028.98, change: -0.0561, fromPeak: -0.1984, sourceId: 'market-selloff-cnbc' },
  sp500Status: { note: 'S&P 500 and Dow closed in correction territory (>10% below records); Nasdaq Composite erased its 2026 gain.', sourceId: 'market-selloff-cnbc' },
  sp500ForwardPe: { value: 18.3, asOf: '2026-11-13', note: 'FactSet Earnings Insight, quoted by FourWeekMBA', sourceId: 'fourweek-nov16' },
};
