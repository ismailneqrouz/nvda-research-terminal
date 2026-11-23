import { describe, expect, it } from 'vitest';
import { DcfError, growthPath, marginPath, perShareOrNull, runDcf, sensitivity, steps, type DcfInputs } from '@/lib/finance/dcf';
import { SCENARIOS } from '@/lib/data/scenarios';

const simple: DcfInputs = {
  baseRevenue: 1000, g1: 0.04, g2: 0.04, g3: 0.04, terminalGrowth: 0.04, years: 6,
  startMargin: 0.2, targetMargin: 0.2, marginYears: 1, taxRate: 0.25, daPct: 0, capexPct: 0, nwcPct: 0,
  wacc: 0.09, cash: 0, nonOperatingAssets: 0, debt: 0, dilutedShares: 100, midYear: false,
};

describe('DCF engine', () => {
  it('growth path: stage structure and linear fade to terminal growth', () => {
    const g = growthPath({ g1: 0.5, g2: 0.2, g3: 0.1, terminalGrowth: 0.03, years: 10 });
    expect(g).toHaveLength(10);
    expect(g.slice(0, 5)).toEqual([0.5, 0.2, 0.2, 0.1, 0.1]);
    expect(g[9]).toBeCloseTo(0.03, 10);
    expect(g[7]).toBeCloseTo(0.1 + (0.03 - 0.1) * 0.6, 10);
  });

  it('margin path reaches the target after marginYears and stays flat', () => {
    const m = marginPath({ startMargin: 0.6, targetMargin: 0.5, marginYears: 5, years: 7 });
    expect(m[0]).toBeCloseTo(0.58, 10);
    expect(m[4]).toBeCloseTo(0.5, 10);
    expect(m[6]).toBeCloseTo(0.5, 10);
  });

  it('matches a hand-computed constant-growth case (growing annuity + Gordon terminal value)', () => {
    // FCFF_t = 1000·1.04^t · 0.2 · 0.75 = 150·1.04^t ; r = 9%, g = 4%
    const r = runDcf(simple);
    let pv = 0;
    for (let t = 1; t <= 6; t++) pv += (150 * Math.pow(1.04, t)) / Math.pow(1.09, t);
    const tv = (150 * Math.pow(1.04, 7)) / (0.09 - 0.04);
    const ev = pv + tv / Math.pow(1.09, 6);
    expect(r.sumPv).toBeCloseTo(pv, 6);
    expect(r.terminalValue).toBeCloseTo(tv, 6);
    expect(r.enterpriseValue).toBeCloseTo(ev, 6);
    // Constant growth from t=1 collapses to a single perpetuity: FCFF₁ / (r − g)
    expect(r.enterpriseValue).toBeCloseTo(156 / 0.05, 6);
    expect(r.perShare).toBeCloseTo(ev / 100, 6);
  });

  it('bridges EV to equity with cash, non-operating assets and debt', () => {
    const a = runDcf(simple);
    const b = runDcf({ ...simple, cash: 500, nonOperatingAssets: 200, debt: 300 });
    expect(b.equityValue - a.equityValue).toBeCloseTo(400, 6);
  });

  it('working capital and capex reduce FCFF; D&A increases it', () => {
    const y = runDcf({ ...simple, nwcPct: 0.2, capexPct: 0.05, daPct: 0.02 }).years[0];
    expect(y.deltaNwc).toBeCloseTo(40 * 0.2, 6);
    expect(y.fcff).toBeCloseTo(1040 * 0.2 * 0.75 + 1040 * 0.02 - 1040 * 0.05 - 8, 6);
  });

  it('mid-year convention raises value by ≈ (1+WACC)^0.5', () => {
    const end = runDcf(simple).sumPv;
    const mid = runDcf({ ...simple, midYear: true }).sumPv;
    expect(mid / end).toBeCloseTo(Math.sqrt(1.09), 6);
  });

  it('rejects WACC ≤ terminal growth and implausible inputs', () => {
    expect(() => runDcf({ ...simple, wacc: 0.04 })).toThrow(DcfError);
    expect(() => runDcf({ ...simple, terminalGrowth: 0.07, wacc: 0.2 })).toThrow(DcfError);
    expect(() => runDcf({ ...simple, years: 3 })).toThrow(DcfError);
    expect(perShareOrNull({ ...simple, wacc: 0.03 })).toBeNull();
  });

  it('intrinsic value falls monotonically as WACC rises', () => {
    const base = SCENARIOS.base.inputs;
    const vals = [0.09, 0.1, 0.11, 0.12, 0.13].map((w) => runDcf({ ...base, wacc: w }).perShare);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeLessThan(vals[i - 1]);
  });

  it('scenario ordering: bear < base < bull', () => {
    const v = (k: 'bull' | 'base' | 'bear') => runDcf(SCENARIOS[k].inputs).perShare;
    expect(v('bear')).toBeLessThan(v('base'));
    expect(v('base')).toBeLessThan(v('bull'));
  });
});

describe('sensitivity analysis', () => {
  it('builds a grid whose centre equals the base case, with null for invalid cells', () => {
    const base = SCENARIOS.base.inputs;
    const grid = sensitivity(base, 'wacc', steps(base.wacc, 0.01, 2), 'terminalGrowth', steps(base.terminalGrowth, 0.005, 2), { row: 'WACC', col: 'g' });
    expect(grid.values).toHaveLength(5);
    expect(grid.values[2][2]).toBeCloseTo(runDcf(base).perShare, 8);
    // higher g → higher value along a row; higher WACC → lower value down a column
    expect(grid.values[2][4]!).toBeGreaterThan(grid.values[2][0]!);
    expect(grid.values[4][2]!).toBeLessThan(grid.values[0][2]!);
    const bad = sensitivity(base, 'wacc', [0.02], 'terminalGrowth', [0.03], { row: 'WACC', col: 'g' });
    expect(bad.values[0][0]).toBeNull();
  });

  it('steps() is symmetric and rounding-safe', () => {
    expect(steps(0.11, 0.01, 2)).toEqual([0.09, 0.1, 0.11, 0.12, 0.13]);
  });
});
