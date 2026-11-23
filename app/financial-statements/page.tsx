import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { ANNUAL_KEYS, BALANCE_PERIODS, BALANCE_SHEET, CASH_FLOW, FLOW_PERIODS, INCOME_STATEMENT } from '@/lib/data/financials';
import { growth } from '@/lib/finance/core';
import type { MetricPeriod } from '@/lib/finance/metrics';
import { annualRows, quarterRows, QUARTER_NOTE, TTM_NOTE } from '@/lib/view';
import { cn, mult, pct, usdM } from '@/lib/format';
import { Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { StatementTableUrl } from '@/components/data/statement-table-url';
import { UrlTabs } from '@/components/data/url-tabs';
import { StatusBadge, Unavailable } from '@/components/data/status';
import { Term } from '@/components/data/term';
import { SeriesChart } from '@/components/charts/series-chart';
import { ToggleChart } from '@/components/charts/toggle-chart';

export const metadata: Metadata = { title: 'Financial Statements' };

const BAL_KEYS = BALANCE_PERIODS.map((p) => p.key);
const balLabel = (k: string) => (k === 'Q3-FY27' ? 'Oct 25, 2026' : k);

export default async function FinancialStatementsPage() {
  const { analytics: a, store: s, quarters } = await getResearchData();
  const M = a.ALL_METRICS;
  const v = (id: string, k: string) => s.val(id, k);

  // ── Income statement charts
  const incomeAnnual = annualRows(a, {
    gp: (p) => a.flowValue('grossProfit', p),
    op: (p) => a.flowValue('operatingIncome', p),
    ni: (p) => a.flowValue('netIncome', p),
  });
  const incomeQuarter = quarterRows(quarters, { gp: (q) => q.grossProfit, op: (q) => q.operatingIncome, ni: (q) => q.netIncome });
  const growthAnnual = annualRows(a, { g: (p) => M[p].revenueGrowth });
  const growthQuarter = quarterRows(quarters, { g: (q) => { const i = quarters.indexOf(q); return i >= 4 ? q.revenue / quarters[i - 4].revenue - 1 : null; } }).filter((r) => r.g != null);
  const expenseMix = annualRows(a, {
    cogs: (p) => ratio(a.flowValue('costOfRevenue', p), a.flowValue('revenue', p)),
    rnd: (p) => ratio(a.flowValue('rnd', p), a.flowValue('revenue', p)),
    sga: (p) => ratio(a.flowValue('sga', p), a.flowValue('revenue', p)),
    other: (p) => ratio(a.flowValue('acqTermination', p), a.flowValue('revenue', p)),
  });
  const epsAnnual = annualRows(a, { eps: (p) => a.flowValue('epsDiluted', p) });
  const epsQuarter = quarterRows(quarters, { eps: (q) => q.dilutedEps });

  // ── Balance sheet charts
  const assetMix = BAL_KEYS.map((k) => ({
    label: balLabel(k),
    liquid: v('cash', k)! + v('marketableSecurities', k)!,
    ar: v('receivables', k),
    inv: v('inventory', k),
    ppe: v('ppe', k)! + v('operatingLeaseAssets', k)!,
    gw: v('goodwill', k)! + v('intangibles', k)!,
    inv2: v('nonMarketable', k),
    other: v('otherNonCurrentAssets', k)! + v('otherCurrentAssets', k)!,
  }));
  const liabMix = BAL_KEYS.map((k) => ({
    label: balLabel(k),
    ap: v('payables', k),
    accrued: v('accrued', k),
    debt: v('shortTermDebt', k)! + v('longTermDebt', k)!,
    lease: v('leaseLiabilities', k),
    other: v('otherLtLiabilities', k),
  }));
  const cashDebt = BAL_KEYS.map((k) => ({ label: balLabel(k), liquid: v('cash', k)! + v('marketableSecurities', k)!, debt: v('shortTermDebt', k)! + v('longTermDebt', k)! }));
  const wcEquity = BAL_KEYS.map((k) => ({ label: balLabel(k), wc: v('totalCurrentAssets', k)! - v('totalCurrentLiabilities', k)!, equity: v('equity', k) }));

  // ── Cash-flow charts
  const cfAnnual = annualRows(a, {
    ocf: (p) => a.flowValue('ocf', p),
    fcf: (p) => M[p].fcf,
    capex: (p) => abs(a.flowValue('capex', p)),
  });
  const conversion = annualRows(a, { cfo: (p) => M[p].cfoToNi, fcf: (p) => M[p].fcfToNi });
  const returns = annualRows(a, {
    buybacks: (p) => abs(a.flowValue('buybacks', p)),
    tax: (p) => abs(a.flowValue('employeeTax', p)),
    divs: (p) => abs(a.flowValue('dividends', p)),
  });
  const cfComposition = annualRows(a, {
    ocf: (p) => a.flowValue('ocf', p),
    icf: (p) => a.flowValue('icf', p),
    fin: (p) => a.flowValue('fcf_fin', p),
  });

  // ── Integrated analysis
  const IP: MetricPeriod[] = ['FY2023', 'FY2024', 'FY2025', 'FY2026', 'TTM'];
  const capexGrowth = (p: MetricPeriod) => {
    if (p === 'TTM') return growth(abs(a.flowValue('capex', 'TTM')), abs(v('capex', 'FY2026')));
    const i = ANNUAL_KEYS.indexOf(p);
    return i > 0 ? growth(abs(v('capex', p)), abs(v('capex', ANNUAL_KEYS[i - 1]))) : null;
  };
  const integrated: { label: string; term?: string; fmt: (x: number | null) => string; get: (p: MetricPeriod) => number | null }[] = [
    { label: 'Net income', fmt: (x) => usdM(x), get: (p) => a.flowValue('netIncome', p) },
    { label: 'Operating cash flow', fmt: (x) => usdM(x), get: (p) => a.flowValue('ocf', p) },
    { label: 'CFO / net income', term: 'cfo-ni', fmt: (x) => mult(x, 2), get: (p) => M[p].cfoToNi },
    { label: 'Revenue growth', fmt: (x) => pct(x, 0, true), get: (p) => M[p].revenueGrowth },
    { label: 'Receivables growth', fmt: (x) => pct(x, 0, true), get: (p) => M[p].arGrowth },
    { label: 'Inventory growth', fmt: (x) => pct(x, 0, true), get: (p) => M[p].inventoryGrowth },
    { label: 'Days sales outstanding', term: 'dso', fmt: (x) => (x == null ? '—' : `${x.toFixed(0)} d`), get: (p) => M[p].dso },
    { label: 'Days inventory outstanding', term: 'dio', fmt: (x) => (x == null ? '—' : `${x.toFixed(0)} d`), get: (p) => M[p].dio },
    { label: 'Stock-based comp. / revenue', term: 'sbc', fmt: (x) => pct(x), get: (p) => M[p].sbcToRevenue },
    { label: 'Diluted share count change', fmt: (x) => pct(x, 1, true), get: (p) => M[p].dilutedShareChange },
    { label: 'Capex growth', fmt: (x) => pct(x, 0, true), get: capexGrowth },
    { label: 'Capex / revenue', fmt: (x) => pct(x), get: (p) => M[p].capexToRevenue },
    { label: 'Other income / pre-tax income', fmt: (x) => pct(x), get: (p) => M[p].nonOperatingShareOfPretax },
    { label: 'Working capital', fmt: (x) => usdM(x), get: (p) => M[p].workingCapital },
    { label: 'Current ratio', term: 'current-ratio', fmt: (x) => mult(x, 2), get: (p) => M[p].currentRatio },
  ];
  const t = M.TTM;
  const findings = [
    {
      title: 'Cash conversion has weakened as the business scaled',
      tone: (t.cfoToNi ?? 1) < 0.85 ? 'warn' : 'neutral',
      fact: `CFO / net income was ${mult(M.FY2025.cfoToNi, 2)} in FY2025, ${mult(M.FY2026.cfoToNi, 2)} in FY2026 and ${mult(t.cfoToNi, 2)} TTM. Two reported drivers explain most of the gap: working capital absorbed ${usdM(-(a.flowValue('chgWorkingCapital', 'TTM') ?? 0))} TTM (receivables and inventories), and net income includes ${usdM(a.flowValue('totalOther', 'TTM'))} of other income, largely non-cash gains on equity securities.`,
      meaning: 'Lower conversion is expected in hyper-growth with large prepaid supply deals, but it means reported earnings overstate distributable cash in the short run. It would become a concern if conversion stays low after growth slows.',
    },
    {
      title: 'Receivables are growing faster than revenue',
      tone: 'warn',
      fact: `Receivables rose ${pct(t.arGrowth, 0)} between Jan 25 and Oct 25, 2026 while TTM revenue grew ${pct(t.revenueGrowth, 0)} y/y. Q3 FY2027 receivables of ${usdM(v('receivables', 'Q3-FY27'))} equal ≈${((v('receivables', 'Q3-FY27')! / v('revenue', 'Q3-FY27')!) * 91).toFixed(0)} days of Q3 revenue (vs ≈${((v('receivables', 'FY2026')! / 68127) * 91).toFixed(0)} days of Q4 FY26 revenue at Jan 25).`,
      meaning: 'Back-end-loaded quarters and longer terms for large buyers can explain this; so can customer financing stress. Given the reported SEC inquiry into accounting, revenue recognition and collection terms deserve close reading in the 10-Q/10-K. This is an observation, not evidence of misstatement.',
    },
    {
      title: 'Inventory build ahead of the Rubin ramp',
      tone: 'neutral',
      fact: `Inventories reached ${usdM(v('inventory', 'Q3-FY27'))} (+${pct(t.inventoryGrowth, 0)} since Jan 25). TTM days inventory outstanding are ${t.dio?.toFixed(0)} vs ${M.FY2025.dio?.toFixed(0)} in FY2025.`,
      meaning: 'Consistent with a new-architecture ramp, memory pre-buys and rack-scale systems containing more components. In FY2023 a similar build preceded write-downs when demand fell; supply commitments of $390B amplify that risk.',
    },
    {
      title: 'Stock-based compensation is more than offset by buybacks',
      tone: 'up',
      fact: `SBC was ${pct(t.sbcToRevenue)} of revenue TTM (${usdM(t.sbc)}). Diluted weighted shares fell ${pct(Math.abs(t.dilutedShareChange ?? 0))} y/y in Q3 FY2027. FY2026 buybacks were ${usdM(abs(v('buybacks', 'FY2026')))} plus ${usdM(abs(v('employeeTax', 'FY2026')))} of RSU tax withholding.`,
      meaning: `Net dilution is negative, but SBC is still a real cost: FY2026 SBC expense equalled ${pct(Math.abs(v('sbc', 'FY2026')! / v('buybacks', 'FY2026')!), 0)} of that year’s repurchase spending — buybacks partly recycle employee grants rather than shrinking the share base.`,
    },
    {
      title: 'Capital spending is rising faster than revenue — from a small base',
      tone: 'neutral',
      fact: `Capex grew ${pct(capexGrowth('FY2026'), 0)} in FY2026 and is ${pct(t.capexToRevenue)} of TTM revenue. PP&E reached ${usdM(v('ppe', 'Q3-FY27'))}.`,
      meaning: 'NVIDIA remains capital-light (fabless). Rising capex reflects data-center capacity for its own use (DGX Cloud, research) and is not yet material to free cash flow.',
    },
    {
      title: 'Liquidity remains strong despite new debt',
      tone: 'up',
      fact: `Working capital is ${usdM(t.workingCapital)} with a current ratio of ${mult(t.currentRatio, 1)}. Long-term debt rose to ${usdM(v('longTermDebt', 'Q3-FY27'))} after ${usdM(v('debtIssued', '9M-FY27'))} of issuance in FY2027.`,
      meaning: 'Short-term liquidity risk is negligible. The relevant obligations are off-balance-sheet (supply commitments, guarantees) — see Financial Health.',
    },
  ];

  const incomeTab = (
    <div className="space-y-4">
      <StatementTableUrl title="Income statement" lines={INCOME_STATEMENT} periods={FLOW_PERIODS} annualKeys={[...ANNUAL_KEYS]} interimKeys={['9M-FY26', '9M-FY27', 'Q3-FY26', 'Q3-FY27']} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue growth" subtitle="Year over year">
          <ToggleChart views={[{ key: 'a', label: 'Fiscal years', data: growthAnnual, note: TTM_NOTE }, { key: 'q', label: 'Quarters (y/y)', data: growthQuarter }]} series={[{ key: 'g', name: 'Revenue growth' }]} format="pct" signColor />
        </Panel>
        <Panel title="Gross profit, operating income and net income">
          <ToggleChart views={[{ key: 'a', label: 'Fiscal years', data: incomeAnnual }, { key: 'q', label: 'Quarters', data: incomeQuarter, note: QUARTER_NOTE }]} series={[{ key: 'gp', name: 'Gross profit' }, { key: 'op', name: 'Operating income' }, { key: 'ni', name: 'Net income' }]} format="usdM" />
        </Panel>
        <Panel title="Expense composition" subtitle="Each cost line as a share of revenue">
          <SeriesChart data={expenseMix} series={[{ key: 'cogs', name: 'Cost of revenue', stack: 'e' }, { key: 'rnd', name: 'R&D', stack: 'e' }, { key: 'sga', name: 'SG&A', stack: 'e' }, { key: 'other', name: 'Arm termination', stack: 'e' }]} format="pct" note="Remaining height to 100% is operating margin." />
        </Panel>
        <Panel title="Diluted EPS" subtitle="Split-adjusted (10-for-1, June 2024)">
          <ToggleChart views={[{ key: 'a', label: 'Fiscal years', data: epsAnnual }, { key: 'q', label: 'Quarters', data: epsQuarter }]} series={[{ key: 'eps', name: 'Diluted EPS' }]} format="usd" />
        </Panel>
      </div>
    </div>
  );

  const balanceTab = (
    <div className="space-y-4">
      <StatementTableUrl title="Balance sheet" lines={BALANCE_SHEET} periods={BALANCE_PERIODS} annualKeys={['FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026']} interimKeys={['Q3-FY27']} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Asset composition">
          <SeriesChart data={assetMix} series={[
            { key: 'liquid', name: 'Cash & securities', stack: 'a' }, { key: 'ar', name: 'Receivables', stack: 'a' }, { key: 'inv', name: 'Inventory', stack: 'a' },
            { key: 'ppe', name: 'PP&E + leases', stack: 'a' }, { key: 'inv2', name: 'Non-marketable inv.', stack: 'a' }, { key: 'gw', name: 'Goodwill & intang.', stack: 'a', color: '#5c6775' }, { key: 'other', name: 'Other', stack: 'a', color: '#3a4452' },
          ]} format="usdM" height={260} />
        </Panel>
        <Panel title="Liability composition">
          <SeriesChart data={liabMix} series={[
            { key: 'ap', name: 'Payables', stack: 'l' }, { key: 'accrued', name: 'Accrued & other current', stack: 'l' }, { key: 'debt', name: 'Debt', stack: 'l' }, { key: 'lease', name: 'Lease liabilities', stack: 'l' }, { key: 'other', name: 'Other long-term', stack: 'l' },
          ]} format="usdM" height={260} />
        </Panel>
        <Panel title="Cash position vs debt" subtitle="Cash + marketable securities vs short- and long-term debt">
          <SeriesChart data={cashDebt} series={[{ key: 'liquid', name: 'Cash & marketable securities' }, { key: 'debt', name: 'Total debt' }]} format="usdM" />
        </Panel>
        <Panel title="Working capital and shareholders’ equity">
          <SeriesChart data={wcEquity} series={[{ key: 'wc', name: 'Working capital' }, { key: 'equity', name: 'Equity' }]} format="usdM" />
        </Panel>
      </div>
    </div>
  );

  const cashTab = (
    <div className="space-y-4">
      <StatementTableUrl title="Cash-flow statement" lines={CASH_FLOW} periods={FLOW_PERIODS} annualKeys={[...ANNUAL_KEYS]} interimKeys={['9M-FY26', '9M-FY27', 'Q3-FY26', 'Q3-FY27']} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Operating cash flow, free cash flow and capex" subtitle="FCF = operating cash flow − capital expenditures">
          <SeriesChart data={cfAnnual} series={[{ key: 'ocf', name: 'Operating cash flow' }, { key: 'fcf', name: 'Free cash flow' }, { key: 'capex', name: 'Capex' }]} format="usdM" note={TTM_NOTE} />
        </Panel>
        <Panel title="Cash conversion" subtitle="Operating and free cash flow relative to net income">
          <SeriesChart data={conversion} series={[{ key: 'cfo', name: 'CFO / NI', type: 'line' }, { key: 'fcf', name: 'FCF / NI', type: 'line' }]} format="x" />
        </Panel>
        <Panel title="Cash-flow composition" subtitle="Operating, investing and financing flows">
          <SeriesChart data={cfComposition} series={[{ key: 'ocf', name: 'Operating' }, { key: 'icf', name: 'Investing' }, { key: 'fin', name: 'Financing' }]} format="usdM" zeroLine />
        </Panel>
        <Panel title="Cash returned to shareholders">
          <SeriesChart data={returns} series={[{ key: 'buybacks', name: 'Repurchases', stack: 'r' }, { key: 'tax', name: 'RSU tax withholding', stack: 'r' }, { key: 'divs', name: 'Dividends', stack: 'r' }]} format="usdM" />
        </Panel>
      </div>
    </div>
  );

  const integratedTab = (
    <div className="space-y-4">
      <Panel title="Three-statement linkage" subtitle="How earnings, the balance sheet and cash flows reconcile — all values calculated from reported data" bodyClass="p-0" right={<StatusBadge status="calculated" />}>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead><tr><th>Measure</th>{IP.map((p) => <th key={p} className="n">{p === 'TTM' ? 'TTM / Oct 25, 2026' : p}</th>)}</tr></thead>
            <tbody>
              {integrated.map((r) => (
                <tr key={r.label}>
                  <td>{r.term ? <Term id={r.term}>{r.label}</Term> : r.label}</td>
                  {IP.map((p) => { const x = r.get(p); return <td key={p} className="n">{x == null ? <Unavailable /> : r.fmt(x)}</td>; })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-2 text-[11px] text-faint">TTM balance-sheet growth compares Oct 25, 2026 with Jan 25, 2026 (nine months). DSO/DIO use average balances; FY2022 averages are unavailable because no FY2021 balance sheet is included.</p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {findings.map((f) => (
          <Panel key={f.title} title={<span className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', f.tone === 'warn' ? 'bg-warn' : f.tone === 'up' ? 'bg-up' : 'bg-info')} />{f.title}</span>}>
            <div className="label mb-1">What the statements show</div>
            <p className="text-[12.5px] leading-5 text-ink/90">{f.fact}</p>
            <Interpretation label="Financial significance"><p>{f.meaning}</p></Interpretation>
          </Panel>
        ))}
      </div>
      <p className="text-[11.5px] text-faint">Unusual movements are flagged for investigation only. None of these observations is, by itself, evidence of fraud or accounting manipulation.</p>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Financial Statements"
        description="Five fiscal years (FY2022–FY2026) plus the nine months and third quarter of FY2027, read together. Click any row to expand its note and period-over-period change; use search to jump to a line item."
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded bg-panel" />}>
        <UrlTabs
          defaultValue="income"
          items={[
            { value: 'income', label: 'Income statement', content: incomeTab },
            { value: 'balance', label: 'Balance sheet', content: balanceTab },
            { value: 'cashflow', label: 'Cash flow', content: cashTab },
            { value: 'integrated', label: 'Integrated analysis', content: integratedTab },
          ]}
        />
      </Suspense>
      <SectionTitle>Reporting notes</SectionTitle>
      <div className="prose-research max-w-4xl">
        <p>Fiscal years end on the last Sunday of January (FY2026 ended Jan 25, 2026); NVIDIA’s fiscal year is not a calendar year. FY2022–FY2024 per-share data are restated for the June 2024 10-for-1 split. EBITDA, free cash flow and the “other” residual rows are calculated by this platform and labelled as such. NVIDIA reports sales & marketing and G&A as a single SG&A line, and interim releases do not separate interest income from other income — those cells show “Data unavailable”.</p>
      </div>
    </>
  );
}

function ratio(a: number | null, b: number | null) {
  return a == null || b == null || b === 0 ? null : a / b;
}
function abs(x: number | null) {
  return x == null ? null : Math.abs(x);
}
