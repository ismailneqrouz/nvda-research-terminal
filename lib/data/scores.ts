/**
 * Transparent 1–5 scoring framework. Scores are this platform's qualitative
 * assessment, with the evidence used. They describe the COMPANY and the
 * STOCK separately and never produce a buy/sell recommendation on their own.
 */
export interface ScoreDimension {
  id: string;
  name: string;
  group: 'company' | 'stock';
  score: 1 | 2 | 3 | 4 | 5;
  weight: number;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
  evidence: string[];
  href: string;
}

export const SCORES: ScoreDimension[] = [
  {
    id: 'quality', name: 'Business quality', group: 'company', score: 5, weight: 0.2, confidence: 'high', href: '/business-model',
    explanation: 'Dominant AI-accelerator platform with a full stack (GPU, CPU, NVLink, networking, CUDA software) and very high returns on capital.',
    evidence: ['TTM gross margin 74.9%, operating margin 66.1%', 'ROIC above 100% in FY2024–FY2026 (calculated)', '~75–81% AI-accelerator revenue share in H1 2026 (third-party estimate)'],
  },
  {
    id: 'performance', name: 'Financial performance', group: 'company', score: 5, weight: 0.15, confidence: 'medium', href: '/financial-statements',
    explanation: 'Revenue grew from $26.9B (FY2022) to $361.8B TTM; Q3 FY2027 revenue +103% y/y. Confidence reduced to medium by the reported SEC accounting inquiry.',
    evidence: ['FY2022→FY2026 revenue CAGR 68%', 'TTM FCF $148.7B', 'CFO/NI 0.70 TTM, depressed by working-capital build and non-cash gains'],
  },
  {
    id: 'health', name: 'Financial health', group: 'company', score: 4, weight: 0.1, confidence: 'high', href: '/financial-health',
    explanation: 'Net cash of $65.4B and a current ratio of 4.1×, but $390B of supply commitments and $118B of guarantees are large off-balance-sheet obligations.',
    evidence: ['Debt $32.4B vs cash & liquid securities $97.7B', 'Commitments ≈1.1× TTM revenue', 'Debt rose from $8.5B after a $24.9B issuance in FY2027'],
  },
  {
    id: 'governance', name: 'Management & governance', group: 'company', score: 2, weight: 0.15, confidence: 'medium', href: '/corporate-governance',
    explanation: 'Founder-CEO resigned (Nov 11) and was reinstated (Nov 23) within 11 days; no formal succession plan; ratings-agency commentary questions board independence; reported SEC inquiry and class action pending.',
    evidence: ['8-Ks of Nov 12 and Nov 23, 2026', 'Moody’s outlook cut to stable (Nov 18)', 'Independent chair retained (positive)'],
  },
  {
    id: 'position', name: 'Industry position', group: 'company', score: 4, weight: 0.1, confidence: 'medium', href: '/competition',
    explanation: 'Clear leader, but custom ASICs (Broadcom/Google/Amazon) and AMD rack-scale systems are credible substitutes at the largest buyers.',
    evidence: ['Broadcom: line of sight to >$100B AI chip revenue in 2027', 'AMD: reported 14 GW of commitments', 'Vera Rubin shipping on schedule'],
  },
  {
    id: 'valuation', name: 'Valuation', group: 'stock', score: 4, weight: 0.1, confidence: 'low', href: '/valuation',
    explanation: 'At ≈16× TTM GAAP EPS and a ≈4.1% FCF yield the stock is inexpensive on current earnings; whether that is cheap depends on how cyclical those earnings prove.',
    evidence: ['P/E 16.0×, EV/EBIT ≈14.8× (calculated, Nov 25)', 'Base-case DCF ≈20% below the price; bull case far above', 'Peers: AMD 92×, AVGO 39× trailing P/E (Nov 20)'],
  },
  {
    id: 'risk', name: 'Risk exposure', group: 'stock', score: 2, weight: 0.1, confidence: 'medium', href: '/risk-analysis',
    explanation: 'Unusually wide distribution: governance/accounting uncertainty stacked on cyclical demand, export controls and Taiwan concentration. Lower score = higher risk.',
    evidence: ['Beta 2.25 (5Y monthly; our calculation 2.25)', '5Y max drawdown −63% (2022); −38% from the Oct 6 record close', '1Y Sharpe ≈0.05 vs 0.64 for the S&P 500 ETF'],
  },
  {
    id: 'outlook', name: 'Future outlook', group: 'company', score: 4, weight: 0.1, confidence: 'low', href: '/future-outlook',
    explanation: 'Near-term demand visibility is strong (Q4 guide $130B, FY2028 growth indication ~75%); beyond FY2029 the outcome range is very wide.',
    evidence: ['Hyperscaler Q4 capex guides above Q3', 'Supply commitments secured', 'Margin trough 71–72% guided for Q4'],
  },
];

export function weightedScore(group?: 'company' | 'stock'): number {
  const xs = SCORES.filter((s) => !group || s.group === group);
  const w = xs.reduce((a, s) => a + s.weight, 0);
  return xs.reduce((a, s) => a + s.score * s.weight, 0) / w;
}

export const THREE_QUESTIONS = [
  {
    q: 'Is NVIDIA a high-quality company?',
    a: 'Yes, on economics: exceptional margins, returns on capital, balance-sheet strength and technological leadership. Governance is the weakest dimension after the November 2026 resignation-and-reinstatement episode.',
    tone: 'positive' as const,
  },
  {
    q: 'Is the stock attractively valued?',
    a: 'On trailing numbers it looks inexpensive (≈16× earnings). The market is implicitly pricing a large earnings decline and a governance discount; our base-case DCF is below the current price and the bull case far above, so the answer depends on which assumptions you believe.',
    tone: 'mixed' as const,
  },
  {
    q: 'Is it a suitable investment?',
    a: 'That depends on the investor — time horizon, tolerance for 50%+ drawdowns, portfolio concentration and view on the SEC inquiry. This platform does not make that determination and is not investment advice.',
    tone: 'neutral' as const,
  },
];
