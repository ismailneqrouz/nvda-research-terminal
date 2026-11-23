import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { SOURCES } from '@/lib/data/sources';
import { GLOSSARY } from '@/lib/data/glossary';
import { DATA_LAST_UPDATED } from '@/lib/data/market';
import { getResearchData } from '@/lib/data/provider';
import type { DataStatus } from '@/lib/data/schema';
import { date } from '@/lib/format';
import { PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { StatusBadge } from '@/components/data/status';

export const metadata: Metadata = { title: 'Sources & Methodology' };

const KIND_ORDER = ['filing', 'company', 'government', 'data-provider', 'legal', 'research', 'news'] as const;
const KIND_LABEL: Record<string, string> = { filing: 'SEC filings', company: 'NVIDIA investor relations', government: 'Government statistics', 'data-provider': 'Financial data providers', legal: 'Law-firm regulatory analysis', research: 'Research & analysis', news: 'News organizations' };
const STATUSES: { s: DataStatus; d: string }[] = [
  { s: 'reported', d: 'Transcribed from an NVIDIA filing or release (or a provider reproducing it).' },
  { s: 'calculated', d: 'Derived by this platform from reported figures with the formula shown.' },
  { s: 'ttm', d: 'Trailing twelve months: FY2026 + 9M FY2027 − 9M FY2026.' },
  { s: 'estimate', d: 'Third-party analyst consensus or research forecast.' },
  { s: 'guidance', d: 'NVIDIA management outlook.' },
  { s: 'assumption', d: 'This platform’s model input (DCF, stress test, scenarios).' },
  { s: 'market', d: 'Market prices and related data.' },
  { s: 'assessment', d: 'Qualitative judgement (scores, severities, interpretations).' },
];

export default async function SourcesPage() {
  const { provider } = await getResearchData();
  return (
    <>
      <PageHeader title="Sources & Methodology" description="Where every number comes from, how calculated figures are derived, and the limits of this dataset." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Data integrity rules">
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>NVIDIA’s SEC filings are the primary source for financial statements. FY2022–FY2025 balance-sheet lines were taken from StockAnalysis and reconciled to NVIDIA’s reported totals; automated tests verify that every statement balances and every cash-flow statement reconciles.</li>
            <li>Missing values are shown as “Data unavailable” — never estimated or silently substituted.</li>
            <li>Fiscal years (ending late January) are always labelled FY; calendar years are written as plain years (e.g. hyperscaler capex 2026).</li>
            <li>Valuation multiples are calculated here and cross-checked against an independent provider (tests fail if they differ by more than 1%).</li>
            <li>News items separate reported facts from interpretation; unconfirmed media reports are flagged.</li>
            <li>No figure is presented as reported if it was calculated, estimated or assumed.</li>
          </ul>
        </Panel>
        <Panel title="Status labels">
          <table className="tbl"><tbody>{STATUSES.map((x) => <tr key={x.s}><td className="w-28"><StatusBadge status={x.s} /></td><td className="whitespace-normal text-[12.5px]">{x.d}</td></tr>)}</tbody></table>
        </Panel>
        <Panel title="Dataset">
          <dl className="grid grid-cols-[160px_1fr] gap-y-1.5 text-[12.5px]">
            <dt className="text-muted">Last updated</dt><dd>{date(DATA_LAST_UPDATED, 'long')}</dd>
            <dt className="text-muted">Latest filing</dt><dd>Q3 FY2027 (quarter ended Oct 25, 2026), released Nov 17, 2026</dd>
            <dt className="text-muted">Market data</dt><dd>Close of Friday, Nov 20, 2026</dd>
            <dt className="text-muted">Active data provider</dt><dd className="capitalize">{provider} {provider === 'static' ? '(bundled, validated dataset; set DATABASE_URL to serve from PostgreSQL)' : ''}</dd>
            <dt className="text-muted">Currency & units</dt><dd>USD; statements in millions; per-share in USD; shares in millions</dd>
          </dl>
        </Panel>
        <Panel title="Known limitations">
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>Market data are a static snapshot, not a live feed. No price API is called.</li>
            <li>Interim releases do not split interest income/expense; TTM EBIT and interest coverage are therefore unavailable.</li>
            <li>FY2021 balance sheet is not included, so FY2022 average-based ratios (ROIC, DSO, DIO) are unavailable.</li>
            <li>FY2026 segment revenue is disclosed to $0.1B; FY2027 segments are reported on a new basis and not restated historically.</li>
            <li>Debt maturity schedule, Form 4 insider transactions and executive pay amounts were not extracted.</li>
            <li>Several November 2026 developments rest on media reports (WSJ, Reuters) that neither NVIDIA nor the SEC has confirmed.</li>
          </ul>
        </Panel>
      </div>

      <SectionTitle>Source register</SectionTitle>
      <div className="space-y-4">
        {KIND_ORDER.map((k) => {
          const xs = SOURCES.filter((s) => s.kind === k);
          if (!xs.length) return null;
          return (
            <Panel key={k} title={KIND_LABEL[k]} subtitle={`${xs.length} sources`} bodyClass="p-0">
              <div className="overflow-x-auto">
                <table className="tbl min-w-[760px]">
                  <thead><tr><th>Title</th><th>Publisher</th><th>Published</th><th>Accessed</th><th>Use / note</th></tr></thead>
                  <tbody>
                    {xs.map((s) => (
                      <tr key={s.id} id={`src-${s.id}`}>
                        <td className="whitespace-normal"><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-info hover:underline">{s.title}<ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /></a></td>
                        <td className="text-muted">{s.publisher}</td>
                        <td className="num text-muted">{s.published ? date(s.published) : '—'}</td>
                        <td className="num text-muted">{date(s.accessed)}</td>
                        <td className="whitespace-normal text-[12px] text-muted">{s.note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          );
        })}
      </div>

      <SectionTitle id="glossary">Definitions & formulas</SectionTitle>
      <div className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2 xl:grid-cols-3">
        {GLOSSARY.map((t) => (
          <div key={t.id} id={`term-${t.id}`} className="scroll-mt-24 bg-panel p-4 target:bg-raised">
            <div className="text-[13px] font-semibold">{t.term}</div>
            <div className="mt-1 font-mono text-[11px] leading-4 text-info/90">{t.formula}</div>
            <p className="mt-1.5 text-[12px] leading-5 text-muted">{t.measures} {t.why}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-faint">This platform is a research tool. It is not investment, legal or tax advice, and it does not make buy/sell recommendations.</p>
    </>
  );
}
