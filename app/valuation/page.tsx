import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { CONSENSUS, PEERS, PEERS_AS_OF, PROVIDER_NVDA, QUOTE } from '@/lib/data/market';
import { SCENARIOS } from '@/lib/data/scenarios';
import { cn, mult, pct, usd, usdM } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { Term } from '@/components/data/term';
import { DcfModel } from '@/components/tools/dcf-model';
import { runDcf } from '@/lib/finance/dcf';

export const metadata: Metadata = { title: 'Valuation' };

type Key = 'pe' | 'forwardPe' | 'peg' | 'ps' | 'pb' | 'evEbitda' | 'evEbit' | 'evFcf' | 'fcfYield' | 'dividendYield';
const ROWS: { key: Key; label: string; term: string; isPct?: boolean; providerKey?: keyof typeof PROVIDER_NVDA }[] = [
  { key: 'pe', label: 'P/E (TTM)', term: 'pe', providerKey: 'pe' },
  { key: 'forwardPe', label: 'Forward P/E', term: 'forward-pe', providerKey: 'forwardPe' },
  { key: 'peg', label: 'PEG', term: 'peg', providerKey: 'peg' },
  { key: 'ps', label: 'Price / sales', term: 'ps', providerKey: 'ps' },
  { key: 'pb', label: 'Price / book', term: 'pb', providerKey: 'pb' },
  { key: 'evEbitda', label: 'EV / EBITDA', term: 'ev-ebitda', providerKey: 'evEbitda' },
  { key: 'evEbit', label: 'EV / EBIT', term: 'ev-ebit', providerKey: 'evEbit' },
  { key: 'evFcf', label: 'EV / FCF', term: 'ev-fcf', providerKey: 'evFcf' },
  { key: 'fcfYield', label: 'FCF yield', term: 'fcf-yield', isPct: true, providerKey: 'fcfYield' },
  { key: 'dividendYield', label: 'Dividend yield', term: 'dividend-yield', isPct: true, providerKey: 'dividendYield' },
];

