import type { Metadata } from 'next';
import { RiskRegister } from '@/components/tools/risk-register';
import { RISKS, TAIL_SCENARIOS } from '@/lib/data/risks';
import { val } from '@/lib/data/financials';
import { cn, pct, usdM } from '@/lib/format';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { StatusBadge } from '@/components/data/status';

export const metadata: Metadata = { title: 'Risk Analysis' };

export default function RiskPage() {
  const fy27e = val('revenue', '9M-FY27')! + 130000;
  const counts = RISKS.reduce<Record<string, number>>((m, r) => ({ ...m, [r.severity]: (m[r.severity] ?? 0) + 1 }), {});

  return (
    <>
      <PageHeader title="Risk Analysis" description="A structured risk register across eleven categories, followed by fat-tail analysis of low-probability, high-impact scenarios. Probabilities and severities are qualitative judgements, not statistical estimates." />
      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {(['critical', 'high', 'moderate', 'low'] as const).map((s) => (
          <span key={s} className={cn('rounded border px-2.5 py-1', s === 'critical' ? 'border-down/40 text-down' : s === 'high' ? 'border-warn/40 text-warn' : 'border-line text-muted')}>
            <span className="num mr-1">{counts[s] ?? 0}</span>{s}
          </span>
        ))}
        <StatusBadge status="assessment" className="self-center" />
      </div>

      <SectionTitle>Risk register</SectionTitle>
      <RiskRegister risks={RISKS} />

      <SectionTitle id="tail">Fat-tail and extreme-event analysis</SectionTitle>
      <Callout tone="neutral" title="Ordinary business risk vs systemic tail risk">
        Ordinary risks (competition, margins, a cyclical downturn) affect NVIDIA’s earnings and can be diversified at the portfolio level. Systemic tail risks (Taiwan conflict, AI-investment collapse, US–China rupture) would hit NVIDIA and the whole market simultaneously — diversification fails exactly when it is needed. Probability ranges are given only where a defensible reference exists; otherwise the scenario is described without one to avoid false precision.
      </Callout>

      <Panel className="mt-4" bodyClass="p-0" title="Scenario matrix" subtitle={`Illustrative first-year revenue impact applied to FY2027E revenue of ${usdM(fy27e)} (9M reported + Q4 guidance) — ranges, not forecasts`}>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[980px]">
            <thead><tr><th>Scenario</th><th>Type</th><th>Probability</th><th className="n">Revenue impact</th><th className="n">Revenue at risk</th><th>Margin</th><th>Valuation</th><th>Duration</th></tr></thead>
            <tbody>
              {TAIL_SCENARIOS.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium"><a href={`#tail-${t.id}`} className="hover:text-info">{t.title}</a></td>
                  <td>{t.systemic ? <span className="text-down">Systemic</span> : <span className="text-muted">Company / sector</span>}</td>
                  <td className="whitespace-normal text-[12px] text-muted">{t.probability}</td>
                  <td className="n">{pct(t.revenueShock[0], 0)} to {pct(t.revenueShock[1], 0)}</td>
                  <td className="n">{usdM(fy27e * t.revenueShock[0])} to {usdM(fy27e * t.revenueShock[1])}</td>
                  <td className="whitespace-normal text-[12px] text-muted">{t.marginImpact}</td>
                  <td className="whitespace-normal text-[12px] text-muted">{t.valuationImpact}</td>
                  <td className="whitespace-normal text-[12px] text-muted">{t.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {TAIL_SCENARIOS.map((t) => (
          <Panel key={t.id} id={`tail-${t.id}`} title={t.title} right={t.systemic ? <span className="rounded-[3px] bg-down/15 px-1.5 py-px text-[10.5px] uppercase tracking-wider text-down">Systemic</span> : <span className="rounded-[3px] bg-raised px-1.5 py-px text-[10.5px] uppercase tracking-wider text-muted">Company / sector</span>}>
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] leading-5">
              <dt className="text-muted">Trigger</dt><dd>{t.trigger}</dd>
              <dt className="text-muted">Probability</dt><dd>{t.probability} <span className="text-faint">— {t.probabilityNote}</span></dd>
              <dt className="text-muted">Operations</dt><dd>{t.operational}</dd>
              <dt className="text-muted">Revenue</dt><dd>{t.revenueImpact}</dd>
              <dt className="text-muted">Margins</dt><dd>{t.marginImpact}</dd>
              <dt className="text-muted">Cash flow</dt><dd>{t.cashFlowImpact}</dd>
              <dt className="text-muted">Valuation</dt><dd>{t.valuationImpact}</dd>
              <dt className="text-muted">Duration</dt><dd>{t.duration}</dd>
              <dt className="text-muted">Second-order</dt><dd>{t.secondary}</dd>
              <dt className="text-muted">Mitigation</dt><dd>{t.mitigation}</dd>
            </dl>
          </Panel>
        ))}
      </div>

      <SectionTitle>Extreme-event watchlist</SectionTitle>
      <Panel bodyClass="p-0" title="Early-warning indicators to monitor">
        <div className="overflow-x-auto">
          <table className="tbl min-w-[700px]">
            <thead><tr><th>Scenario</th><th>Indicators</th></tr></thead>
            <tbody>
              {TAIL_SCENARIOS.map((t) => (
                <tr key={t.id}><td className="w-72 font-medium">{t.title}</td><td className="whitespace-normal text-[12px] text-ink/85">{t.watch.join(' · ')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Interpretation>
        <p>The distinctive feature of NVIDIA’s risk profile in November 2026 is <strong>stacking</strong>: a governance/accounting uncertainty that is binary in nature sits on top of a cyclical industry at record revenue, extreme customer concentration and single-country manufacturing. Each is manageable alone; together they justify a wider range of outcomes than NVIDIA’s financial strength alone would suggest.</p>
      </Interpretation>
    </>
  );
}
