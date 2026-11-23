import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { PEERS } from '@/lib/data/market';
import type { MetricPeriod } from '@/lib/finance/metrics';
import { annualRows } from '@/lib/view';
import { mult, pct, usdM } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { MetricMatrix } from '@/components/data/metric-matrix';
import { Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { SeriesChart } from '@/components/charts/series-chart';

export const metadata: Metadata = { title: 'Profitability & Efficiency' };

const P: MetricPeriod[] = ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026', 'TTM'];
const PEER_TICKERS = ['AMD', 'AVGO', 'INTC', 'TSM'];
const peer = (k: keyof (typeof PEERS)[number]) => PEER_TICKERS.map((t) => (PEERS.find((p) => p.ticker === t)?.[k] as number | null) ?? null);
const d0 = (x: number) => `${x.toFixed(0)} d`;
const p1 = (x: number) => pct(x);

export default async function ProfitabilityPage() {
  const { analytics: a } = await getResearchData();
  const M = a.ALL_METRICS;
  const series = (f: (p: MetricPeriod) => number | null) => P.map(f);
  const t = M.TTM;

  const marginsChart = annualRows(a, { gm: (p) => M[p].grossMargin, om: (p) => M[p].operatingMargin, nm: (p) => M[p].netMargin, fcf: (p) => M[p].fcfMargin });
  const returnsChart = annualRows(a, { roe: (p) => M[p].roe, roa: (p) => M[p].roa, roic: (p) => M[p].roic }).filter((r) => r.label !== 'FY2022');
  const daysChart = annualRows(a, { dio: (p) => M[p].dio, dso: (p) => M[p].dso, dpo: (p) => M[p].dpo, ccc: (p) => M[p].ccc }).filter((r) => r.label !== 'FY2022');
  const qualityChart = annualRows(a, { sbc: (p) => M[p].sbcToRevenue, other: (p) => M[p].nonOperatingShareOfPretax });

  return (
    <>
      <PageHeader
        title="Profitability & Efficiency"
        description="Margins, returns on capital, working-capital efficiency and earnings quality, FY2022 to trailing twelve months, compared with semiconductor peers. Click any metric name for its definition and formula."
        crumbs={[{ href: '/financial-statements', label: 'Financials' }]}
      />
      <MetricGrid cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Gross margin" termId="gross-margin" value={pct(t.grossMargin)} sub="TTM" status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Operating margin" termId="operating-margin" value={pct(t.operatingMargin)} sub="TTM" status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="FCF margin" termId="fcf-margin" value={pct(t.fcfMargin)} sub="TTM" status="ttm" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="ROIC" termId="roic" value={pct(t.roic, 0)} sub="TTM, avg. capital" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="ROE" termId="roe" value={pct(t.roe, 0)} sub="TTM" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Cash conversion cycle" termId="ccc" value={t.ccc == null ? 'Data unavailable' : d0(t.ccc)} sub={`FY25 ${M.FY2025.ccc?.toFixed(0)} d`} status="calculated" sourceIds={['nvda-q3fy27-pr']} />
      </MetricGrid>

      <SectionTitle>Profitability</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel title="Margin development" sourceIds={['nvda-q3fy27-pr', 'nvda-q4fy26-pr', 'nvda-10k']}>
          <SeriesChart data={marginsChart} series={[{ key: 'gm', name: 'Gross', type: 'line' }, { key: 'om', name: 'Operating', type: 'line' }, { key: 'nm', name: 'Net', type: 'line' }, { key: 'fcf', name: 'FCF', type: 'line' }]} format="pct" height={260} />
        </Panel>
        <Panel title="Margins vs peers" subtitle="Peers: trailing twelve months per StockAnalysis, Nov 20, 2026" bodyClass="p-0" sourceIds={['sa-amd', 'sa-avgo', 'sa-intc', 'sa-tsm']}>
          <MetricMatrix
            periods={P}
            peerNames={PEER_TICKERS}
            rows={[
              { label: 'Gross margin', term: 'gross-margin', values: series((p) => M[p].grossMargin), fmt: p1, peers: peer('grossMargin'), higherIsBetter: true, benchmark: '>60% indicates pricing power for a fabless designer; <45% suggests commodity exposure.', read: 'Recovered from the FY2023 inventory charges and H20 write-down (Q1 FY26). Q4 FY27 guidance of 71–72% reflects memory cost inflation.' },
              { label: 'Operating margin', term: 'operating-margin', values: series((p) => M[p].operatingMargin), fmt: p1, peers: peer('operatingMargin'), higherIsBetter: true, benchmark: '>30% excellent; NVIDIA’s >60% is at the top of all large-cap technology.', read: 'Operating leverage: opex grew far slower than revenue. Mean reversion is the main valuation question.' },
              { label: 'EBIT margin', term: 'ebit', values: series((p) => M[p].ebitMargin), fmt: p1, benchmark: 'Close to operating margin unless non-operating income is large.', read: 'TTM unavailable because interim releases do not split interest expense; FY2026 exceeds operating margin by ≈5 pts due to equity-security gains.' },
              { label: 'EBITDA margin', term: 'ebitda', values: series((p) => M[p].ebitdaMargin), fmt: p1, benchmark: 'For capital-light firms EBITDA ≈ EBIT; large gaps indicate heavy depreciation.', read: 'D&A is only ≈1% of revenue — EBITDA adds little information for NVIDIA.' },
              { label: 'Net margin', term: 'net-margin', values: series((p) => M[p].netMargin), fmt: p1, peers: peer('netMargin'), higherIsBetter: true, benchmark: '>20% strong.', read: 'TTM net margin is flattered by ≈$26B of other income (mostly mark-to-market gains).' },
              { label: 'FCF margin', term: 'fcf-margin', values: series((p) => M[p].fcfMargin), fmt: p1, higherIsBetter: true, benchmark: '>25% exceptional.', read: 'Below net margin in every year since FY2024 as working capital absorbs cash; widest gap TTM.' },
            ]}
          />
        </Panel>
      </div>

      <SectionTitle>Returns on capital</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel title="ROE, ROA and ROIC" subtitle="Average-balance basis; FY2022 omitted (no sourced FY2021 balance sheet)">
          <SeriesChart data={returnsChart} series={[{ key: 'roic', name: 'ROIC', type: 'line' }, { key: 'roe', name: 'ROE', type: 'line' }, { key: 'roa', name: 'ROA', type: 'line' }]} format="pct" height={260} />
        </Panel>
        <Panel title="Returns vs peers" bodyClass="p-0">
          <MetricMatrix
            periods={P}
            peerNames={PEER_TICKERS}
            rows={[
              { label: 'ROE', term: 'roe', values: series((p) => M[p].roe), fmt: (x) => pct(x, 0), peers: peer('roe'), higherIsBetter: true, benchmark: '>15% good; >30% exceptional.', read: 'Above 100% since FY2025 with little leverage — returns come from operations, not debt.' },
              { label: 'ROA', term: 'roa', values: series((p) => M[p].roa), fmt: (x) => pct(x, 0), higherIsBetter: true, benchmark: '>10% strong for technology hardware.', read: 'Diluted by a growing pile of cash, securities and private investments.' },
              { label: 'ROIC', term: 'roic', values: series((p) => M[p].roic), fmt: (x) => pct(x, 0), peers: peer('roic'), higherIsBetter: true, benchmark: 'Above WACC (≈10–12%) creates value; >30% is rare.', read: 'Invested capital (after excluding cash and investments) is small relative to NOPAT, so ROIC is extreme. It will fall mechanically as receivables/inventory grow.' },
              { label: 'Return on tangible IC', term: 'rotic', values: series((p) => M[p].rotic), fmt: (x) => pct(x, 0), benchmark: 'Strips out acquisition goodwill.', read: 'Higher than ROIC; the Groq transaction raised goodwill to $26.5B but tangible returns remain extreme.' },
            ]}
          />
          <p className="border-t border-line px-4 py-2 text-[11px] text-faint">Peer ROE/ROIC use each provider’s definitions and may not be identical to ours <SourceRef ids={['sa-amd']} />.</p>
        </Panel>
      </div>

      <SectionTitle>Efficiency</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel title="Working-capital days">
          <SeriesChart data={daysChart} series={[{ key: 'dio', name: 'DIO', type: 'line' }, { key: 'dso', name: 'DSO', type: 'line' }, { key: 'dpo', name: 'DPO', type: 'line' }, { key: 'ccc', name: 'Cash conversion cycle', type: 'line', dashed: true }]} format="days" height={260} />
        </Panel>
        <Panel title="Efficiency metrics" bodyClass="p-0">
          <MetricMatrix
            periods={P}
            rows={[
              { label: 'Asset turnover', term: 'asset-turnover', values: series((p) => M[p].assetTurnover), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '>1.0× efficient for a fabless designer.', read: 'Peaked in FY2025; falling as cash and strategic investments accumulate.' },
              { label: 'Inventory turnover', term: 'inventory-turnover', values: series((p) => M[p].inventoryTurnover), fmt: (x) => mult(x, 1), higherIsBetter: true, benchmark: '>4× healthy for semis.', read: 'Declining with the Rubin ramp and memory pre-buys.' },
              { label: 'Days inventory outstanding', term: 'dio', values: series((p) => M[p].dio), fmt: d0, higherIsBetter: false, benchmark: '<90 d strong; rising DIO is an early-warning signal.', read: 'TTM ≈123 d, back near FY2023 levels when NVIDIA took inventory charges.' },
              { label: 'Receivables turnover', values: series((p) => M[p].receivablesTurnover), fmt: (x) => mult(x, 1), higherIsBetter: true, benchmark: '>6× typical.', read: 'Falling as receivables grow faster than revenue.' },
              { label: 'Days sales outstanding', term: 'dso', values: series((p) => M[p].dso), fmt: d0, higherIsBetter: false, benchmark: '30–55 d normal for semiconductor vendors.', read: 'Rising toward 60 d — linked to quarter-end shipment timing and terms for very large buyers.' },
              { label: 'Days payables outstanding', term: 'dpo', values: series((p) => M[p].dpo), fmt: d0, higherIsBetter: true, benchmark: 'Higher = suppliers fund more working capital.', read: 'Suppliers fund a growing share as payables jumped to $21B.' },
              { label: 'Cash conversion cycle', term: 'ccc', values: series((p) => M[p].ccc), fmt: d0, higherIsBetter: false, benchmark: '<60 d strong for hardware.', read: 'Around 120 d: each $10B of extra quarterly revenue ties up ≈$13B of cash.' },
              { label: 'Operating WC / revenue', values: series((p) => M[p].owcToRevenue), fmt: p1, higherIsBetter: false, benchmark: 'Lower = more capital-efficient growth.', read: 'Operating working capital (AR + inventory + prepaid − AP − accrued) is ≈19% of TTM revenue.' },
            ]}
          />
        </Panel>
      </div>

      <SectionTitle>Earnings quality</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Panel title="SBC and non-operating income" subtitle="Share of revenue / share of pre-tax income">
          <SeriesChart data={qualityChart} series={[{ key: 'sbc', name: 'SBC / revenue' }, { key: 'other', name: 'Other income / pre-tax income' }]} format="pct" height={240} />
        </Panel>
        <Panel title="Earnings-quality indicators" bodyClass="p-0">
          <MetricMatrix
            periods={P}
            rows={[
              { label: 'CFO / net income', term: 'cfo-ni', values: series((p) => M[p].cfoToNi), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '≥1.0 over time indicates cash-backed earnings.', read: 'Fell to 0.70 TTM. See Integrated analysis for drivers.' },
              { label: 'FCF / net income', values: series((p) => M[p].fcfToNi), fmt: (x) => mult(x, 2), higherIsBetter: true, benchmark: '≥0.9 strong.', read: 'Lowest in the five-year window.' },
              { label: 'Stock-based compensation', term: 'sbc', values: series((p) => M[p].sbc), fmt: (x) => usdM(x), benchmark: 'Compare with buybacks and dilution.', read: 'Rising in dollars, falling as % of revenue.' },
              { label: 'SBC / revenue', values: series((p) => M[p].sbcToRevenue), fmt: p1, higherIsBetter: false, benchmark: '<5% modest for large tech.', read: 'Low ratio thanks to revenue scale.' },
              { label: 'Diluted share change', values: series((p) => M[p].dilutedShareChange), fmt: (x) => pct(x, 1, true), higherIsBetter: false, benchmark: 'Negative = net buyback.', read: 'Diluted share count declining 0.5–1.2% a year.' },
              { label: 'Non-operating / pre-tax income', values: series((p) => M[p].nonOperatingShareOfPretax), fmt: p1, higherIsBetter: false, benchmark: '<5% means profit is almost entirely operating.', read: '≈12% TTM: recurring earnings are lower than headline net income. Recurring vs non-recurring: equity-security gains (9M FY27 $25.5B) are non-recurring in nature.' },
            ]}
          />
        </Panel>
      </div>
      <Interpretation label="Recurring vs non-recurring earnings">
        <p>Adjusting TTM net income for other income (taxed at the TTM effective rate) gives recurring earnings of ≈{usdM(a.flowValue('netIncome', 'TTM')! - a.flowValue('totalOther', 'TTM')! * (1 - (t.effectiveTaxRate ?? 0.17)))} and a P/E of ≈{a.valuationSnapshot().peExOther.toFixed(1)}× rather than {a.valuationSnapshot().pe.toFixed(1)}×. Historical one-offs: the $1.35B Arm termination charge (FY2023) and the H20 China inventory charge (Q1 FY2026).</p>
      </Interpretation>
    </>
  );
}
