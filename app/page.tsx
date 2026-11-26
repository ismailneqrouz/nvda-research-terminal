import Link from 'next/link';
import { ArrowUpRight, Presentation } from 'lucide-react';
import { RISK_3Y, RISK_5Y } from '@/lib/finance/risk-report';
import { getResearchData } from '@/lib/data/provider';
import { CONSENSUS, PRICE_HISTORY, QUOTE } from '@/lib/data/market';
import { GUIDANCE, SEGMENTS_FY27 } from '@/lib/data/financials';
import { SCENARIOS, SCENARIO_WEIGHTS } from '@/lib/data/scenarios';
import { SCORES, THREE_QUESTIONS, weightedScore } from '@/lib/data/scores';
import { RISKS, SEVERITY_ORDER } from '@/lib/data/risks';
import { runDcf } from '@/lib/finance/dcf';
import { upside } from '@/lib/finance/core';
import { annualRows, quarterRows, QUARTER_NOTE, TTM_NOTE } from '@/lib/view';
import { cn, pct, usd, usdM, mult } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { PriceChart } from '@/components/charts/price-chart';
import { ToggleChart } from '@/components/charts/toggle-chart';

export default async function OverviewPage() {
  const d = await getResearchData();
  const a = d.analytics;
  const m = a.ALL_METRICS.TTM;
  const v = a.valuationSnapshot();
  const fy26 = a.ALL_METRICS.FY2026;
  const scen = (['bull', 'base', 'bear'] as const).map((k) => ({ ...SCENARIOS[k], value: runDcf(SCENARIOS[k].inputs).perShare }));
  const weighted = scen.reduce((s, x) => s + x.value * SCENARIO_WEIGHTS[x.key], 0);
  const topRisks = [...RISKS].sort((x, y) => SEVERITY_ORDER[y.severity] - SEVERITY_ORDER[x.severity]).slice(0, 5);
  const q3 = d.quarters[d.quarters.length - 1];
  const fromRecord = QUOTE.price / QUOTE.recordClose - 1;

  const perfAnnual = annualRows(a, {
    revenue: (p) => a.flowValue('revenue', p),
    netIncome: (p) => a.flowValue('netIncome', p),
    fcf: (p) => a.ALL_METRICS[p].fcf,
  });
  const perfQuarter = quarterRows(d.quarters, { revenue: (q) => q.revenue, netIncome: (q) => q.netIncome, fcf: (q) => q.freeCashFlow });
  const gmAnnual = annualRows(a, { gm: (p) => a.ALL_METRICS[p].grossMargin, om: (p) => a.ALL_METRICS[p].operatingMargin });
  const gmQuarter = quarterRows(d.quarters, { gm: (q) => q.grossProfit / q.revenue, om: (q) => q.operatingIncome / q.revenue });

  return (
    <>
      <PageHeader
        title="Company Overview"
        description="NVIDIA designs accelerated-computing platforms — GPUs, CPUs, networking, systems and software — and today earns ~93% of revenue from AI data-center infrastructure. Everything below is computed from NVIDIA’s filings unless labelled otherwise."
      />

      <Callout tone="warn" title="November 2026: governance whiplash, unchanged fundamentals">
        Jensen Huang resigned as CEO on Nov 11–12 and was reinstated by a unanimous board vote on Nov 23 (Colette Kress remains CFO). The SEC is reportedly examining NVIDIA’s disclosures and accounting (WSJ, Reuters — unconfirmed). The stock moved from {usd(QUOTE.recordClose)} (Oct 6 record) to $125.53 (Nov 20), jumped 31.5% on the reinstatement and closed at {usd(QUOTE.price)} on Nov 25 ({pct(fromRecord, 0)} from the record) — while Q3 FY2027 revenue grew 103%.{' '}
        <Link href="/news" className="link">See News & Events →</Link>
      </Callout>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded border border-up/30 bg-up/[0.05] px-4 py-3">
        <Presentation className="h-4 w-4 text-up" />
        <div className="min-w-0 flex-1 text-[12.5px] leading-5">
          <span className="font-medium text-ink">Präsentationsmodus</span>
          <span className="text-muted"> — die wichtigsten Kennzahlen als Folien zum Lernen: Was misst die Kennzahl, wie wird sie berechnet (mit Tabellenblatt und sichtbaren Formeln), wie liest man sie. Inkl. Sharpe, Sortino, Beta, Drawdown und VaR.</span>
        </div>
        <Link href="/present" className="inline-flex h-8 items-center gap-1.5 rounded border border-up/50 bg-up/15 px-3 text-[12px] font-medium text-up hover:bg-up/25">Starten <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>

      <SectionTitle>Key figures</SectionTitle>
      <MetricGrid>
        <Metric label="Share price" value={usd(QUOTE.price)} delta={{ text: pct(QUOTE.changePct, 1, true), positive: QUOTE.changePct >= 0 }} sub="Nov 25 close" status="market" sourceIds={QUOTE.sourceIds} period={QUOTE.asOfLabel} />
        <Metric label="Market capitalization" value={usdM(v.marketCap)} sub="24.15B shares" status="calculated" sourceIds={['sa-nvda-stats']} />
        <Metric label="Enterprise value" termId="ev" value={usdM(v.enterpriseValue)} sub="Mkt cap + debt − liquid cash" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Revenue (TTM)" termId="ttm" value={usdM(m.revenue)} delta={{ text: pct(m.revenueGrowth, 0, true), positive: true }} sub="y/y" status="ttm" sourceIds={['nvda-q3fy27-pr', 'nvda-q4fy26-pr']} />
        <Metric label="Revenue growth (Q3 y/y)" value={pct(q3.revenue / d.quarters[d.quarters.length - 5].revenue - 1, 0, true)} sub="Q3 FY27 vs Q3 FY26" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Gross margin (TTM)" termId="gross-margin" value={pct(m.grossMargin)} sub={`FY26 ${pct(fy26.grossMargin)}`} status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Operating margin (TTM)" termId="operating-margin" value={pct(m.operatingMargin)} sub={`FY26 ${pct(fy26.operatingMargin)}`} status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Net income (TTM)" termId="net-margin" value={usdM(v.ttmNetIncome)} sub={`incl. ${usdM(a.flowValue('totalOther', 'TTM'))} other income`} status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Diluted EPS (TTM)" value={usd(v.ttmEps)} sub="GAAP" status="ttm" sourceIds={['nvda-q3fy27-pr', 'nvda-q4fy26-pr']} />
        <Metric label="Free cash flow (TTM)" termId="fcf" value={usdM(m.fcf)} sub={`${pct(m.fcfMargin)} margin`} status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Cash & liquid securities" value={usdM(m.liquidCash)} sub="Oct 25, 2026" status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Total debt" value={usdM(m.totalDebt)} sub={`Net cash ${usdM(-(m.netDebt ?? 0))}`} status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="P/E (TTM)" termId="pe" value={mult(v.pe)} sub="GAAP" status="calculated" sourceIds={['sa-nvda-stats']} />
        <Metric label="Forward P/E" termId="forward-pe" value={mult(v.forwardPe)} sub={`FY27E EPS $${CONSENSUS.fy2027EpsAvg} (non-GAAP)`} status="estimate" sourceIds={[CONSENSUS.sourceId]} />
        <Metric label="EV / EBITDA (TTM)" termId="ev-ebitda" value={mult(v.evEbitda)} sub="EBITDA calculated" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="FCF yield (TTM)" termId="fcf-yield" value={pct(v.fcfYield)} sub="vs 10Y UST ≈5.1%" status="calculated" sourceIds={['nvda-q3fy27-pr', 'yields-nov26']} />
        <Metric label="Q4 FY27 revenue guide" value={usdM(GUIDANCE.q4fy27.revenue)} sub="±3%, 14-week quarter" status="guidance" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Data Center share" value={pct(SEGMENTS_FY27.dataCenter / (SEGMENTS_FY27.dataCenter + SEGMENTS_FY27.edgeComputing), 0)} sub="Q3 FY27 revenue" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
      </MetricGrid>

      <SectionTitle>Risk-adjusted returns (monthly, vs S&P 500 ETF)</SectionTitle>
      <MetricGrid>
        <Metric label="Sharpe ratio (3Y)" value={RISK_3Y.nvda.sharpe.toFixed(2)} sub={`S&P 500: ${RISK_3Y.spy.sharpe.toFixed(2)}`} status="calculated" sourceIds={['yahoo-nvda-monthly', 'fred-tb3ms']} />
        <Metric label="Sortino ratio (3Y)" value={RISK_3Y.nvda.sortino.toFixed(2)} sub={`S&P 500: ${RISK_3Y.spy.sortino.toFixed(2)}`} status="calculated" sourceIds={['yahoo-nvda-monthly', 'fred-tb3ms']} />
        <Metric label="Volatility (3Y, ann.)" value={pct(RISK_3Y.nvda.volatility, 0)} sub={`S&P 500: ${pct(RISK_3Y.spy.volatility, 0)}`} status="calculated" sourceIds={['yahoo-nvda-monthly']} />
        <Metric label="Beta (5Y monthly)" value={RISK_5Y.beta.toFixed(2)} sub={`Yahoo: ${QUOTE.beta5y.toFixed(2)}`} status="calculated" sourceIds={['yahoo-nvda-monthly', 'yahoo-spy-monthly', 'yahoo-nvda-quote']} />
        <Metric label="Max drawdown (5Y, month-end)" value={pct(RISK_5Y.nvda.maxDrawdown, 0)} sub={`${RISK_5Y.nvda.mddPeak} → ${RISK_5Y.nvda.mddTrough}`} status="calculated" sourceIds={['yahoo-nvda-monthly']} />
        <Metric label="Monthly VaR 95% (5Y, hist.)" value={pct(-RISK_5Y.nvda.var95, 1)} sub="1 in 20 months worse than this" status="calculated" sourceIds={['yahoo-nvda-monthly']} />
      </MetricGrid>
      <p className="mt-2 text-[11px] text-faint">Window ends Oct 2026 (last complete month). November month-to-date: {pct(149.3 / 204.64 - 1, 1, true)}. <Link href="/present" className="link">Explained step by step in presentation mode →</Link></p>

      <SectionTitle>Performance</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Share price" subtitle="Verified closes only" sourceIds={['sa-nvda-history', 'mt-nvda-history']}>
          <PriceChart points={PRICE_HISTORY} />
        </Panel>
        <Panel title="Revenue, net income and free cash flow" subtitle="USD; fiscal years end late January" sourceIds={['nvda-q3fy27-pr', 'nvda-q4fy26-pr', 'nvda-10k']}>
          <ToggleChart
            views={[{ key: 'a', label: 'Fiscal years', data: perfAnnual, note: TTM_NOTE }, { key: 'q', label: 'Quarters', data: perfQuarter, note: QUARTER_NOTE }]}
            series={[{ key: 'revenue', name: 'Revenue' }, { key: 'netIncome', name: 'Net income' }, { key: 'fcf', name: 'Free cash flow' }]}
            format="usdM"
          />
        </Panel>
        <Panel title="Gross and operating margin" subtitle="GAAP; FY2023 operating margin includes the $1.35B Arm termination charge" sourceIds={['nvda-q3fy27-pr', 'nvda-10k']} className="xl:col-span-2">
          <ToggleChart
            views={[{ key: 'q', label: 'Quarters', data: gmQuarter, note: 'Q1 FY26 gross margin reflects the $4.5B H20 inventory/purchase-obligation charge after China export restrictions.' }, { key: 'a', label: 'Fiscal years', data: gmAnnual }]}
            series={[{ key: 'gm', name: 'Gross margin', type: 'line' }, { key: 'om', name: 'Operating margin', type: 'line' }]}
            format="pct"
            height={200}
          />
        </Panel>
      </div>

      <SectionTitle>Business overview</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="What NVIDIA sells and how it makes money" className="lg:col-span-2">
          <div className="prose-research">
            <p>NVIDIA sells <strong>accelerated-computing systems</strong>: GPUs (Blackwell, now Vera Rubin), Arm-based CPUs (Grace, Vera), the NVLink interconnect that turns 72 GPUs into one rack-scale computer, InfiniBand and Spectrum-X Ethernet networking, and software (CUDA, AI Enterprise, NIM). Increasingly it sells complete <strong>NVL72 racks</strong> through server partners rather than individual chips — which raises revenue per unit and deepens lock-in.</p>
            <p>It makes money mainly from hardware margins: gross margin of {pct(m.grossMargin)} TTM shows customers pay for the full platform, not silicon cost. Revenue comes from cloud hyperscalers ({usdM(SEGMENTS_FY27.hyperscale)} in Q3), AI-native clouds and labs, sovereign programmes, enterprises, and an <strong>Edge Computing</strong> segment (PCs, gaming, automotive, robotics: {usdM(SEGMENTS_FY27.edgeComputing)} in Q3).</p>
            <p>Since Q1 FY2027 NVIDIA reports two segments — <strong>Data Center</strong> and <strong>Edge Computing</strong> — replacing the earlier Data Center / Gaming / Professional Visualization / Automotive / OEM split shown in <Link className="link" href="/business-model">Business Model</Link>.</p>
          </div>
        </Panel>
        <Panel title="Position, advantages and dependencies">
          <ul className="space-y-2.5 text-[12.5px] leading-5">
            <li><span className="text-up">▲ Position</span> — the default supplier of AI training and inference infrastructure; ~70–81% of AI-accelerator revenue by third-party estimates <StatusBadge status="estimate" />.</li>
            <li><span className="text-up">▲ Advantages</span> — CUDA developer ecosystem, full-stack system design, annual cadence, secured supply ($390B commitments).</li>
            <li><span className="text-down">▼ Dependencies</span> — TSMC (Taiwan) for all leading-edge wafers and packaging; HBM suppliers; a handful of hyperscalers who also build rival chips; U.S. export licences.</li>
          </ul>
        </Panel>
      </div>

      <SectionTitle>Investment thesis</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        {scen.map((s) => {
          const up = upside(s.value, QUOTE.price);
          return (
            <Panel key={s.key} title={s.name} subtitle={s.tagline} right={<StatusBadge status="assumption" />}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="num text-[22px] font-medium">{usd(s.value, 0)}</span>
                <span className={cn('num text-[12px]', (up ?? 0) >= 0 ? 'text-up' : 'text-down')}>{pct(up, 0, true)} vs price</span>
              </div>
              <p className="text-[12.5px] leading-5 text-ink/85">{s.narrative}</p>
              <div className="mt-3 text-[11px] text-faint">DCF output under this scenario’s assumptions — a model estimate, not a fact. <Link href={`/valuation?scenario=${s.key}`} className="link">Open in DCF →</Link></div>
            </Panel>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Main catalysts">
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>Q4 FY2027 report (late Feb 2027): delivery on the $130B guide and FY2028 outlook.</li>
            <li>Scope and outcome of the reported SEC inquiry; FY2027 10-K audit opinion.</li>
            <li>Permanent CEO appointment.</li>
            <li>Hyperscaler 2027 capex budgets (January–February 2027 earnings).</li>
            <li>Gross-margin recovery as FY2028 price increases take effect.</li>
          </ul>
        </Panel>
        <Panel title="Main risks" right={<Link href="/risk-analysis" className="text-[11px] link">Risk register →</Link>}>
          <ul className="space-y-2 text-[12.5px] leading-5">
            {topRisks.map((r) => (
              <li key={r.id} className="flex items-start gap-2">
                <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', r.severity === 'critical' ? 'bg-down' : 'bg-warn')} />
                <span><span className="text-ink">{r.title}</span> <span className="text-faint">· {r.severity}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Overall assessment" right={<StatusBadge status="assessment" />}>
          <p className="text-[12.5px] leading-5 text-ink/85">
            An exceptional business whose stock is now priced like a cyclical at peak earnings ({mult(v.pe)} TTM P/E) with a governance discount. Our base-case DCF ({usd(scen[1].value, 0)}) is {Math.abs(scen[1].value / QUOTE.price - 1) < 0.1 ? 'close to' : scen[1].value < QUOTE.price ? `${pct(1 - scen[1].value / QUOTE.price, 0)} below` : `${pct(scen[1].value / QUOTE.price - 1, 0)} above`} the market price, and the illustrative 25/50/25 probability-weighted value is {usd(weighted, 0)}. The spread between bull ({usd(scen[0].value, 0)}) and bear ({usd(scen[2].value, 0)}) — not the point estimate — is the key output: outcomes hinge on AI-capex durability and on whether the accounting questions are benign.
          </p>
        </Panel>
      </div>

      <SectionTitle>Research dashboard</SectionTitle>
      <div className="grid gap-4 2xl:grid-cols-[1.8fr_1fr]">
        <Panel
          title="Scoring framework (1–5)"
          subtitle="Transparent, weighted assessment. Scores do not generate a recommendation."
          right={<span className="num text-[12px] text-muted">Company {weightedScore('company').toFixed(1)} · Stock {weightedScore('stock').toFixed(1)}</span>}
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead><tr><th>Dimension</th><th>Score</th><th className="n">Weight</th><th>Confidence</th><th>Explanation & evidence</th></tr></thead>
              <tbody>
                {SCORES.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap">
                      <Link href={s.href} className="flex items-center gap-1 hover:text-info">{s.name}<ArrowUpRight className="h-3 w-3 text-faint" /></Link>
                      <div className="text-[10px] uppercase tracking-wider text-faint">{s.group === 'company' ? 'Company quality' : 'Stock'}</div>
                    </td>
                    <td><ScoreBar score={s.score} /></td>
                    <td className="n">{pct(s.weight, 0)}</td>
                    <td className="capitalize text-muted">{s.confidence}</td>
                    <td className="max-w-[420px] text-[12px] leading-5">
                      <div className="text-ink/90">{s.explanation}</div>
                      <div className="mt-1 text-faint">{s.evidence.join(' · ')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Three different questions" subtitle="Company quality ≠ attractive valuation ≠ suitable investment">
          <div className="space-y-4">
            {THREE_QUESTIONS.map((t) => (
              <div key={t.q}>
                <div className="text-[12.5px] font-medium">{t.q}</div>
                <p className="mt-1 text-[12.5px] leading-5 text-ink/80">{t.a}</p>
              </div>
            ))}
          </div>
          <Interpretation label="Method">
            <p>Scores 1 (weak) – 5 (strong) are qualitative judgements. For “Risk exposure”, lower means riskier. Weighted averages are shown separately for company and stock dimensions and deliberately not combined into a rating.</p>
          </Interpretation>
        </Panel>
      </div>
      <p className="mt-6 text-[11px] text-faint">Figures: NVIDIA filings via SEC EDGAR <SourceRef ids={['nvda-q3fy27-pr', 'nvda-q4fy26-pr', 'nvda-10k']} />; market data StockAnalysis <SourceRef ids={['sa-nvda-stats']} />. Data provider: {d.provider}.</p>
    </>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Score ${score} of 5`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn('h-2.5 w-3 rounded-[1px]', i <= score ? (score >= 4 ? 'bg-up' : score === 3 ? 'bg-warn' : 'bg-down') : 'bg-line')} />
        ))}
      </div>
      <span className="num text-[12px]">{score}</span>
    </div>
  );
}
