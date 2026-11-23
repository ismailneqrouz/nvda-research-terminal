import type { LineItem, Period, Quarter } from './schema';

/**
 * NVIDIA consolidated financial statements, USD millions (per-share in USD,
 * shares in millions). Fiscal years end on the last Sunday of January:
 * FY2026 = Jan 27, 2025 → Jan 25, 2026. Per-share data and share counts for
 * FY2022–FY2024 are restated for the 10-for-1 stock split of June 2024.
 *
 * Every value below was transcribed from the filing / source named on its
 * period. Rows marked `calculated` are derived from reported figures by the
 * identities documented on the row.
 */

// ── Periods ─────────────────────────────────────────────────────────────
export const FLOW_PERIODS: Period[] = [
  { key: 'FY2022', label: 'FY2022', kind: 'annual', end: '2022-01-30', months: 12, sourceId: 'nvda-10k' },
  { key: 'FY2023', label: 'FY2023', kind: 'annual', end: '2023-01-29', months: 12, sourceId: 'nvda-10k' },
  { key: 'FY2024', label: 'FY2024', kind: 'annual', end: '2024-01-28', months: 12, sourceId: 'nvda-10k' },
  { key: 'FY2025', label: 'FY2025', kind: 'annual', end: '2025-01-26', months: 12, sourceId: 'nvda-q4fy26-pr' },
  { key: 'FY2026', label: 'FY2026', kind: 'annual', end: '2026-01-25', months: 12, sourceId: 'nvda-q4fy26-pr' },
  { key: '9M-FY26', label: '9M FY2026', kind: 'ytd', end: '2025-10-26', months: 9, sourceId: 'nvda-q3fy27-pr' },
  { key: '9M-FY27', label: '9M FY2027', kind: 'ytd', end: '2026-10-25', months: 9, sourceId: 'nvda-q3fy27-pr' },
  { key: 'Q3-FY26', label: 'Q3 FY2026', kind: 'quarter', end: '2025-10-26', months: 3, sourceId: 'nvda-q3fy27-pr' },
  { key: 'Q3-FY27', label: 'Q3 FY2027', kind: 'quarter', end: '2026-10-25', months: 3, sourceId: 'nvda-q3fy27-pr' },
];

export const BALANCE_PERIODS: Period[] = [
  { key: 'FY2022', label: 'Jan 30, 2022', kind: 'instant', end: '2022-01-30', sourceId: 'sa-nvda-bs' },
  { key: 'FY2023', label: 'Jan 29, 2023', kind: 'instant', end: '2023-01-29', sourceId: 'sa-nvda-bs' },
  { key: 'FY2024', label: 'Jan 28, 2024', kind: 'instant', end: '2024-01-28', sourceId: 'sa-nvda-bs' },
  { key: 'FY2025', label: 'Jan 26, 2025', kind: 'instant', end: '2025-01-26', sourceId: 'sa-nvda-bs' },
  { key: 'FY2026', label: 'Jan 25, 2026', kind: 'instant', end: '2026-01-25', sourceId: 'nvda-q3fy27-pr' },
  { key: 'Q3-FY27', label: 'Oct 25, 2026', kind: 'instant', end: '2026-10-25', sourceId: 'nvda-q3fy27-pr' },
];

export const ANNUAL_KEYS = ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026'] as const;
export type AnnualKey = (typeof ANNUAL_KEYS)[number];
export const LATEST_BS = 'Q3-FY27';
export const LATEST_QUARTER = 'Q3-FY27';

const FK = FLOW_PERIODS.map((p) => p.key);
const BK = BALANCE_PERIODS.map((p) => p.key);

type Vals = (number | null)[];
function zip(keys: string[], vals: Vals): Record<string, number | null> {
  if (keys.length !== vals.length) throw new Error(`Column mismatch: ${keys.length} vs ${vals.length}`);
  return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
}
function flow(id: string, label: string, statement: 'income' | 'cashflow', vals: Vals, extra: Partial<LineItem> = {}): LineItem {
  return { id, label, statement, values: zip(FK, vals), unit: 'usd_m', status: 'reported', level: 1, emphasis: false, ...extra };
}
function bal(id: string, label: string, vals: Vals, extra: Partial<LineItem> = {}): LineItem {
  return { id, label, statement: 'balance', values: zip(BK, vals), unit: 'usd_m', status: 'reported', level: 1, emphasis: false, ...extra };
}
/** Derive a balancing row: total minus the sum of listed components, per period. */
function residual(keys: string[], total: LineItem, parts: LineItem[]): Vals {
  return keys.map((k) => {
    const t = total.values[k];
    if (t == null) return null;
    let s = 0;
    for (const p of parts) {
      const v = p.values[k];
      if (v == null) return null;
      s += v;
    }
    return t - s;
  });
}

