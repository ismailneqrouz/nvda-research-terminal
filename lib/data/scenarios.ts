import type { DcfInputs } from '../finance/dcf';
import { GUIDANCE, val } from './financials';

/**
 * DCF anchors (reported / guidance-derived) and scenario assumption sets.
 * Assumption values are this platform's own and are labelled as such in the UI.
 */
const nineMonth = val('revenue', '9M-FY27')!;
export const FY27E_REVENUE = nineMonth + GUIDANCE.q4fy27.revenue; // 9M actual + Q4 guidance midpoint (calculated)

export const BALANCE_ANCHORS = {
  cashAndLiquid: val('cash', 'Q3-FY27')! + val('marketableSecurities', 'Q3-FY27')!,
  nonMarketable: val('nonMarketable', 'Q3-FY27')!,
  debt: val('longTermDebt', 'Q3-FY27')! + val('shortTermDebt', 'Q3-FY27')!,
  dilutedShares: val('sharesDiluted', 'Q3-FY27')!,
};

const common = {
  baseRevenue: FY27E_REVENUE,
  years: 10,
  startMargin: 0.63, // ≈ Q4 FY27 guidance: 71.5% GM − ~8.5% opex ratio
  marginYears: 5,
  taxRate: 0.17, // midpoint of FY27 GAAP guidance 16–18%
  daPct: 0.012,
  capexPct: 0.025,
  cash: BALANCE_ANCHORS.cashAndLiquid,
  nonOperatingAssets: BALANCE_ANCHORS.nonMarketable,
  debt: BALANCE_ANCHORS.debt,
  dilutedShares: BALANCE_ANCHORS.dilutedShares,
  midYear: true,
};

export type ScenarioKey = 'bull' | 'base' | 'bear';

export interface Scenario {
  key: ScenarioKey;
  name: string;
  tagline: string;
  narrative: string;
  inputs: DcfInputs;
  catalysts: string[];
  invalidation: string[];
  earnings: string;
  fcfNote: string;
  valuationNote: string;
}

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  bull: {
    key: 'bull',
    name: 'Bull case',
    tagline: 'AI build-out continues; NVIDIA keeps platform leadership',
    narrative:
      'Hyperscaler and sovereign capex keep rising through calendar 2027–28; Vera Rubin and its successors hold performance-per-watt leadership; price increases fully offset memory inflation; governance questions close without restatement.',
    inputs: { ...common, g1: 0.6, g2: 0.2, g3: 0.08, terminalGrowth: 0.035, targetMargin: 0.58, nwcPct: 0.18, wacc: 0.1 },
    catalysts: ['FY2028 growth near management’s ~75% indication', 'SEC inquiry closed with no action', 'Permanent CEO from the internal technical bench', 'Gross margin back above 74% after price increases'],
    invalidation: ['Two consecutive quarters of hyperscaler capex cuts', 'Data Center gross margin below 68%', 'Restatement of any reported period'],
    earnings: 'After-tax operating earnings per share grow ≈18% a year through FY2030, then mid-single digits (share count held constant in the model).',
    fcfNote: 'FCF margin ≈43–46%; working capital absorbs ~18% of incremental revenue.',
    valuationNote: 'WACC 10% (risk premium normalises), terminal growth 3.5%.',
  },
  base: {
    key: 'base',
    name: 'Base case',
    tagline: 'Strong FY2028, then cyclical normalisation and more competition',
    narrative:
      'FY2028 grows strongly on committed Rubin demand but below management’s indication; growth then stalls and revenue declines modestly in FY2031–32 as the capex cycle digests and custom ASICs take share; operating margin normalises toward 50%.',
    inputs: { ...common, g1: 0.4, g2: 0.08, g3: -0.06, terminalGrowth: 0.03, targetMargin: 0.5, nwcPct: 0.2, wacc: 0.11 },
    catalysts: ['Continued beat-and-raise into FY2028', 'Clarity on SEC inquiry scope', 'Stable hyperscaler capex guidance for 2027'],
    invalidation: ['FY2028 revenue growth below 15%', 'Operating margin below 45% before FY2030', 'Evidence of material misstatement'],
    earnings: 'After-tax operating earnings per share peak around FY2030, then decline with margins.',
    fcfNote: 'FCF margin ≈43–45% through FY2031, settling near 40%.',
    valuationNote: 'WACC 11% (elevated governance/cycle premium), terminal growth 3%.',
  },
  bear: {
    key: 'bear',
    name: 'Bear case',
    tagline: 'Demand slowdown, pricing pressure and a governance discount',
    narrative:
      'AI-infrastructure spending peaks in calendar 2027; custom silicon and AMD erode share and pricing; export controls and the SEC inquiry weigh on sentiment; supply commitments create inventory charges; operating margin falls toward the high-30s.',
    inputs: { ...common, g1: 0.05, g2: -0.15, g3: -0.08, terminalGrowth: 0.025, targetMargin: 0.38, nwcPct: 0.2, wacc: 0.125 },
    catalysts: ['Hyperscaler capex cuts', 'Restatement or enforcement action', 'TPU/Trainium external adoption at scale'],
    invalidation: ['FY2028 growth above 40% with stable margins', 'SEC inquiry closed', 'Capex guidance raised for 2027–28'],
    earnings: 'After-tax operating earnings per share fall by roughly half from FY2027E levels by FY2031.',
    fcfNote: 'FCF margin falls from ≈46% to ≈30%; working-capital release partly cushions cash flow in down years.',
    valuationNote: 'WACC 12.5%, terminal growth 2.5%.',
  },
};

/** Subjective scenario weights used only to illustrate a probability-weighted value. */
export const SCENARIO_WEIGHTS: Record<ScenarioKey, number> = { bull: 0.25, base: 0.5, bear: 0.25 };
