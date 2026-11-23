import { describe, expect, it } from 'vitest';
import {
  cagr, cashConversionCycle, costOfEquity, days, enterpriseValue, freeCashFlow, growth, interestCoverage,
  investedCapital, margin, marginOfSafety, netDebt, nopat, roic, safeDiv, ttm, upside, wacc,
} from '@/lib/finance/core';

describe('core primitives', () => {
  it('safeDiv returns null on zero / missing denominators', () => {
    expect(safeDiv(1, 0)).toBeNull();
    expect(safeDiv(null, 2)).toBeNull();
    expect(safeDiv(6, 3)).toBe(2);
  });

  it('margins', () => {
    expect(margin(86676, 115844)).toBeCloseTo(0.7482, 4); // Q3 FY27 GAAP gross margin 74.8%
    expect(margin(77520, 115844)).toBeCloseTo(0.6692, 4);
    expect(margin(1, null)).toBeNull();
  });

  it('growth rates use |previous| and reject a zero base', () => {
    expect(growth(130497, 60922)).toBeCloseTo(1.142, 3); // FY2025 revenue +114%
    expect(growth(115844, 57006)).toBeCloseTo(1.032, 3); // Q3 FY27 y/y +103%
    expect(growth(5, 0)).toBeNull();
    expect(growth(-50, -100)).toBeCloseTo(0.5, 6); // loss narrowed → positive
  });

  it('CAGR', () => {
    expect(cagr(26914, 215938, 4)).toBeCloseTo(0.683, 3);
    expect(cagr(-1, 10, 3)).toBeNull();
  });

  it('free cash flow accepts signed or unsigned capex', () => {
    expect(freeCashFlow(102718, -6042)).toBe(96676);
    expect(freeCashFlow(102718, 6042)).toBe(96676);
    expect(freeCashFlow(null, 1)).toBeNull();
  });

  it('TTM = FY + YTD current − YTD prior', () => {
    expect(ttm(215938, 293681, 147811)).toBe(361808);
    expect(ttm(1, null, 1)).toBeNull();
  });

  it('net debt (negative = net cash)', () => {
    expect(netDebt(32371, 29089, 68642)).toBe(-65360);
    expect(netDebt(10, 2)).toBe(8);
  });

  it('enterprise value', () => {
    const ev = enterpriseValue({ marketCap: 125.53 * 24150, totalDebt: 32371, cash: 29089, liquidInvestments: 68642 });
    expect(ev! / 1e6).toBeCloseTo(2.966, 3); // ≈ $2.97T, matches StockAnalysis
    expect(enterpriseValue({ marketCap: 100, totalDebt: 10, cash: 5, leaseLiabilities: 3, minorityInterest: 2 })).toBe(110);
  });

  it('NOPAT, invested capital and ROIC', () => {
    expect(nopat(100, 0.2)).toBe(80);
    const ic = investedCapital({ equity: 100, totalDebt: 20, leaseLiabilities: 5, cash: 15, liquidInvestments: 10, nonOperatingInvestments: 0 });
    expect(ic).toBe(100);
    expect(roic(30, 80, 120)).toBeCloseTo(0.3, 6);
    expect(roic(30, -10, -20)).toBeNull(); // negative capital → undefined
  });

  it('working-capital days and CCC', () => {
    expect(days(100, 365)).toBeCloseTo(100, 6);
    expect(cashConversionCycle(90, 60, 30)).toBe(120);
  });

  it('interest coverage uses absolute interest expense', () => {
    expect(interestCoverage(130387, -259)).toBeCloseTo(503.4, 1);
    expect(interestCoverage(10, 0)).toBeNull();
  });

  it('upside and margin of safety', () => {
    expect(upside(150, 100)).toBeCloseTo(0.5, 6);
    expect(marginOfSafety(200, 150)).toBeCloseTo(0.25, 6);
    expect(marginOfSafety(100, 150)).toBeCloseTo(-0.5, 6);
  });

  it('CAPM and WACC', () => {
    expect(costOfEquity(0.05, 1.5, 0.045)).toBeCloseTo(0.1175, 6);
    expect(wacc({ equityValue: 90, debtValue: 10, costOfEquity: 0.12, preTaxCostOfDebt: 0.05, taxRate: 0.2 })).toBeCloseTo(0.112, 6);
  });
});