// ── Income statement ───────────────────────────────────────────────────
//                         FY22    FY23    FY24     FY25     FY26    9M26    9M27    Q3-26   Q3-27
const revenue = flow('revenue', 'Revenue', 'income', [26914, 26974, 60922, 130497, 215938, 147811, 293681, 57006, 115844], { emphasis: true, level: 0 });
const cogs = flow('costOfRevenue', 'Cost of revenue', 'income', [9439, 11618, 16621, 32639, 62475, 45441, 73705, 15157, 29168]);
const grossProfit = flow('grossProfit', 'Gross profit', 'income', [17475, 15356, 44301, 97858, 153463, 102370, 219976, 41849, 86676], { emphasis: true, level: 0 });
const rnd = flow('rnd', 'Research and development', 'income', [5268, 7339, 8675, 12914, 18497, 12985, 20829, 4705, 7454]);
const sga = flow('sga', 'Sales, general and administrative', 'income', [2166, 2440, 2654, 3491, 4579, 3297, 4356, 1134, 1702], {
  note: 'NVIDIA reports sales & marketing and G&A as one combined line; a separate sales & marketing figure is not disclosed.',
});
const acqTerm = flow('acqTermination', 'Acquisition termination cost', 'income', [0, 1353, 0, 0, 0, 0, 0, 0, 0], {
  note: 'One-time write-off of the prepayment for the terminated Arm acquisition (FY2023).',
});
const opex = flow('totalOpex', 'Total operating expenses', 'income', [7434, 11132, 11329, 16405, 23076, 16282, 25185, 5839, 9156], { level: 0 });
const opInc = flow('operatingIncome', 'Operating income', 'income', [10041, 4224, 32972, 81453, 130387, 86088, 194791, 36010, 77520], { emphasis: true, level: 0 });
const intInc = flow('interestIncome', 'Interest income', 'income', [29, 267, 866, 1786, 2300, null, null, null, null], {
  level: 2,
  note: 'Interim press releases report only total other income; quarterly split not disclosed there.',
});
const intExp = flow('interestExpense', 'Interest expense', 'income', [-236, -262, -257, -247, -259, null, null, null, null], { level: 2 });
const otherNet = flow('otherNet', 'Other, net (incl. equity-security gains)', 'income', [107, -48, 237, 1034, 9022, null, null, null, null], { level: 2 });
const totalOther = flow('totalOther', 'Total other income (expense), net', 'income', [-100, -43, 846, 2573, 11063, 4964, 25636, 1926, 1497], {
  note: '9M FY2027 includes $25.5B of net gains on equity securities (cash-flow statement), a largely non-operating, non-recurring item.',
});
const pretax = flow('pretaxIncome', 'Income before income tax', 'income', [9941, 4181, 33818, 84026, 141450, 91052, 220427, 37936, 79017], { level: 0 });
const tax = flow('incomeTax', 'Income tax expense (benefit)', 'income', [189, -187, 4058, 11146, 21383, 13945, 37130, 6026, 13730]);
const netIncome = flow('netIncome', 'Net income', 'income', [9752, 4368, 29760, 72880, 120067, 77107, 183297, 31910, 65287], { emphasis: true, level: 0 });
const epsBasic = flow('epsBasic', 'EPS — basic', 'income', [0.391, 0.176, 1.205, 2.97, 4.93, 3.16, 7.58, 1.31, 2.71], { unit: 'usd' });
const epsDiluted = flow('epsDiluted', 'EPS — diluted', 'income', [0.385, 0.174, 1.193, 2.94, 4.9, 3.14, 7.55, 1.3, 2.7], { unit: 'usd', emphasis: true });
const sharesBasic = flow('sharesBasic', 'Weighted avg. shares — basic', 'income', [24960, 24870, 24690, 24555, 24359, 24378, 24194, 24327, 24106], { unit: 'shares_m' });
const sharesDiluted = flow('sharesDiluted', 'Weighted avg. shares — diluted', 'income', [25350, 25070, 24940, 24804, 24514, 24542, 24287, 24483, 24186], { unit: 'shares_m' });
const dna = flow('dna', 'Depreciation and amortization', 'income', [1174, 1544, 1508, 1864, 2843, 2031, 3378, 752, 1254], {
  note: 'From the cash-flow statement; NVIDIA does not present D&A as a separate income-statement line.',
});
const ebitda = flow(
  'ebitda',
  'EBITDA (calculated)',
  'income',
  FK.map((k) => (opInc.values[k] ?? 0) + (dna.values[k] ?? 0)),
  { status: 'calculated', emphasis: true, note: 'Calculated: operating income + depreciation & amortization. Not a reported GAAP measure.' },
);

