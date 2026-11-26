import { riskReport, type RiskReport, type Window } from '@/lib/finance/risk-report';
import type { PresentData } from './types';

export interface Settings {
  window: Window;
  rfMode: 'hist' | 'fixed';
  rfFixed: number; // annual decimal
  price: number;
  shares: number; // millions
}

export interface Model {
  s: Settings;
  marketCap: number;
  liquid: number;
  ev: number;
  netCash: number;
  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  fcf: number;
  fcfMargin: number;
  fcfYield: number;
  ebitda: number;
  pe: number;
  peExOther: number;
  evEbitda: number;
  earningsYield: number;
  currentRatio: number;
  risk: RiskReport;
}

export function buildModel(d: PresentData, s: Settings): Model {
  const marketCap = s.price * s.shares;
  const liquid = d.cash + d.securities;
  const ev = marketCap + d.debt - liquid;
  const fcf = d.ttmOcf - d.ttmCapex;
  const ebitda = d.ttmOperatingIncome + d.ttmDa;
  const etr = 0.17;
  const recurringNi = d.ttmNetIncome - d.ttmOtherIncome * (1 - etr);
  const risk = riskReport(s.window, s.rfMode === 'fixed' ? s.rfFixed : null, d.monthly);
  return {
    s,
    marketCap,
    liquid,
    ev,
    netCash: liquid - d.debt,
    revenueGrowth: d.ttmRevenue / d.ttmRevenuePrior - 1,
    grossMargin: d.ttmGrossProfit / d.ttmRevenue,
    operatingMargin: d.ttmOperatingIncome / d.ttmRevenue,
    netMargin: d.ttmNetIncome / d.ttmRevenue,
    fcf,
    fcfMargin: fcf / d.ttmRevenue,
    fcfYield: fcf / marketCap,
    ebitda,
    pe: s.price / d.ttmEps,
    peExOther: marketCap / recurringNi,
    evEbitda: ev / ebitda,
    earningsYield: d.ttmNetIncome / marketCap,
    currentRatio: d.currentAssets / d.currentLiabilities,
    risk,
  };
}

/** Traffic-light rating used on the summary slide: rule-of-thumb thresholds, not a verdict. */
export type Light = 'gut' | 'mittel' | 'schwach';
export function light(v: number, good: number, bad: number, higherIsBetter = true): Light {
  if (higherIsBetter) return v >= good ? 'gut' : v <= bad ? 'schwach' : 'mittel';
  return v <= good ? 'gut' : v >= bad ? 'schwach' : 'mittel';
}
