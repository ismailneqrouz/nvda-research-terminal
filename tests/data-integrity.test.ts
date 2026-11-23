import { describe, expect, it } from 'vitest';
import { ANNUAL_KEYS, BALANCE_PERIODS, BALANCE_SHEET, CASH_FLOW, FLOW_PERIODS, INCOME_STATEMENT, QUARTERS, SEGMENTS_ANNUAL, val } from '@/lib/data/financials';
import { SOURCE_MAP } from '@/lib/data/sources';
import { validateDataset } from '@/lib/data/validate';
import { NEWS } from '@/lib/data/news';
import { RISKS } from '@/lib/data/risks';

const flowKeys = FLOW_PERIODS.map((p) => p.key);
const balKeys = BALANCE_PERIODS.map((p) => p.key);

describe('statement identities hold for every reported period', () => {
  it.each(flowKeys)('income statement ties out (%s)', (k) => {
    expect(val('revenue', k)! - val('costOfRevenue', k)!).toBe(val('grossProfit', k));
    expect(val('grossProfit', k)! - val('totalOpex', k)!).toBe(val('operatingIncome', k));
    expect(val('rnd', k)! + val('sga', k)! + val('acqTermination', k)!).toBe(val('totalOpex', k));
    expect(val('operatingIncome', k)! + val('totalOther', k)!).toBe(val('pretaxIncome', k));
    expect(val('pretaxIncome', k)! - val('incomeTax', k)!).toBe(val('netIncome', k));
  });

  it.each(flowKeys)('diluted EPS ≈ net income / diluted shares (%s)', (k) => {
    expect(val('netIncome', k)! / val('sharesDiluted', k)!).toBeCloseTo(val('epsDiluted', k)!, 2);
  });

  it.each(flowKeys)('cash flows sum to the net change in cash (%s)', (k) => {
    expect(val('ocf', k)! + val('icf', k)! + val('fcf_fin', k)!).toBe(val('netChangeCash', k));
  });

  it.each(ANNUAL_KEYS.slice(0, 4))('annual interest/other components tie to total other (%s)', (k) => {
    expect(val('interestIncome', k)! + val('interestExpense', k)! + val('otherNet', k)!).toBe(val('totalOther', k));
  });

  it.each(balKeys)('balance sheet balances (%s)', (k) => {
    const cur = ['cash', 'marketableSecurities', 'receivables', 'inventory', 'otherCurrentAssets'].reduce((s, id) => s + val(id, k)!, 0);
    expect(cur).toBe(val('totalCurrentAssets', k));
    expect(val('payables', k)! + val('accrued', k)! + val('shortTermDebt', k)!).toBe(val('totalCurrentLiabilities', k));
    expect(val('totalLiabilities', k)! + val('equity', k)!).toBe(val('totalAssets', k));
    expect(val('otherNonCurrentAssets', k)!).toBeGreaterThan(0);
  });

  it('nine-month + annual figures agree with the quarterly series', () => {
    const q = (key: string) => QUARTERS.find((x) => x.key === key)!;
    expect(q('Q1-FY27').revenue + q('Q2-FY27').revenue + q('Q3-FY27').revenue).toBeCloseTo(val('revenue', '9M-FY27')!, -1);
    expect(q('Q1-FY26').revenue + q('Q2-FY26').revenue + q('Q3-FY26').revenue + q('Q4-FY26').revenue).toBe(val('revenue', 'FY2026'));
    expect(q('Q3-FY27').freeCashFlow).toBe(val('fcf', 'Q3-FY27'));
  });

  it('market-platform revenue sums to total revenue', () => {
    for (const s of SEGMENTS_ANNUAL) {
      const total = s.dataCenter + s.gaming + s.proViz + s.automotive + (s.oemOther ?? 0);
      expect(total).toBe(val('revenue', s.key));
    }
  });
});

describe('source integrity', () => {
  it('every referenced source id exists', () => {
    const ids = new Set<string>();
    [...FLOW_PERIODS, ...BALANCE_PERIODS].forEach((p) => ids.add(p.sourceId));
    QUARTERS.forEach((q) => ids.add(q.sourceId));
    NEWS.forEach((n) => n.sourceIds.forEach((s) => ids.add(s)));
    RISKS.forEach((r) => r.sourceIds.forEach((s) => ids.add(s)));
    for (const id of ids) expect(SOURCE_MAP[id], id).toBeDefined();
  });

  it('every line item has a value slot for every period of its statement', () => {
    for (const l of [...INCOME_STATEMENT, ...CASH_FLOW]) expect(Object.keys(l.values).sort()).toEqual([...flowKeys].sort());
    for (const l of BALANCE_SHEET) expect(Object.keys(l.values).sort()).toEqual([...balKeys].sort());
  });

  it('the full dataset passes Zod validation', () => {
    expect(() => validateDataset()).not.toThrow();
  });
});