export const INCOME_STATEMENT: LineItem[] = [
  revenue, cogs, grossProfit, rnd, sga, acqTerm, opex, opInc, intInc, intExp, otherNet, totalOther,
  pretax, tax, netIncome, epsBasic, epsDiluted, sharesBasic, sharesDiluted, dna, ebitda,
];

// ── Cash-flow statement ────────────────────────────────────────────────
const cfNI = flow('cfNetIncome', 'Net income', 'cashflow', FK.map((k) => netIncome.values[k]), { level: 0 });
const cfDna = flow('cfDna', 'Depreciation and amortization', 'cashflow', FK.map((k) => dna.values[k]));
const sbc = flow('sbc', 'Stock-based compensation', 'cashflow', [2004, 2709, 3549, 4737, 6386, 4753, 6042, 1655, 2088]);
const dAR = flow('chgReceivables', 'Change in accounts receivable', 'cashflow', [-2215, 822, -6172, -13063, -15399, -10325, -42642, -5583, -18052], { level: 2 });
const dInv = flow('chgInventory', 'Change in inventories', 'cashflow', [-774, -2554, -98, -4781, -11324, -9703, -18352, -4823, -8148], { level: 2 });
const dAP = flow('chgPayables', 'Change in accounts payable', 'cashflow', [568, -551, 1531, 3357, 3096, 2032, 8550, -223, 4424], { level: 2 });
const dOther = flow('chgOtherWc', 'Change in other operating assets & liabilities', 'cashflow', [-942, 76, 1017, 5104, 7678, 6372, 5687, 1372, 2182], {
  level: 2,
  note: 'Sum of prepaid & other assets, accrued & other current liabilities and other long-term liabilities.',
});
const dWC = flow(
  'chgWorkingCapital',
  'Changes in working capital (total)',
  'cashflow',
  FK.map((k) => (dAR.values[k] ?? 0) + (dInv.values[k] ?? 0) + (dAP.values[k] ?? 0) + (dOther.values[k] ?? 0)),
  { status: 'calculated' },
);
const ocf = flow('ocf', 'Net cash from operating activities', 'cashflow', [9108, 5641, 28090, 64089, 102718, 66530, 122675, 23750, 48253], { emphasis: true, level: 0 });
const otherNonCash = flow(
  'otherNonCash',
  'Other non-cash items (deferred tax, equity-security gains, other)',
  'cashflow',
  residual(FK, ocf, [cfNI, cfDna, sbc, dWC]),
  { status: 'calculated', note: 'Calculated as operating cash flow less every other operating line. Large negative values in FY2026/FY2027 reflect gains on equity securities that are non-cash.' },
);
const capex = flow('capex', 'Capital expenditures (PP&E and intangibles)', 'cashflow', [-976, -1833, -1069, -3236, -6042, -4758, -8856, -1637, -4422]);
const acq = flow('acquisitions', 'Acquisitions, net of cash acquired', 'cashflow', [-263, -49, -83, -1007, -1535, -1370, -3031, -694, -2718]);
const icf = flow('icf', 'Net cash from investing activities', 'cashflow', [-9830, 7375, -10566, -20421, -52228, -21367, -45864, -9025, -10739], { emphasis: true, level: 0 });
const otherInv = flow('otherInvesting', 'Securities purchases/sales and other investing', 'cashflow', residual(FK, icf, [capex, acq]), {
  status: 'calculated',
  note: 'Calculated residual. FY2026 includes the $13.0B payment to Groq, Inc. for technology licensing / assets.',
});
const debtIss = flow('debtIssued', 'Debt issuance, net', 'cashflow', [4977, 0, 0, 0, 0, 0, 24896, 0, 0]);
const debtRep = flow('debtRepaid', 'Debt repayment', 'cashflow', [-1000, 0, -1250, -1250, 0, 0, -1000, 0, -1000]);
const buyback = flow('buybacks', 'Share repurchases', 'cashflow', [0, -10039, -9533, -33706, -40086, -36271, -61166, -12456, -22122], { emphasis: true });
const empTax = flow('employeeTax', 'Employee stock-plan tax payments', 'cashflow', [-1874, -1475, -2783, -6930, -7948, -5809, -6238, -2429, -1707], {
  note: 'Cash paid to tax authorities on vesting RSUs (net share settlement) — economically similar to a buyback.',
});
const divs = flow('dividends', 'Dividends paid', 'cashflow', [-399, -398, -395, -834, -974, -732, -12316, -243, -6026]);
const fcfFin = flow('fcf_fin', 'Net cash from financing activities', 'cashflow', [1865, -11617, -13633, -42359, -48474, -42266, -58327, -14878, -30868], { emphasis: true, level: 0 });
const otherFin = flow('otherFinancing', 'Other financing (employee plan proceeds, Groq, other)', 'cashflow', residual(FK, fcfFin, [debtIss, debtRep, buyback, empTax, divs]), {
  status: 'calculated',
});
const netChange = flow('netChangeCash', 'Net change in cash & equivalents', 'cashflow', [1143, 1399, 3891, 1309, 2016, 2897, 18484, -153, 6646], { emphasis: true, level: 0 });
const fcf = flow('fcf', 'Free cash flow (calculated)', 'cashflow', FK.map((k) => (ocf.values[k] ?? 0) + (capex.values[k] ?? 0)), {
  status: 'calculated',
  emphasis: true,
  level: 0,
  note: 'Free cash flow = operating cash flow − capital expenditures.',
});

