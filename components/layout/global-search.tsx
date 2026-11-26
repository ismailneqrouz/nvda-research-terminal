'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NAV, PRESENT_LINK } from '@/lib/nav';
import { GLOSSARY } from '@/lib/data/glossary';
import { ALL_LINES } from '@/lib/data/financials';
import { NEWS } from '@/lib/data/news';
import { RISKS } from '@/lib/data/risks';
import { cn } from '@/lib/format';

interface Hit { kind: string; label: string; detail?: string; href: string; hay: string }

function buildIndex(): Hit[] {
  const statementPage: Record<string, string> = { income: 'income', balance: 'balance', cashflow: 'cashflow' };
  return [
    ...NAV.map((n) => ({ kind: 'Section', label: n.label, href: n.href, hay: `${n.label} ${n.keywords}` })),
    { kind: 'Section', label: PRESENT_LINK.label, href: PRESENT_LINK.href, hay: `${PRESENT_LINK.label} ${PRESENT_LINK.keywords}` },
    ...GLOSSARY.map((t) => ({ kind: 'Metric', label: t.term, detail: t.measures, href: `/sources#term-${t.id}`, hay: `${t.term} ${t.measures}` })),
    ...ALL_LINES.map((l) => ({ kind: 'Line item', label: l.label, detail: l.statement, href: `/financial-statements?tab=${statementPage[l.statement]}&q=${encodeURIComponent(l.label)}`, hay: `${l.label} ${l.statement}` })),
    ...NEWS.map((n) => ({ kind: 'News', label: n.headline, detail: n.date, href: `/news#${n.id}`, hay: `${n.headline} ${n.category}` })),
    ...RISKS.map((r) => ({ kind: 'Risk', label: r.title, detail: r.category, href: `/risk-analysis#risk-${r.id}`, hay: `${r.title} ${r.category} ${r.description}` })),
  ];
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const index = useMemo(buildIndex, []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !(e.target as HTMLElement)?.closest('input,textarea')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hits = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return index.filter((h) => h.kind === 'Section');
    return index.filter((h) => terms.every((t) => h.hay.toLowerCase().includes(t))).slice(0, 40);
  }, [q, index]);

  useEffect(() => setSel(0), [q]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ('');
    router.push(h.href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-[280px] items-center gap-2 rounded border border-line bg-bg px-2.5 text-[12px] text-faint hover:border-faint hover:text-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search metrics, line items, news…</span>
        <kbd className="num rounded border border-line px-1 text-[10px]">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}>
          <DialogTitle className="sr-only">Search the research terminal</DialogTitle>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-4 w-4 text-faint" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
              }}
              placeholder="e.g. ROIC, inventories, export, Kress…"
              className="h-11 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul className="max-h-[55vh] overflow-y-auto p-1.5" role="listbox">
            {hits.length === 0 && <li className="px-3 py-6 text-center text-[12.5px] text-faint">No matches for “{q}”.</li>}
            {hits.map((h, i) => (
              <li key={`${h.kind}-${h.href}-${i}`} role="option" aria-selected={i === sel}>
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(h)}
                  className={cn('flex w-full items-center gap-3 rounded px-2.5 py-2 text-left', i === sel ? 'bg-raised' : '')}
                >
                  <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-faint">{h.kind}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink">{h.label}</span>
                    {h.detail && <span className="block truncate text-[11px] text-faint">{h.detail}</span>}
                  </span>
                  {i === sel && <CornerDownLeft className="h-3.5 w-3.5 text-faint" />}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
