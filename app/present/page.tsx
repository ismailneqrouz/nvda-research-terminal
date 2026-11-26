import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { CONSENSUS, PEERS, PEERS_AS_OF, QUOTE } from '@/lib/data/market';
import { RETURNS_META } from '@/lib/data/returns';
import { SCENARIOS } from '@/lib/data/scenarios';
import { runDcf } from '@/lib/finance/dcf';
import { ttm } from '@/lib/finance/core';
import { PresentationDeck } from '@/components/present/deck';
import type { PresentData } from '@/components/present/types';

export const metadata: Metadata = { title: 'Präsentationsmodus' };

export default async function PresentPage() {
  const { analytics: a, store: s, quarters, monthly } = await getResearchData();
  const t = a.ALL_METRICS.TTM;
  const q = quarters.slice(-8);
  void CONSENSUS;
  const data: PresentData = {
    asOfLabel: 'Schlusskurs Mi., 25. Nov. 2026',
    asOfDate: QUOTE.asOf,
    price: QUOTE.price,
    prevClose: QUOTE.previousClose,
    changePct: QUOTE.changePct,
    recordClose: QUOTE.recordClose,
    shares: QUOTE.sharesOutstanding,
    debt: t.totalDebt!,
    cash: s.val('cash', 'Q3-FY27')!,
    securities: s.val('marketableSecurities', 'Q3-FY27')!,
    nonMarketable: s.val('nonMarketable', 'Q3-FY27')!,
    fy26Revenue: s.val('revenue', 'FY2026')!,
    nineM27Revenue: s.val('revenue', '9M-FY27')!,
    nineM26Revenue: s.val('revenue', '9M-FY26')!,
    ttmRevenue: t.revenue!,
    ttmRevenuePrior: a.quarterTtm('revenue', 'Q3-FY26')!,
    ttmGrossProfit: a.flowValue('grossProfit', 'TTM')!,
    ttmOperatingIncome: a.flowValue('operatingIncome', 'TTM')!,
    ttmNetIncome: a.flowValue('netIncome', 'TTM')!,
    ttmOtherIncome: a.flowValue('totalOther', 'TTM')!,
    ttmDa: a.flowValue('dna', 'TTM')!,
    ttmOcf: a.flowValue('ocf', 'TTM')!,
    ttmCapex: Math.abs(a.flowValue('capex', 'TTM')!),
    ttmEps: ttm(s.val('epsDiluted', 'FY2026'), s.val('epsDiluted', '9M-FY27'), s.val('epsDiluted', '9M-FY26'))!,
    fy26Eps: s.val('epsDiluted', 'FY2026')!,
    nineM27Eps: s.val('epsDiluted', '9M-FY27')!,
    nineM26Eps: s.val('epsDiluted', '9M-FY26')!,
    equity: s.val('equity', 'Q3-FY27')!,
    currentAssets: s.val('totalCurrentAssets', 'Q3-FY27')!,
    currentLiabilities: s.val('totalCurrentLiabilities', 'Q3-FY27')!,
    quarters: q.map((x) => ({ label: x.label.replace(' FY', '/'), revenue: x.revenue, grossMargin: x.grossProfit / x.revenue, operatingMargin: x.operatingIncome / x.revenue })),
    peers: PEERS.map((p) => ({ ticker: p.ticker, pe: p.pe, evEbitda: p.evEbitda, fcfYield: p.fcfYield })),
    peersAsOf: PEERS_AS_OF,
    tenYear: 0.0512,
    monthly,
    yahooBeta: QUOTE.beta5y,
    dcf: { bull: runDcf(SCENARIOS.bull.inputs).perShare, base: runDcf(SCENARIOS.base.inputs).perShare, bear: runDcf(SCENARIOS.bear.inputs).perShare },
    novMtd: RETURNS_META.nvdaNovMtd,
  };
  return <PresentationDeck data={data} />;
}