export const CASH_FLOW: LineItem[] = [
  cfNI, cfDna, sbc, otherNonCash, dAR, dInv, dAP, dOther, dWC, ocf, capex, acq, otherInv, icf,
  debtIss, debtRep, buyback, empTax, divs, otherFin, fcfFin, netChange, fcf,
];

// ── Balance sheet ──────────────────────────────────────────────────────
//                       FY22   FY23   FY24   FY25    FY26    Q3-FY27
const cash = bal('cash', 'Cash and cash equivalents', [1990, 3389, 7280, 8589, 10605, 29089]);
const mkt = bal('marketableSecurities', 'Marketable securities (debt + equity)', [19218, 9907, 18704, 34621, 51951, 68642], {
  note: 'Oct 25, 2026: $24.4B marketable debt + $44.2B marketable equity securities. Jan 25, 2026: $39.1B debt + $12.9B equity.',
});
const ar = bal('receivables', 'Accounts receivable, net', [4650, 3827, 9999, 23065, 38466, 81033]);
const inv = bal('inventory', 'Inventories', [2605, 5159, 5282, 10080, 21403, 39724]);
const prepaid = bal('otherCurrentAssets', 'Prepaid expenses & other current assets', [366, 791, 3080, 3771, 3180, 3506]);
const tca = bal('totalCurrentAssets', 'Total current assets', [28829, 23073, 44345, 80126, 125605, 221994], { emphasis: true, level: 0 });
const ppe = bal('ppe', 'Property and equipment, net', [2778, 3807, 3914, 6283, 10383, 19227]);
const opl = bal('operatingLeaseAssets', 'Operating lease assets', [829, 1038, 1346, 1793, 2867, 6383]);
const gw = bal('goodwill', 'Goodwill', [4349, 4372, 4430, 5188, 20832, 26451]);
const intang = bal('intangibles', 'Intangible assets, net', [2339, 1676, 1112, 807, 3306, 4056]);
const nonMkt = bal('nonMarketable', 'Non-marketable & long-term investments', [266, 299, 1321, 3387, 22251, 65528], {
  note: 'Private-company stakes carried at cost/fair value; illiquid. Rose sharply as NVIDIA invested in AI-ecosystem companies.',
});
const ta = bal('totalAssets', 'Total assets', [44187, 41182, 65728, 111601, 206803, 372188], { emphasis: true, level: 0 });
const otherNca = bal('otherNonCurrentAssets', 'Deferred tax & other non-current assets', residual(BK, ta, [tca, ppe, opl, gw, intang, nonMkt]), { status: 'calculated' });

