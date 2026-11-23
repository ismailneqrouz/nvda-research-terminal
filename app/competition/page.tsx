import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { COMPETITORS, MARKET_SHARE } from '@/lib/data/context';
import { PEERS } from '@/lib/data/market';
import { cn, pct } from '@/lib/format';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';

export const metadata: Metadata = { title: 'Competition & Market' };

const CRITERIA: { key: keyof (typeof COMPETITORS)[number]; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'product', label: 'Current products' },
  { key: 'performance', label: 'Technological performance' },
  { key: 'software', label: 'Software ecosystem' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'efficiency', label: 'Energy efficiency' },
  { key: 'availability', label: 'Availability' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'adoption', label: 'Customer adoption' },
  { key: 'positioning', label: 'Market positioning' },
];

export default async function CompetitionPage() {
  const { analytics: a } = await getResearchData();
  const t = a.ALL_METRICS.TTM;
  const fin = [
    { label: 'NVDA', rev: t.revenue! / 1000, gm: t.grossMargin, om: t.operatingMargin },
    ...PEERS.map((p) => ({ label: p.ticker, rev: p.ttmRevenueB, gm: p.grossMargin, om: p.operatingMargin })),
  ];

  return (
    <>
      <PageHeader title="Competition & Market" description="Merchant GPUs, custom ASICs built by the hyperscalers, and other accelerators — compared on technology, software, price, efficiency, availability and adoption. Market-share figures are shown only with their source and reliability." />

      <Callout tone="warn" title="No official market-share statistics exist">
        AI-accelerator share is estimated by analysts and research firms with differing definitions (revenue vs units vs installed compute; merchant vs captive chips). This platform does not compute its own share figure.
      </Callout>

      <SectionTitle>Competitive comparison</SectionTitle>
      <Panel bodyClass="p-0" title="AI accelerator landscape" subtitle="Qualitative where no comparable public benchmark exists; “Data unavailable” where no reliable source was found." right={<StatusBadge status="assessment" />}>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[1300px]">
            <thead>
              <tr><th className="sticky left-0 z-10 bg-[rgb(17,23,31)]">Criterion</th>{COMPETITORS.map((c) => <th key={c.name} className={cn(c.name === 'NVIDIA' && 'text-up')}>{c.name} <SourceRef ids={c.sourceIds} /></th>)}</tr>
            </thead>
            <tbody>
              {CRITERIA.map((cr) => (
                <tr key={cr.key}>
                  <td className="sticky left-0 z-10 bg-panel font-medium">{cr.label}</td>
                  {COMPETITORS.map((c) => {
                    const v = String(c[cr.key]);
                    return <td key={c.name} className={cn('whitespace-normal text-[12px] leading-5', v === 'Data unavailable' ? 'italic text-faint' : 'text-ink/85')}>{v}</td>;
                  })}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 bg-panel font-medium">Threat to NVIDIA</td>
                {COMPETITORS.map((c) => (
                  <td key={c.name}>{c.name === 'NVIDIA' ? '—' : <span className={cn('rounded-[3px] px-1.5 py-px text-[10.5px] uppercase tracking-wider', c.threat === 'high' ? 'bg-down/15 text-down' : c.threat === 'moderate' ? 'bg-warn/15 text-warn' : 'bg-raised text-muted')}>{c.threat}</span>}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <SectionTitle>Market share — reported estimates</SectionTitle>
      <Panel bodyClass="p-0" title="Third-party estimates and forecasts">
        <table className="tbl">
          <thead><tr><th>Claim</th><th>Source</th><th>Type</th><th>Reliability</th></tr></thead>
          <tbody>
            {MARKET_SHARE.map((m) => (
              <tr key={m.claim}>
                <td className="whitespace-normal">{m.claim}</td>
                <td className="text-muted">{m.source} <SourceRef ids={m.sourceId} /></td>
                <td className="text-[11.5px] text-muted">{/forecast|projected/i.test(m.claim) ? 'Forecast' : /opinion/i.test(m.source) ? 'Analysis' : 'Estimate'}</td>
                <td className={cn('capitalize', m.reliability === 'low' ? 'text-warn' : 'text-muted')}>{m.reliability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <SectionTitle>Financial scale of listed competitors</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="TTM revenue" subtitle="USD billions; NVDA calculated, peers StockAnalysis (Nov 20, 2026)" sourceIds={['sa-amd', 'sa-avgo', 'sa-intc', 'sa-tsm']}>
          <SeriesChart data={fin.map((f) => ({ label: f.label, rev: f.rev == null ? null : f.rev * 1000 }))} series={[{ key: 'rev', name: 'TTM revenue' }]} format="usdM" height={220} />
        </Panel>
        <Panel title="Gross and operating margin (TTM)">
          <SeriesChart data={fin.map((f) => ({ label: f.label, gm: f.gm, om: f.om }))} series={[{ key: 'gm', name: 'Gross margin' }, { key: 'om', name: 'Operating margin' }]} format="pct" height={220} />
        </Panel>
      </div>
      <p className="mt-2 text-[11px] text-faint">Google, Amazon and Microsoft do not report accelerator revenue separately; their chips are captive. TSMC is a supplier, shown for scale. NVDA operating margin TTM: {pct(t.operatingMargin)}.</p>

      <Interpretation>
        <p><strong>The real competitive threat is customers, not AMD.</strong> The largest buyers — Google, Amazon, Microsoft, Meta, OpenAI — all fund custom silicon, mostly through Broadcom and Marvell, aimed at inference cost. These chips need not beat NVIDIA; they need to be good enough for the buyer’s own workloads at lower total cost. AMD’s rack-scale Helios matters as a second source that gives buyers pricing leverage.</p>
        <p><strong>NVIDIA’s defence is the system, not the chip:</strong> NVLink scale-up, networking, CUDA software and an annual cadence make it the safest choice for frontier training and for customers without in-house silicon teams (neoclouds, sovereigns, enterprises). Expect share to erode gradually at hyperscalers while the absolute market keeps growing — the investment question is how fast pricing power erodes with it.</p>
      </Interpretation>
    </>
  );
}
