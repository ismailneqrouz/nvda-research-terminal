import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { SEGMENTS_ANNUAL, SEGMENTS_FY27 } from '@/lib/data/financials';
import { HEADWINDS, INDUSTRY_FACTS, TAILWINDS } from '@/lib/data/context';
import { pct, usdM } from '@/lib/format';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';

export const metadata: Metadata = { title: 'Industry Analysis' };

const TOPICS = [
  { t: 'Semiconductor industry structure', b: 'Design (NVIDIA, AMD, Broadcom, Qualcomm) is separated from manufacturing (TSMC, Samsung, Intel Foundry). Leading-edge logic is effectively a TSMC monopoly; equipment (ASML EUV) and memory (three HBM suppliers) are oligopolies. Profit pools concentrate where substitution is hardest.' },
  { t: 'AI accelerator market', b: 'Merchant GPUs (NVIDIA, AMD) compete with captive ASICs designed by hyperscalers with Broadcom/Marvell. Training favours flexible GPUs; high-volume inference is where ASICs are most competitive.' },
  { t: 'Training vs inference', b: 'Agentic and reasoning workloads multiply inference tokens; inference now drives most incremental demand. That shifts the buying criterion toward cost-per-token and perf/W — favouring both NVIDIA’s newest racks and specialised ASICs.' },
  { t: 'Data-center infrastructure & cloud investment', b: 'Hyperscaler capex is the demand signal. Big-4 plans of ≈$725B for 2026 (+77% y/y) and Q4 2026 guidance above Q3 indicate no slowdown yet; Alphabet flagged a significant increase for 2027.' },
  { t: 'Manufacturing capacity & foundry dependence', b: 'All NVIDIA leading-edge GPUs are made by TSMC, mostly in Taiwan. TSMC Arizona and Japan add diversification only gradually.' },
  { t: 'Advanced packaging', b: 'CoWoS packaging (combining GPU dies with HBM) has been the binding constraint on AI-accelerator supply since 2023; NVIDIA is the largest customer.' },
  { t: 'Memory supply', b: 'HBM is supply-constrained and rising in price; NVIDIA’s supply commitments rose to $390B “primarily related to the multi-year procurement of memory”. Microsoft attributed ≈$25B of its 2026 capex to memory/component inflation.' },
  { t: 'Energy & data-center constraints', b: 'Grid interconnection, power prices and permitting increasingly gate deployments. NVIDIA’s guarantees for partner campuses tie revenue timing to building readiness.' },
];

