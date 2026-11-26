import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { CAPITAL_ALLOCATION, COMPENSATION_NOTES, GOVERNANCE_FACTS, GOVERNANCE_IMPLICATIONS, LEADERSHIP } from '@/lib/data/governance';
import { NEWS } from '@/lib/data/news';
import { annualRows } from '@/lib/view';
import { date, usd, usdM } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { Callout, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';

export const metadata: Metadata = { title: 'Corporate Governance' };

export default async function GovernancePage() {
  const { analytics: a, store: s } = await getResearchData();
  const alloc = annualRows(a, {
    buybacks: (p) => Math.abs(a.flowValue('buybacks', p) ?? 0),
    divs: (p) => Math.abs(a.flowValue('dividends', p) ?? 0),
    acq: (p) => Math.abs(a.flowValue('acquisitions', p) ?? 0),
    capex: (p) => Math.abs(a.flowValue('capex', p) ?? 0),
  });
  const legal = NEWS.filter((n) => ['legal', 'regulatory', 'governance'].includes(n.category));

  return (
    <>
      <PageHeader title="Corporate Governance" description="Leadership, board, ownership, capital allocation, audit and the regulatory and legal matters that opened in November 2026 — with what each means for shareholders." />
      <Callout tone="warn" title="Resignation and reinstatement within 11 days">
        On Nov 11–12, 2026 the board accepted Jensen Huang’s resignation and named CFO Colette Kress interim CEO; on Nov 17 the chair said the board did not intend to reinstate him; on Nov 23 the board reinstated Huang unanimously as President, CEO and director, citing input from senior U.S. government officials. Kress remains CFO and Harvey C. Jones remains the first independent chair. The independent investigation, House interviews (Dec 1–2) and a reported SEC inquiry are pending. <SourceRef ids={['nvda-ceo-8k', 'nvda-reinstate-8k', 'npr-house']} />
      </Callout>

      <SectionTitle>Leadership</SectionTitle>
      <div className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
        {LEADERSHIP.map((l) => (
          <div key={l.name} className="bg-panel p-4">
            <div className="flex items-center justify-between"><div className="text-[13px] font-semibold">{l.name}</div><SourceRef ids={l.sourceId} /></div>
            <div className="text-[12px] text-up/90">{l.role}</div>
            <div className="mt-1 text-[11px] text-faint">{l.since}</div>
            <p className="mt-2 text-[12px] leading-5 text-muted">{l.note}</p>
          </div>
        ))}
      </div>

      <SectionTitle>Board, ownership and shareholder rights</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel bodyClass="p-0" title="Governance facts">
          <table className="tbl">
            <tbody>
              {GOVERNANCE_FACTS.map((f) => (
                <tr key={f.label}>
                  <td className="w-48 text-muted">{f.label}</td>
                  <td className="font-medium">{f.value}</td>
                  <td className="whitespace-normal text-[12px] leading-5 text-muted">{f.note}</td>
                  <td className="w-24 text-right"><StatusBadge status={f.status} /> <SourceRef ids={f.sourceId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Management track record" right={<StatusBadge status="assessment" />}>
          <div className="prose-research">
            <p>Under Huang, NVIDIA grew revenue from $26.9B (FY2022) to $361.8B TTM while expanding operating margin from 37% to 66% — one of the most successful strategic bets in corporate history (CUDA in 2006, data-center pivot, Mellanox in 2020).</p>
            <p>Blemishes predate 2026: a $5.5M SEC settlement (2022) over crypto-mining disclosure, and the $1.35B write-off of the failed Arm acquisition (FY2023). Kress has been CFO since 2013 and has overseen the financial reporting now reportedly under SEC review — continuity is valuable operationally, but combining the CEO and CFO roles concentrates accountability for the financial statements in one person during an inquiry.</p>
          </div>
        </Panel>
      </div>

      <SectionTitle>Capital allocation</SectionTitle>
      <MetricGrid cols="grid-cols-2 md:grid-cols-4">
        <Metric label="Buyback authorization remaining" value={usdM(CAPITAL_ALLOCATION.buybackAuthorizationRemaining)} sub={`+${usdM(CAPITAL_ALLOCATION.buybackIncreaseSep2026)} added Sep 2026`} status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Returned to shareholders (Q3 FY27)" value={usdM(CAPITAL_ALLOCATION.returnedQ3)} sub={`FY26: ${usdM(CAPITAL_ALLOCATION.returnedFy26)}`} status="reported" sourceIds={CAPITAL_ALLOCATION.sourceIds} />
        <Metric label="Quarterly dividend" value={usd(CAPITAL_ALLOCATION.quarterlyDividendNow)} sub={`$${CAPITAL_ALLOCATION.quarterlyDividendFeb2026.toFixed(2)} in Feb 2026`} status="reported" sourceIds={CAPITAL_ALLOCATION.sourceIds} />
        <Metric label="Dividends paid (9M FY27)" value={usdM(Math.abs(s.val('dividends', '9M-FY27')!))} sub={`vs ${usdM(Math.abs(s.val('dividends', 'FY2026')!))} in all of FY2026`} status="reported" sourceIds={['nvda-q3fy27-pr']} />
      </MetricGrid>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Uses of cash" subtitle="Repurchases, dividends, acquisitions and capex">
          <SeriesChart data={alloc} series={[{ key: 'buybacks', name: 'Repurchases', stack: 'u' }, { key: 'divs', name: 'Dividends', stack: 'u' }, { key: 'acq', name: 'Acquisitions', stack: 'u' }, { key: 'capex', name: 'Capex', stack: 'u' }]} format="usdM" height={240} note="Excludes the $13.0B Groq payment (classified in other investing) and purchases of equity stakes in ecosystem companies." />
        </Panel>
        <Panel title="Executive compensation">
          <ul className="list-disc space-y-2 pl-4 text-[12.5px] leading-5 text-ink/85">
            {COMPENSATION_NOTES.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <div className="mt-2"><SourceRef ids={['nvda-proxy-2026', 'proxy-summary']} label="proxy" /></div>
        </Panel>
      </div>

      <SectionTitle>Audit, accounting transparency and legal matters</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Auditor & transparency">
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>Auditor: PricewaterhouseCoopers LLP (ratified for FY2027) <SourceRef ids="proxy-summary" /></li>
            <li>Segment reporting changed in FY2027 to Data Center / Edge Computing; earlier platform detail is no longer reported.</li>
            <li>Fortune reported NVIDIA changed how it presented Singapore revenue in 2025 <SourceRef ids="singapore-reporting" /></li>
            <li>Material weakness or restatement: none disclosed in the sources used as of Nov 22, 2026.</li>
            <li>Related-party transactions: NVIDIA holds equity in companies that are also customers (e.g. CoreWeave); detailed related-party disclosures were not extracted — <em className="text-faint">Data unavailable</em>.</li>
          </ul>
        </Panel>
        <Panel bodyClass="p-0" title="Regulatory & legal timeline">
          <table className="tbl">
            <tbody>
              {legal.map((n) => (
                <tr key={n.id}>
                  <td className="w-28 whitespace-nowrap num text-muted">{date(n.date)}</td>
                  <td className="whitespace-normal">
                    <div className="font-medium">{n.headline}</div>
                    <div className="text-[11.5px] text-faint">{n.confirmed ? 'Confirmed' : 'Media report — not confirmed by company/regulator'}</div>
                  </td>
                  <td className="w-12"><SourceRef ids={n.sourceIds} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <SectionTitle>Implications for shareholders</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        {GOVERNANCE_IMPLICATIONS.map((g, i) => (
          <Panel key={g.title} title={g.title} right={<StatusBadge status="assessment" />} className={i === 1 ? 'border-warn/30' : ''}>
            <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