const ap = bal('payables', 'Accounts payable', [1783, 1193, 2699, 6310, 9812, 21074]);
const accrued = bal('accrued', 'Accrued & other current liabilities', [2552, 4120, 6682, 11737, 21352, 33287]);
const std = bal('shortTermDebt', 'Short-term debt', [0, 1250, 1250, 0, 999, 0]);
const tcl = bal('totalCurrentLiabilities', 'Total current liabilities', [4335, 6563, 10631, 18047, 32163, 54361], { emphasis: true, level: 0 });
const ltd = bal('longTermDebt', 'Long-term debt', [10946, 9703, 8459, 8463, 7469, 32371]);
const ltl = bal('leaseLiabilities', 'Long-term operating lease liabilities', [741, 902, 1119, 1519, 2572, 5777]);
const tl = bal('totalLiabilities', 'Total liabilities', [17575, 19081, 22750, 32274, 49510, 105522], { emphasis: true, level: 0 });
const otherLtl = bal('otherLtLiabilities', 'Other long-term liabilities', residual(BK, tl, [tcl, ltd, ltl]), { status: 'calculated' });
const equity = bal('equity', "Shareholders' equity", [26612, 22101, 42978, 79327, 157293, 266666], { emphasis: true, level: 0 });
const re = bal('retainedEarnings', 'Retained earnings', [16235, 10171, 29817, 68038, 146973, null], {
  note: 'Not presented in the condensed Q3 FY2027 press-release balance sheet.',
});
const sharesOut = bal('sharesOutstanding', 'Common shares outstanding (period end)', [25060, 24660, 24640, 24477, 24304, 24150], {
  unit: 'shares_m',
  note: 'Latest column: 24.15B shares per StockAnalysis (most recent 10-Q cover count), not the Oct 25 balance-sheet date.',
});

export const BALANCE_SHEET: LineItem[] = [
  cash, mkt, ar, inv, prepaid, tca, ppe, opl, gw, intang, nonMkt, otherNca, ta,
  ap, accrued, std, tcl, ltd, ltl, otherLtl, tl, equity, re, sharesOut,
];

// ── Quarterly series ───────────────────────────────────────────────────
export const QUARTERS: Quarter[] = [
  { key: 'Q3-FY25', label: "Q3 FY25", end: '2024-10-27', revenue: 35082, grossProfit: 26156, operatingIncome: 21869, netIncome: 19309, dilutedEps: 0.78, freeCashFlow: 16814, sourceId: 'sa-nvda-q' },
  { key: 'Q4-FY25', label: "Q4 FY25", end: '2025-01-26', revenue: 39331, grossProfit: 28723, operatingIncome: 24034, netIncome: 22091, dilutedEps: 0.89, freeCashFlow: 15552, sourceId: 'sa-nvda-q' },
  { key: 'Q1-FY26', label: "Q1 FY26", end: '2025-04-27', revenue: 44062, grossProfit: 26668, operatingIncome: 21638, netIncome: 18775, dilutedEps: 0.76, freeCashFlow: 26187, sourceId: 'sa-nvda-q' },
  { key: 'Q2-FY26', label: "Q2 FY26", end: '2025-07-27', revenue: 46743, grossProfit: 33853, operatingIncome: 28440, netIncome: 26422, dilutedEps: 1.08, freeCashFlow: 13470, sourceId: 'sa-nvda-q' },
  { key: 'Q3-FY26', label: "Q3 FY26", end: '2025-10-26', revenue: 57006, grossProfit: 41849, operatingIncome: 36010, netIncome: 31910, dilutedEps: 1.3, freeCashFlow: 22113, sourceId: 'nvda-q3fy27-pr' },
  { key: 'Q4-FY26', label: "Q4 FY26", end: '2026-01-25', revenue: 68127, grossProfit: 51093, operatingIncome: 44299, netIncome: 42960, dilutedEps: 1.76, freeCashFlow: 34904, sourceId: 'nvda-q4fy26-pr' },
  { key: 'Q1-FY27', label: "Q1 FY27", end: '2026-04-26', revenue: 81615, grossProfit: 61157, operatingIncome: 53536, netIncome: 58321, dilutedEps: 2.39, freeCashFlow: 48587, sourceId: 'sa-nvda-q' },
  { key: 'Q2-FY27', label: "Q2 FY27", end: '2026-07-26', revenue: 96221, grossProfit: 72142, operatingIncome: 63734, netIncome: 59688, dilutedEps: 2.46, freeCashFlow: 21400, sourceId: 'sa-nvda-q' },
  { key: 'Q3-FY27', label: "Q3 FY27", end: '2026-10-25', revenue: 115844, grossProfit: 86676, operatingIncome: 77520, netIncome: 65287, dilutedEps: 2.7, freeCashFlow: 43831, sourceId: 'nvda-q3fy27-pr' },
];

