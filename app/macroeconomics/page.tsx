import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { MACRO } from '@/lib/data/context';
import { SCENARIOS } from '@/lib/data/scenarios';
import { runDcf } from '@/lib/finance/dcf';
import { cn, date, pct, usd } from '@/lib/format';
import { Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';

export const metadata: Metadata = { title: 'Macroeconomics' };

export default function MacroPage() {
  const base = SCENARIOS.base.inputs;
  const rateSens = [-0.02, -0.01, 0, 0.01, 0.02].map((d) => ({ d, v: runDcf({ ...base, wacc: base.wacc + d }).perShare }));
  const centre = rateSens[2].v;

  return (
    <>
      <PageHeader title="Macroeconomic Analysis" description="The macro variables that matter for NVIDIA — and, for each, the transmission mechanism from the indicator to NVIDIA’s revenue, margins or valuation. Values are the latest available at Nov 22, 2026." />

      <div className="grid gap-4 lg:grid-cols-2">
        {MACRO.map((m) => (
          <Panel
            key={m.id}
            title={<span>{m.name}</span>}
            subtitle={<span>As of {date(m.asOf)}</span>}
            right={<span className={cn('rounded-[3px] px-1.5 py-px text-[10.5px] uppercase tracking-wider', m.effect === 'headwind' ? 'bg-down/15 text-down' : m.effect === 'tailwind' ? 'bg-up/15 text-up' : 'bg-warn/15 text-warn')}>{m.effect}</span>}
          >
            <div className="mb-3 flex items-baseline gap-2">
              <span className={cn('num text-[17px]', m.value.startsWith('Data unavailable') && 'text-[12.5px] italic text-faint font-sans')}>{m.value}</span>
              <SourceRef ids={m.sourceId} />
            </div>
            <div className="label mb-1.5">Transmission mechanism</div>
            <ol className="space-y-1">
              {m.transmission.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-5 text-ink/85">
                  {i > 0 ? <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-faint" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />}
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-3 border-t border-line pt-2 text-[11.5px] text-muted"><span className="text-faint">Sensitivity: </span>{m.sensitivity}</div>
          </Panel>
        ))}
      </div>

      <SectionTitle>Rates → valuation, quantified</SectionTitle>
      <Panel title="Base-case DCF value per share vs WACC" subtitle="All other base-case assumptions held constant" right={<StatusBadge status="calculated" />}>
        <div className="grid grid-cols-5 gap-px overflow-hidden rounded border border-line bg-line">
          {rateSens.map((r) => (
            <div key={r.d} className={cn('bg-panel px-3 py-3 text-center', r.d === 0 && 'bg-raised')}>
              <div className="text-[11px] text-muted">WACC {pct(base.wacc + r.d)}</div>
              <div className="num text-[17px]">{usd(r.v, 0)}</div>
              <div className={cn('num text-[11px]', r.v >= centre ? 'text-up' : 'text-down')}>{r.d === 0 ? 'base' : pct(r.v / centre - 1, 0, true)}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">A 100bp rise in the discount rate — roughly the move in long Treasury yields during 2026 — lowers base-case value by ≈{pct(1 - rateSens[3].v / centre, 0)}.</p>
      </Panel>

      <Interpretation>
        <p>The 2026 macro backdrop is unusual: an AI-investment boom is itself contributing to inflation (memory, power, construction) while an energy shock pushes headline CPI up, prompting the Fed to <strong>raise</strong> rates in September 2026 with another hike expected in December. For NVIDIA this hits valuation first (higher discount rates, long yields above its FCF yield) and demand second, through the financing costs of debt-funded AI clouds. Its own operations are largely insensitive to GDP: hyperscaler capex, export policy and component prices matter far more. <SourceRef ids={['fed-oct26', 'cpi-oct26-summary', 'bea-gdp-q3-26']} /></p>
      </Interpretation>
    </>
  );
}