export default async function ValuationPage() {
  const { analytics: a } = await getResearchData();
  const v = a.valuationSnapshot();
  const bear = runDcf(SCENARIOS.bear.inputs).perShare / QUOTE.price - 1;
  const bull = runDcf(SCENARIOS.bull.inputs).perShare / QUOTE.price - 1;
  const base = runDcf(SCENARIOS.base.inputs).perShare / QUOTE.price - 1;
  const f = (x: number | null | undefined, isPct?: boolean) => (x == null ? null : isPct ? pct(x, 2) : mult(x, x < 1 ? 2 : 1));
  const peerVals = (k: Key) => PEERS.map((p) => p[k] as number | null);
  const median = (xs: (number | null)[]) => {
    const s = xs.filter((x): x is number => x != null).sort((x, y) => x - y);
    if (!s.length) return null;
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  return (
    <>
      <PageHeader
        title="Valuation & Intrinsic Value"
        description="Relative valuation against semiconductor and AI-infrastructure peers, and a fully interactive discounted-cash-flow model with sensitivity analysis. Market multiples are calculated by this platform and cross-checked against an independent provider."
      />
      <MetricGrid>
        <Metric label="Price" value={usd(QUOTE.price)} sub={QUOTE.asOfLabel} status="market" sourceIds={QUOTE.sourceIds} />
        <Metric label="Market cap" value={usdM(v.marketCap)} status="calculated" sourceIds={['sa-nvda-stats']} />
        <Metric label="Enterprise value" termId="ev" value={usdM(v.enterpriseValue)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="P/E (TTM, GAAP)" termId="pe" value={mult(v.pe)} sub={`ex. other income ${mult(v.peExOther)}`} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Earnings yield" value={pct(v.earningsYield)} sub="vs 10Y UST ≈5.1%" status="calculated" sourceIds={['yields-nov26']} />
        <Metric label="Analyst avg. target" value={usd(CONSENSUS.priceTargetAvg)} sub={`Yahoo Nov 25: $${CONSENSUS.priceTargetAvgLatest} · range $${CONSENSUS.priceTargetLow}–$${CONSENSUS.priceTargetHigh}`} status="estimate" sourceIds={[CONSENSUS.sourceId]} />
      </MetricGrid>

      <SectionTitle>Relative valuation</SectionTitle>
      <Panel title="Multiples vs peers" subtitle={`NVDA calculated by this platform from filings and the ${QUOTE.asOfLabel.replace('Close, ', '')} close; peers from StockAnalysis (TTM, ${PEERS_AS_OF} — latest consistent provider snapshot)`} bodyClass="p-0" sourceIds={['sa-nvda-stats', 'sa-amd', 'sa-avgo', 'sa-intc', 'sa-tsm']}>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[900px]">
            <thead>
              <tr>
                <th>Multiple</th>
                <th className="n text-ink">NVDA <StatusBadge status="calculated" /></th>
                <th className="n">NVDA (provider, Nov 20)</th>
                {PEERS.map((p) => <th key={p.ticker} className="n">{p.ticker}</th>)}
                <th className="n">Peer median</th>
                <th className="n">NVDA vs median</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const ours = v[r.key] as number | null;
                const med = median(peerVals(r.key));
                const rel = ours != null && med != null ? ours / med - 1 : null;
                const cheaper = rel == null ? null : r.isPct ? rel > 0 : rel < 0;
                return (
                  <tr key={r.key}>
                    <td><Term id={r.term}>{r.label}</Term></td>
                    <td className="n font-medium text-ink">{f(ours, r.isPct) ?? '—'}</td>
                    <td className="n text-faint">{r.providerKey ? f(PROVIDER_NVDA[r.providerKey] as number, r.isPct) : '—'}</td>
                    {PEERS.map((p) => <td key={p.ticker} className="n text-muted">{f(p[r.key] as number | null, r.isPct) ?? <span className="text-faint">n/m</span>}</td>)}
                    <td className="n">{f(med, r.isPct) ?? '—'}</td>
                    <td className={cn('n', cheaper == null ? '' : cheaper ? 'text-up' : 'text-down')}>{rel == null ? '—' : `${rel > 0 ? '+' : '−'}${Math.abs(rel * 100).toFixed(0)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[11px] leading-5 text-faint">
          NVDA forward P/E uses FY2027 consensus non-GAAP EPS of ${CONSENSUS.fy2027EpsAvg} (fiscal year ending Jan 2027); the provider’s 8.65× uses a later forward period. PEG uses consensus FY2027 EPS growth. Green = NVDA cheaper than peer median on that measure. n/m = not meaningful (negative earnings).
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Where peer comparisons mislead">
          <div className="space-y-3">
            {PEERS.map((p) => (
              <div key={p.ticker}>
                <div className="text-[12.5px] font-medium">{p.name} <span className="text-faint">({p.ticker}) <SourceRef ids={p.sourceId} /></span></div>
                <p className="text-[12px] leading-5 text-muted">{p.comparabilityNote}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Reading the multiples" right={<StatusBadge status="assessment" />}>
          <div className="prose-research">
            <p>On every earnings- and cash-flow-based multiple NVIDIA is now <strong>cheaper than its peer median and than the S&P 500</strong> (≈18× forward earnings); only price-to-book and dividend yield look less favourable, despite the highest margins and growth in the group. Peers’ higher multiples largely reflect expectations of share gains (AMD) or durable software-like profits (Broadcom).</p>
            <p>A low multiple on a company growing &gt;90% is the market’s way of saying it does not trust the durability of current earnings: it treats FY2027 as a cyclical peak, and adds a discount for leadership and accounting uncertainty. Multiples cannot settle whether that is right — the DCF below makes the required assumptions explicit.</p>
          </div>
        </Panel>
      </div>

      <SectionTitle id="dcf">Discounted cash flow</SectionTitle>
      <Callout tone="warn" title="Model output, not fact">
        Intrinsic value depends entirely on the assumptions you set. Presets are this platform’s scenarios; the base case deliberately includes a cyclical revenue decline after FY2030. The reverse-DCF line shows the steady-state margin the current price implies.
      </Callout>
      <div className="mt-4">
        <Suspense fallback={<div className="h-[600px] animate-pulse rounded bg-panel" />}>
          <DcfModel scenarios={SCENARIOS} price={QUOTE.price} marketCap={v.marketCap} baseFiscalYear={2027} />
        </Suspense>
      </div>
      <Interpretation label="Valuation risk">
        <p>The base case is {pct(base, 0, true)} versus the market price; the bear and bull cases span {pct(bear, 0, true)} to {pct(bull, 0, true)} versus the current price. That asymmetry is the honest summary: the stock is not obviously expensive on today’s cash flows, but intrinsic value is extremely sensitive to the steady-state margin — a variable NVIDIA’s competitors and customers are actively trying to lower.</p>
      </Interpretation>
    </>
  );
}
