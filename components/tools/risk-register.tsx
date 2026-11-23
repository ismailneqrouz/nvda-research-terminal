'use client';
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import type { Risk } from '@/lib/data/schema';
import { SEVERITY_ORDER } from '@/lib/data/risks';
import { SourceRef } from '@/components/data/source-ref';
import { cn } from '@/lib/format';

const SEV = { critical: 'bg-down/15 text-down border-down/40', high: 'bg-warn/15 text-warn border-warn/40', moderate: 'bg-info/10 text-info border-info/30', low: 'bg-raised text-muted border-line' } as const;
const PROB = ['low', 'medium', 'elevated', 'high'] as const;

/** Filterable, expandable risk register with a probability × severity heat map. */
export function RiskRegister({ risks }: { risks: Risk[] }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const cats = ['All', ...Array.from(new Set(risks.map((r) => r.category)))];
  const rows = useMemo(
    () =>
      risks
        .filter((r) => (cat === 'All' || r.category === cat) && (!q || `${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())))
        .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]),
    [risks, cat, q],
  );

  return (
    <div className="grid gap-4 2xl:grid-cols-[1fr_320px]">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <label className="flex h-8 items-center gap-2 rounded border border-line bg-bg px-2.5">
            <Search className="h-3.5 w-3.5 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter risks…" className="w-40 bg-transparent text-[12.5px] focus:outline-none" aria-label="Filter risks" />
          </label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-8 rounded border border-line bg-bg px-2 text-[12.5px] text-ink" aria-label="Risk category">
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span className="ml-auto text-[11px] text-faint">{rows.length} of {risks.length} risks · click a row for details</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[880px]">
            <thead><tr><th>Risk</th><th>Category</th><th>Probability</th><th>Severity</th><th>Horizon</th><th>Residual</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <FragmentRows key={r.id}>
                  <tr id={`risk-${r.id}`} className="cursor-pointer scroll-mt-24" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                    <td className="font-medium"><span className="flex items-center gap-1.5"><ChevronRight className={cn('h-3 w-3 text-faint transition-transform', open === r.id && 'rotate-90')} />{r.title}</span></td>
                    <td className="text-muted">{r.category}</td>
                    <td className="capitalize">{r.probability}</td>
                    <td><span className={cn('rounded-[3px] border px-1.5 py-px text-[10.5px] uppercase tracking-wider', SEV[r.severity])}>{r.severity}</span></td>
                    <td className="text-muted">{r.horizon}</td>
                    <td><span className={cn('rounded-[3px] border px-1.5 py-px text-[10.5px] uppercase tracking-wider', SEV[r.residual])}>{r.residual}</span></td>
                  </tr>
                  {open === r.id && (
                    <tr className="bg-raised/30">
                      <td colSpan={6} className="whitespace-normal">
                        <div className="grid gap-4 py-2 md:grid-cols-2">
                          <div className="space-y-2 text-[12.5px] leading-5">
                            <div><span className="label">Description</span><p className="text-ink/90">{r.description}</p></div>
                            <div><span className="label">Potential financial impact</span><p className="text-ink/90">{r.impact}</p></div>
                          </div>
                          <div className="space-y-2 text-[12.5px] leading-5">
                            <div><span className="label">Early-warning indicators</span><ul className="list-disc pl-4 text-ink/90">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
                            <div><span className="label">Mitigation</span><p className="text-ink/90">{r.mitigation}</p></div>
                            {r.sourceIds.length > 0 && <SourceRef ids={r.sourceIds} label="sources" />}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRows>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel p-4">
        <div className="h-section mb-1">Heat map</div>
        <p className="mb-3 text-[11.5px] text-faint">Count of risks by probability (rows) and severity (columns). Click a cell to filter.</p>
        <div className="grid grid-cols-[70px_repeat(4,1fr)] gap-1 text-center text-[11px]">
          <div />
          {(['low', 'moderate', 'high', 'critical'] as const).map((s) => <div key={s} className="capitalize text-muted">{s}</div>)}
          {[...PROB].reverse().map((p) => (
            <Row key={p} p={p} risks={risks} onPick={(id) => { setCat('All'); setQ(''); setOpen(id); document.getElementById(`risk-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ p, risks, onPick }: { p: (typeof PROB)[number]; risks: Risk[]; onPick: (id: string) => void }) {
  return (
    <>
      <div className="self-center text-right capitalize text-muted">{p}</div>
      {(['low', 'moderate', 'high', 'critical'] as const).map((s) => {
        const xs = risks.filter((r) => r.probability === p && r.severity === s);
        const heat = SEVERITY_ORDER[s] + PROB.indexOf(p);
        return (
          <button
            key={s}
            disabled={!xs.length}
            onClick={() => xs[0] && onPick(xs[0].id)}
            title={xs.map((x) => x.title).join('\n')}
            className={cn('num h-11 rounded-[3px] border text-[13px]', !xs.length ? 'border-line/60 text-faint' : heat >= 5 ? 'border-down/50 bg-down/20 text-down' : heat >= 3 ? 'border-warn/50 bg-warn/15 text-warn' : 'border-info/40 bg-info/10 text-info')}
          >
            {xs.length || ''}
          </button>
        );
      })}
    </>
  );
}

function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