// ── Segment / market-platform revenue ──────────────────────────────────
export interface SegmentYear {
  key: string;
  dataCenter: number;
  gaming: number;
  proViz: number;
  automotive: number;
  oemOther: number | null;
  precision: 'millions' | 'billions';
  sourceId: string;
}
export const SEGMENTS_ANNUAL: SegmentYear[] = [
  { key: 'FY2022', dataCenter: 10613, gaming: 12462, proViz: 2111, automotive: 566, oemOther: 1162, precision: 'millions', sourceId: 'nvda-10k' },
  { key: 'FY2023', dataCenter: 15005, gaming: 9067, proViz: 1544, automotive: 903, oemOther: 455, precision: 'millions', sourceId: 'nvda-10k' },
  { key: 'FY2024', dataCenter: 47525, gaming: 10447, proViz: 1553, automotive: 1091, oemOther: 306, precision: 'millions', sourceId: 'nvda-10k' },
  { key: 'FY2025', dataCenter: 115186, gaming: 11350, proViz: 1878, automotive: 1694, oemOther: 389, precision: 'millions', sourceId: 'nvda-10k' },
  // FY2026 platform revenue is disclosed to one decimal of a billion; OEM & Other is the calculated remainder.
  { key: 'FY2026', dataCenter: 193700, gaming: 16000, proViz: 3200, automotive: 2300, oemOther: 738, precision: 'billions', sourceId: 'nvda-q4fy26-pr' },
];

/** From Q1 FY2027 NVIDIA reports two segments: Data Center and Edge Computing. */
export const SEGMENTS_FY27 = {
  period: 'Q3 FY2027',
  dataCenter: 107600,
  edgeComputing: 8200,
  dataCenterYoY: 1.1,
  edgeYoY: 0.42,
  hyperscale: 60100,
  chinaHopper: 2400,
  sourceIds: ['nvda-q3fy27-pr', 'nvda-q3fy27-cfo', 'q3-xeno'],
};

// ── Guidance & commitments (management disclosures) ────────────────────
export const GUIDANCE = {
  q4fy27: {
    revenue: 130000,
    revenueRange: 0.03,
    grossMarginLow: 0.71,
    grossMarginHigh: 0.72,
    opexGaap: 11000,
    taxLow: 0.16,
    taxHigh: 0.18,
    note: 'Q4 FY2027 includes an extra (14th) week. No China Data Center compute revenue assumed.',
    sourceId: 'nvda-q3fy27-pr',
  },
  fy28GrowthComment: {
    text: 'Management raised its fiscal 2028 revenue-growth outlook to approximately 75% (earnings call commentary).',
    sourceId: 'nvda-q3fy27-call',
  },
  supplyCommitments: 390000,
  supplyCommitmentsPrior: 279000,
  totalCommitments: 518000,
  guarantees: 118000,
  buybackRemaining: 227300,
  quarterlyDividend: 0.25,
  commitmentsSourceIds: ['nvda-q3fy27-cfo', 'futurum-q3'],
};

// ── Helpers ────────────────────────────────────────────────────────────
export const ALL_LINES: LineItem[] = [...INCOME_STATEMENT, ...CASH_FLOW, ...BALANCE_SHEET];
const LINE_MAP = Object.fromEntries(ALL_LINES.map((l) => [l.id, l]));

export function line(id: string): LineItem {
  const l = LINE_MAP[id];
  if (!l) throw new Error(`Unknown line item: ${id}`);
  return l;
}
export function val(id: string, period: string): number | null {
  return line(id).values[period] ?? null;
}
/** Annual series for one line in chronological order. */
export function annualSeries(id: string): { period: string; value: number | null }[] {
  return ANNUAL_KEYS.map((k) => ({ period: k, value: val(id, k) }));
}