export default async function IndustryPage() {
  const { store: s } = await getResearchData();
  const dc = SEGMENTS_ANNUAL.map((y) => ({ label: y.key, dc: y.dataCenter }));
  const capex = [
    { label: '2025 (actual, big-4)', v: 410000 },
    { label: '2026 (guidance, big-4)', v: 725000 },
  ];

  return (
    <>
      <PageHeader title="Industry Analysis" description="The semiconductor and AI-infrastructure industry NVIDIA operates in: structure, demand drivers, supply bottlenecks, cycles and market-size estimates — with observed data separated from forecasts." />

      <SectionTitle>Demand: who is spending</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
        <Panel title="Hyperscaler capex (Google, Microsoft, Amazon, Meta)" subtitle="Calendar years; 2026 = company guidance aggregated by the FT" sourceIds={['capex-toms']}>
          <SeriesChart data={capex} series={[{ key: 'v', name: 'Capital expenditure' }]} format="usdM" height={200} showTableToggle={false} />
          <div className="mt-1 flex gap-2"><StatusBadge status="reported" /><StatusBadge status="guidance" /></div>
        </Panel>
        <Panel title="NVIDIA Data Center revenue" subtitle="Fiscal years (end Jan); FY2027 Q3 alone: $107.6B" sourceIds={['nvda-10k', 'nvda-q4fy26-pr', 'nvda-q3fy27-pr']}>
          <SeriesChart data={dc} series={[{ key: 'dc', name: 'Data Center revenue' }]} format="usdM" height={200} showTableToggle={false} />
        </Panel>
        <Panel bodyClass="p-0" title="Industry data points">
          <table className="tbl">
            <tbody>
              {INDUSTRY_FACTS.map((f) => (
                <tr key={f.label}>
                  <td className="whitespace-normal text-muted">{f.label}</td>
                  <td className="whitespace-normal">{f.value}</td>
                  <td className="whitespace-nowrap text-right text-[10.5px] text-faint">{f.kind} <SourceRef ids={f.sourceId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>TAM, SAM and SOM</SectionTitle>
      <Callout tone="neutral" title="Actual market size vs forecasts">
        NVIDIA management and research firms publish multi-year total-addressable-market forecasts; none is an observed market size, and this platform does not adopt any of them. The table distinguishes what is measured from what is projected.
      </Callout>
      <div className="mt-4 overflow-x-auto rounded border border-line">
        <table className="tbl min-w-[800px]">
          <thead><tr><th>Layer</th><th>Definition used here</th><th>Value</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="font-medium">TAM (proxy)</td><td className="text-muted">Data-center capital spending of the four largest US hyperscalers, 2026</td><td className="num">≈$725B</td><td><StatusBadge status="guidance" /> <SourceRef ids="capex-toms" /></td></tr>
            <tr><td className="font-medium">SAM (proxy)</td><td className="text-muted">Portion spent on accelerated compute & networking (vs buildings, power, CPUs, storage)</td><td className="text-faint italic">Data unavailable — no reliable public split</td><td><StatusBadge status="estimate" /></td></tr>
            <tr><td className="font-medium">SOM (actual)</td><td className="text-muted">NVIDIA Data Center revenue (all customers, not only the big four)</td><td className="num">FY2026 {usdM(193700)} · Q3 FY2027 {usdM(SEGMENTS_FY27.dataCenter)} ({usdM(SEGMENTS_FY27.dataCenter * 4)} annualized)</td><td><StatusBadge status="reported" /> <StatusBadge status="calculated" /> <SourceRef ids={['nvda-q4fy26-pr', 'nvda-q3fy27-pr']} /></td></tr>
            <tr><td className="font-medium">Custom ASIC forecast</td><td className="text-muted">Broadcom “line of sight” to AI chip revenue in 2027</td><td className="num">&gt;$100B</td><td><StatusBadge status="estimate" /> <SourceRef ids="asic-toms" /></td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-faint">A trailing-four-quarter Data Center figure is not shown because Q1 FY2027 segment revenue was not available in the sources used. Annualizing one quarter (×4) is a simple calculation, not a forecast. TAM/SAM proxies and NVIDIA revenue are not like-for-like: NVIDIA also sells to neoclouds, sovereigns and enterprises outside the big four.</p>

      <SectionTitle>Industry structure and bottlenecks</SectionTitle>
      <div className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2">
        {TOPICS.map((x) => (
          <div key={x.t} className="bg-panel p-4">
            <div className="mb-1 text-[13px] font-semibold">{x.t}</div>
            <p className="text-[12.5px] leading-5 text-muted">{x.b}</p>
          </div>
        ))}
      </div>

      <SectionTitle>Cycles, tailwinds and headwinds</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Industry cycles in NVIDIA’s own history" right={<StatusBadge status="reported" />}>
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>FY2023: revenue flat ({pct(s.val('revenue', 'FY2023')! / s.val('revenue', 'FY2022')! - 1, 1, true)}) after crypto/gaming digestion; gross margin fell to {pct(s.val('grossProfit', 'FY2023')! / s.val('revenue', 'FY2023')!)} on inventory charges.</li>
            <li>FY2024–FY2027: AI build-out; revenue ×{(361808 / s.val('revenue', 'FY2023')!).toFixed(0)} from FY2023 to TTM.</li>
            <li>2022 share-price drawdown ≈66% peak-to-trough — the market has priced a cycle before.</li>
          </ul>
        </Panel>
        <Panel title="Structural tailwinds" right={<StatusBadge status="assessment" />}>
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">{TAILWINDS.map((t) => <li key={t}>{t}</li>)}</ul>
        </Panel>
        <Panel title="Structural headwinds" right={<StatusBadge status="assessment" />}>
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">{HEADWINDS.map((t) => <li key={t}>{t}</li>)}</ul>
        </Panel>
      </div>
      <Interpretation label="Supply, demand and technology disruption">
        <p>Through 2026 the industry has been supply-constrained (CoWoS, HBM, power) rather than demand-constrained, which is why NVIDIA could raise prices and lock in multi-year supply. The classic semiconductor cycle turns when supply catches up with demand that was partly pulled forward. Leading indicators to watch: GPU rental prices, hyperscaler capex guidance for 2027, HBM contract pricing and NVIDIA’s own inventory days. Technology disruption risk comes less from a new chip than from software that makes hardware interchangeable.</p>
      </Interpretation>
    </>
  );
}
