import type { Metadata } from 'next';
import { SCENARIOS, SCENARIO_WEIGHTS, type ScenarioKey, FY27E_REVENUE } from '@/lib/data/scenarios';
import { GUIDANCE, val } from '@/lib/data/financials';
import { CONSENSUS, QUOTE } from '@/lib/data/market';
import { runDcf } from '@/lib/finance/dcf';
import { cn, pct, usd, usdM } from '@/lib/format';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';
import { ScenarioExplorer, type ScenarioView } from '@/components/tools/scenario-explorer';

export const metadata: Metadata = { title: 'Future Outlook' };

export default function OutlookPage() {
  const keys: ScenarioKey[] = ['bull', 'base', 'bear'];
  const views: ScenarioView[] = keys.map((k) => {
    const s = SCENARIOS[k];
    const r = runDcf(s.inputs);
    const years = r.years.slice(0, 5).map((y) => ({
      fy: `FY${2027 + y.year}`,
      revenue: y.revenue,
      growth: y.growth,
      margin: y.margin,
      nopat: y.nopat,
      nopatPerShare: y.nopat / s.inputs.dilutedShares,
      fcff: y.fcff,
      fcfMargin: y.fcff / y.revenue,
    }));
    const iv = r.perShare;
    const yield3 = Math.pow(iv / QUOTE.price, 1 / 3) - 1 + (GUIDANCE.quarterlyDividend * 4) / QUOTE.price;
    return {
      key: k, name: s.name, tagline: s.tagline, narrative: s.narrative, catalysts: s.catalysts, invalidation: s.invalidation,
      earnings: s.earnings, fcfNote: s.fcfNote, valuationNote: s.valuationNote, years, intrinsic: iv,
      upside: iv / QUOTE.price - 1, annualized3y: yield3, weight: SCENARIO_WEIGHTS[k],
      inputs: { g1: s.inputs.g1, g2: s.inputs.g2, g3: s.inputs.g3, targetMargin: s.inputs.targetMargin, wacc: s.inputs.wacc, tg: s.inputs.terminalGrowth },
    };
  });
  const paths = ['FY2023', 'FY2024', 'FY2025', 'FY2026'].map((k) => ({ label: k, hist: val('revenue', k), bull: null as number | null, base: null as number | null, bear: null as number | null }));
  paths.push({ label: 'FY2027E', hist: FY27E_REVENUE, bull: FY27E_REVENUE, base: FY27E_REVENUE, bear: FY27E_REVENUE });
  for (let i = 0; i < 5; i++) paths.push({ label: `FY${2028 + i}`, hist: null, bull: views[0].years[i].revenue, base: views[1].years[i].revenue, bear: views[2].years[i].revenue });
  const weighted = views.reduce((s, v) => s + v.intrinsic * v.weight, 0);

  return (
    <>
      <PageHeader title="Future Outlook" description="Three explicit scenarios — bull, base and bear — each defined by revenue, margin, cash-flow and valuation assumptions, the intrinsic value they imply, what would trigger them and what would prove them wrong." />
      <Callout tone="neutral" title="Assumptions, not predictions">
        Scenario values come from this platform’s DCF using the labelled inputs; they can be edited on the <a className="link" href="/valuation#dcf">Valuation</a> page. Management guidance and consensus are shown separately for comparison.
      </Callout>

      <SectionTitle>Anchors from management and analysts</SectionTitle>
      <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Anchor label="Q4 FY2027 revenue guidance" value={`${usdM(GUIDANCE.q4fy27.revenue)} ±3%`} status="guidance" src="nvda-q3fy27-pr" note="Includes an extra week; no China DC compute." />
        <Anchor label="FY2027E revenue (9M + guide midpoint)" value={usdM(FY27E_REVENUE)} status="calculated" src="nvda-q3fy27-pr" note={`Consensus ${usdM(CONSENSUS.fy2027RevenueAvg)}`} />
        <Anchor label="FY2028 growth indication" value="≈75%" status="guidance" src="nvda-q3fy27-call" note="Earnings-call commentary; not formal guidance in the release." />
        <Anchor label="Consensus FY2027 EPS (non-GAAP)" value={usd(CONSENSUS.fy2027EpsAvg)} status="estimate" src={CONSENSUS.sourceId} note={`Range ${usd(CONSENSUS.fy2027EpsLow)}–${usd(CONSENSUS.fy2027EpsHigh)}`} />
      </div>

      <SectionTitle>Revenue paths</SectionTitle>
      <Panel title="Historical revenue and scenario projections" subtitle="Fiscal years ending late January" right={<span className="flex gap-1"><StatusBadge status="reported" /><StatusBadge status="assumption" /></span>}>
        <SeriesChart data={paths} series={[{ key: 'hist', name: 'Reported / FY27E', type: 'line' }, { key: 'bull', name: 'Bull', type: 'line', dashed: true }, { key: 'base', name: 'Base', type: 'line', dashed: true }, { key: 'bear', name: 'Bear', type: 'line', dashed: true }]} format="usdM" height={280} />
      </Panel>

      <SectionTitle>Scenarios</SectionTitle>
      <ScenarioExplorer views={views} price={QUOTE.price} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Probability-weighted view" right={<StatusBadge status="assumption" />}>
          <table className="tbl">
            <thead><tr><th>Scenario</th><th className="n">Weight</th><th className="n">Value</th><th className="n">Contribution</th></tr></thead>
            <tbody>
              {views.map((v) => <tr key={v.key}><td>{v.name}</td><td className="n">{pct(v.weight, 0)}</td><td className="n">{usd(v.intrinsic, 0)}</td><td className="n">{usd(v.intrinsic * v.weight, 0)}</td></tr>)}
              <tr className="font-medium"><td>Weighted</td><td /><td /><td className={cn('n', weighted >= QUOTE.price ? 'text-up' : 'text-down')}>{usd(weighted, 0)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-faint">Weights are subjective and illustrative. A weighted value above the price does not make the stock suitable for any particular investor.</p>
        </Panel>
        <Interpretation label="How to use the scenarios">
          <p>The scenarios differ mainly in two things: how long the AI build-out keeps growing before it digests, and where operating margin settles once competition and customer silicon mature. Track them with the invalidation conditions: if FY2028 growth lands near management’s ≈75% with gross margin back above 74%, the bear case is effectively invalidated; if hyperscalers cut 2027 capex or the SEC inquiry produces a restatement, the bull case is.</p>
          <p>Expected return here means the annualized return if the price converged to scenario value over three years, plus the current dividend yield — a mechanical calculation, not a forecast.</p>
        </Interpretation>
      </div>
      <p className="mt-4 text-[11px] text-faint">Sources for anchors <SourceRef ids={['nvda-q3fy27-pr', 'nvda-q3fy27-call', CONSENSUS.sourceId]} /></p>
    </>
  );
}

function Anchor({ label, value, status, src, note }: { label: string; value: string; status: 'guidance' | 'estimate' | 'calculated'; src: string; note: string }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="flex items-center justify-between text-[11px] text-muted">{label}<StatusBadge status={status} /></div>
      <div className="num mt-1 text-[18px]">{value}</div>
      <div className="flex items-center justify-between text-[11px] text-faint">{note}<SourceRef ids={src} /></div>
    </div>
  );
}
