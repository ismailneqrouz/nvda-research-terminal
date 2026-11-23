import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { GUIDANCE } from '@/lib/data/financials';
import { QUOTE } from '@/lib/data/market';
import type { MetricPeriod } from '@/lib/finance/metrics';
import { annualRows } from '@/lib/view';
import { mult, pct, usdM } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { MetricMatrix } from '@/components/data/metric-matrix';
import { Callout, Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';
import { StressTest } from '@/components/tools/stress-test';

export const metadata: Metadata = { title: 'Financial Health' };
const P: MetricPeriod[] = ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026', 'TTM'];

export default async function FinancialHealthPage() {
  const { analytics: a, store: s } = await getResearchData();
  const M = a.ALL_METRICS;
  const t = M.TTM;
  const series = (f: (p: MetricPeriod) => number | null) => P.map(f);
  const lev = annualRows(a, { liquid: (p) => M[p].liquidCash, debt: (p) => M[p].totalDebt });
  const ttmOpex = a.flowValue('totalOpex', 'TTM')!;
  const ttmRev = t.revenue!;
  const fy26IntExp = Math.abs(s.val('interestExpense', 'FY2026')!);

  return (
    <>
      <PageHeader
        title="Financial Health & Solvency"
        description="Balance-sheet strength, liquidity, leverage and off-balance-sheet obligations — and an interactive stress test of how NVIDIA would weather a downturn, a rate shock, a supply disruption or a geopolitical event."
        crumbs={[{ href: '/financial-statements', label: 'Financials' }]}
      />
      <MetricGrid>
        <Metric label="Total debt" value={usdM(t.totalDebt)} sub="Oct 25, 2026" status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Net cash" termId="net-debt" value={usdM(-(t.netDebt ?? 0))} sub="Excl. $65.5B private stakes" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Debt / equity" value={mult(t.debtToEquity, 2)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Net debt / EBITDA" value={mult(t.netDebtToEbitda, 2)} sub="Negative = net cash" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Current ratio" termId="current-ratio" value={mult(t.currentRatio, 2)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Quick ratio" termId="quick-ratio" value={mult(t.quickRatio, 2)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Cash ratio" termId="cash-ratio" value={mult(t.cashRatio, 2)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Interest coverage" termId="interest-coverage" value={mult(M.FY2026.interestCoverage, 0)} sub="FY2026 (TTM n/a)" status="calculated" sourceIds={['nvda-q4fy26-pr']} />
        <Metric label="Working capital" value={usdM(t.workingCapital)} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Lease liabilities (LT)" value={usdM(s.val('leaseLiabilities', 'Q3-FY27'))} sub="Current portion in accrued" status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Supply commitments" value={usdM(GUIDANCE.supplyCommitments)} sub={`from ${usdM(GUIDANCE.supplyCommitmentsPrior)} in Q2`} status="reported" sourceIds={GUIDANCE.commitmentsSourceIds} />
        <Metric label="Guarantees" value={usdM(GUIDANCE.guarantees)} sub="Partner data-center campuses" status="reported" sourceIds={GUIDANCE.commitmentsSourceIds} />
      </MetricGrid>

      <SectionTitle>Leverage and liquidity history</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel title="Liquid assets vs debt">
          <SeriesChart data={lev} series={[{ key: 'liquid', name: 'Cash & marketable securities' }, { key: 'debt', name: 'Total debt' }]} format="usdM" height={250} />
        </Panel>
        <Panel title="Solvency and liquidity ratios" bodyClass="p-0">
          <MetricMatrix
            periods={P}
            rows={[
              { label: 'Net debt', term: 'net-debt', values: series((p) => M[p].netDebt), fmt: (x) => usdM(x), higherIsBetter: false, benchmark: 'Negative (net cash) is the strongest position.', read: 'Net cash every year; reduced in FY2027 by $24.9B of new borrowing alongside $61B of buybacks.' },
              { label: 'Debt / equity', values: series((p) => M[p].debtToEquity), fmt: (x) => mult(x, 2), higherIsBetter: false, benchmark: '<0.5 conservative.', read: 'Leverage is immaterial relative to equity.' },
              { label: 'Net debt / EBITDA', values: series((p) => M[p].netDebtToEbitda), fmt: (x) => mult(x, 2), higherIsBetter: false, benchmark: '<1.0× investment-grade comfort; negative = net cash.', read: 'Rating-agency-style leverage is negative.' },
              { label: 'Current ratio', term: 'current-ratio', values: series((p) => M[p].currentRatio), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '>1.5 comfortable.', read: 'Strong, though an increasing share of current assets is receivables and inventory.' },
              { label: 'Quick ratio', term: 'quick-ratio', values: series((p) => M[p].quickRatio), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '>1.0 strong.', read: 'Liquid even excluding inventory.' },
              { label: 'Cash ratio', term: 'cash-ratio', values: series((p) => M[p].cashRatio), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '>0.5 strong.', read: 'Cash and securities alone cover current liabilities 1.8×.' },
              { label: 'Interest coverage', term: 'interest-coverage', values: series((p) => M[p].interestCoverage), fmt: (x) => mult(x, 0), higherIsBetter: true, benchmark: '>10× rarely a concern.', read: 'TTM unavailable (interest not split in interim releases); FY2027 interest cost will rise with the new debt but coverage remains in the hundreds.' },
            ]}
          />
        </Panel>
      </div>

      <SectionTitle>Obligations not on the balance sheet</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Debt maturity profile" right={<StatusBadge status="reported" />}>
          <p className="text-[12.5px] leading-5 text-ink/85">Long-term debt of {usdM(s.val('longTermDebt', 'Q3-FY27'))} at Oct 25, 2026; NVIDIA repaid $1.0B of notes in Q3 FY2027 and raised $24.9B (net) earlier in FY2027.</p>
          <p className="mt-2 text-[12.5px] text-faint">Maturity-by-year schedule: <em>Data unavailable</em> — the condensed press-release balance sheet does not include it and the FY2027 note terms were not extracted. See the Q3 FY2027 Form 10-Q debt footnote.</p>
        </Panel>
        <Panel title="Commitments & guarantees" sourceIds={GUIDANCE.commitmentsSourceIds}>
          <dl className="space-y-2 text-[12.5px]">
            <Row k="Supply commitments" v={usdM(GUIDANCE.supplyCommitments)} />
            <Row k="Total future commitments" v={usdM(GUIDANCE.totalCommitments)} />
            <Row k="Guarantees (partner campuses)" v={usdM(GUIDANCE.guarantees)} />
            <Row k="Commitments / TTM revenue" v={mult(GUIDANCE.supplyCommitments / ttmRev, 2)} />
            <Row k="Commitments / liquid assets" v={mult(GUIDANCE.supplyCommitments / t.liquidCash!, 1)} />
          </dl>
          <p className="mt-2 text-[11.5px] leading-4 text-faint">Guarantees phase in as buildings become ready for service; no payments had been made under them as of Q3.</p>
        </Panel>
        <Panel title="Contingent liabilities">
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>Securities class action (N.D. Cal., filed Nov 9, 2026) <SourceRef ids="class-action" /></li>
            <li>Reported SEC inquiry into disclosures/accounting; California AG reviewing <SourceRef ids={['sec-probe-wsj', 'sec-accounting-fool']} /></li>
            <li>Export-control compliance exposure (BIS rules) <SourceRef ids="bis-ifr-nov26" /></li>
            <li>No amounts accrued for these matters are disclosed in the sources used: <em className="text-faint">Data unavailable</em>.</li>
          </ul>
        </Panel>
      </div>

      <SectionTitle>Stress test</SectionTitle>
      <Panel title="Ability to withstand shocks" subtitle="Static one-year model starting from TTM run-rate. Choose a preset or move the sliders." right={<StatusBadge status="assumption" />}>
        <StressTest
          baseCoupon={0.04}
          base={{
            revenue: ttmRev,
            grossMargin: t.grossMargin!,
            opex: ttmOpex,
            taxRate: 0.17,
            daPct: a.flowValue('dna', 'TTM')! / ttmRev,
            capexPct: t.capexToRevenue!,
            owcPct: t.owcToRevenue!,
            liquid: t.liquidCash!,
            debt: t.totalDebt!,
            commitments: GUIDANCE.supplyCommitments,
            dividends: GUIDANCE.quarterlyDividend * 4 * QUOTE.sharesOutstanding,
          }}
        />
        <p className="mt-3 text-[11px] text-faint">Assumed average coupon 4.0% on debt (FY2026 interest expense {usdM(fy26IntExp)} on ≈$8.5B of debt implies ≈3%; new 2026 issuance likely higher). Dividends at the current $0.25 quarterly rate.</p>
      </Panel>

      <SectionTitle>Three kinds of risk</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        <Callout tone="up" title="Liquidity risk — low">
          {usdM(t.liquidCash)} of cash and marketable securities against {usdM(s.val('totalCurrentLiabilities', 'Q3-FY27'))} of current liabilities and no short-term debt. NVIDIA can meet near-term obligations even if revenue halves.
        </Callout>
        <Callout tone="up" title="Solvency risk — low (on-balance-sheet)">
          Debt is {mult(t.debtToEquity, 2)} of equity and the company is net cash. The genuine long-horizon solvency question is whether off-balance-sheet commitments ({usdM(GUIDANCE.totalCommitments)}) and guarantees could be called in a prolonged downturn.
        </Callout>
        <Callout tone="warn" title="Operational risk — elevated">
          The risk is to earnings, not survival: very high operating leverage, customer concentration, single-source manufacturing in Taiwan and a leadership transition. See the stress test and the Risk Analysis section.
        </Callout>
      </div>
      <Interpretation>
        <p>NVIDIA’s balance sheet is among the strongest in the S&P 500. The FY2027 debt raise and large buybacks are a deliberate capital-structure choice rather than a sign of need. What has changed in 2026 is the scale of commitments made to secure supply and support customers’ data centers: these convert a demand shock into a cash shock, as the FY2023 inventory charges did on a far smaller scale.</p>
      </Interpretation>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-2 border-b border-line/60 pb-1.5"><dt className="text-muted">{k}</dt><dd className="num">{v}</dd></div>;
}
