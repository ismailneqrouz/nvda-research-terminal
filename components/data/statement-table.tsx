'use client';
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import type { LineItem, Period } from '@/lib/data/schema';
import { Segmented } from '@/components/ui/button';
import { cn, millions, num, pct } from '@/lib/format';
import { growth } from '@/lib/finance/core';
import { SourceRef } from './source-ref';
import { StatusBadge, Unavailable } from './status';

function formatCell(v: number | null | undefined, unit: LineItem['unit']) {
  if (v == null) return null;
  if (unit === 'usd') return `$${v.toFixed(2)}`;
  if (unit === 'shares_m') return num(v);
  return millions(v);
}

/**
 * Financial statement table: searchable, with detail-level and period-set
 * toggles and expandable rows (notes + period-over-period change).
 */
export function StatementTable({ lines, periods, annualKeys, interimKeys, initialQuery = '', title }: {
  lines: LineItem[];
  periods: Period[];
  annualKeys: string[];
  interimKeys: string[];
  initialQuery?: string;
  title: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [detail, setDetail] = useState<'summary' | 'full'>('full');
  const [cols, setCols] = useState<'annual' | 'all'>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const keys = cols === 'annual' ? annualKeys : [...annualKeys, ...interimKeys];
  const shown = periods.filter((p) => keys.includes(p.key));
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return lines.filter((l) => (detail === 'full' || l.level < 2) && (!t || l.label.toLowerCase().includes(t) || l.id.toLowerCase().includes(t)));
  }, [lines, q, detail]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded border border-line bg-bg px-2.5 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="flex-1 bg-transparent text-[12.5px] placeholder:text-faint focus:outline-none" aria-label={`Search ${title}`} />
          {q && <button onClick={() => setQ('')} className="text-[11px] text-faint hover:text-ink">clear</button>}
        </label>
        <Segmented ariaLabel="Detail level" value={detail} onChange={setDetail} options={[{ value: 'summary', label: 'Summary' }, { value: 'full', label: 'Full detail' }]} />
        <Segmented ariaLabel="Periods" value={cols} onChange={setCols} options={[{ value: 'annual', label: 'Fiscal years' }, { value: 'all', label: '+ Interim' }]} />
        <span className="ml-auto text-[11px] text-faint">USD millions · per-share in USD · shares in millions</span>
      </div>
      <div className="overflow-x-auto rounded border border-line">
        <table className="tbl min-w-[860px]">
          <thead className="bg-raised/40">
            <tr>
              <th className="sticky left-0 z-10 min-w-[280px] bg-[rgb(17,23,31)]">Line item</th>
              {shown.map((p) => (
                <th key={p.key} className={cn('n', p.kind !== 'annual' && p.kind !== 'instant' && 'text-warn/80')}>
                  <div className="flex items-center justify-end gap-1">
                    {p.label}
                    <SourceRef ids={p.sourceId} period={`${p.label} (ended ${p.end})`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={shown.length + 1} className="py-8 text-center text-faint">No line items match “{q}”.</td></tr>
            )}
            {rows.map((l) => {
              const isOpen = !!open[l.id];
              return (
                <FragmentRow key={l.id}>
                  <tr className={cn('cursor-pointer', l.emphasis && 'font-medium')} onClick={() => setOpen((o) => ({ ...o, [l.id]: !o[l.id] }))} aria-expanded={isOpen}>
                    <td className={cn('sticky left-0 z-10 bg-panel', l.level === 0 && 'text-ink', l.level === 2 && 'pl-8 text-muted')}>
                      <div className="flex items-center gap-1.5">
                        <ChevronRight className={cn('h-3 w-3 shrink-0 text-faint transition-transform', isOpen && 'rotate-90')} />
                        <span>{l.label}</span>
                        {l.status === 'calculated' && <StatusBadge status="calculated" />}
                        {l.note && <span className="text-faint" title={l.note}>ⓘ</span>}
                      </div>
                    </td>
                    {shown.map((p) => {
                      const v = formatCell(l.values[p.key], l.unit);
                      const neg = (l.values[p.key] ?? 0) < 0;
                      return <td key={p.key} className={cn('n', neg && 'text-down/90')}>{v ?? <Unavailable />}</td>;
                    })}
                  </tr>
                  {isOpen && (
                    <tr className="bg-raised/30">
                      <td className="sticky left-0 z-10 bg-[rgb(17,23,31)] pl-8 align-top text-[11.5px] text-muted">
                        <div className="max-w-[320px] whitespace-normal leading-5">
                          {l.note ?? (l.status === 'calculated' ? 'Calculated by this platform from reported line items.' : 'Reported figure.')}
                          <div className="mt-1 text-faint">Row below: change vs prior comparable period.</div>
                        </div>
                      </td>
                      {shown.map((p, i) => {
                        const prev = comparablePrior(shown, i, periods);
                        const g = prev ? growth(l.values[p.key], l.values[prev]) : null;
                        return <td key={p.key} className={cn('n text-[11px]', g == null ? 'text-faint' : g >= 0 ? 'text-up/80' : 'text-down/80')}>{g == null ? '—' : pct(g, 1, true)}</td>;
                      })}
                    </tr>
                  )}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Prior comparable period: previous fiscal year for annual columns; same period one year earlier for YTD/quarter. */
function comparablePrior(shown: Period[], i: number, all: Period[]): string | null {
  const p = shown[i];
  if (p.kind === 'annual' || p.kind === 'instant') {
    const annuals = all.filter((x) => x.kind === p.kind);
    const j = annuals.findIndex((x) => x.key === p.key);
    if (p.kind === 'instant' && p.key === 'Q3-FY27') return 'FY2026';
    return j > 0 ? annuals[j - 1].key : null;
  }
  const map: Record<string, string> = { '9M-FY27': '9M-FY26', 'Q3-FY27': 'Q3-FY26' };
  return map[p.key] ?? null;
}
