'use client';
import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { NewsItem } from '@/lib/data/schema';
import { SOURCE_MAP } from '@/lib/data/sources';
import { Segmented } from '@/components/ui/button';
import { cn, date } from '@/lib/format';

const IMPACT = { positive: 'text-up border-up/40 bg-up/10', negative: 'text-down border-down/40 bg-down/10', mixed: 'text-warn border-warn/40 bg-warn/10', neutral: 'text-muted border-line bg-raised' } as const;

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [cat, setCat] = useState('all');
  const [impact, setImpact] = useState<'all' | NewsItem['thesisImpact']>('all');
  const [q, setQ] = useState('');
  const cats = ['all', ...Array.from(new Set(items.map((i) => i.category)))];
  const rows = useMemo(
    () => items
      .filter((i) => (cat === 'all' || i.category === cat) && (impact === 'all' || i.thesisImpact === impact) && (!q || `${i.headline} ${i.summary}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [items, cat, impact, q],
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search news…" aria-label="Search news" className="h-8 w-52 rounded border border-line bg-bg px-2.5 text-[12.5px] placeholder:text-faint focus:outline-none focus:border-faint" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-8 rounded border border-line bg-bg px-2 text-[12.5px] capitalize">
          {cats.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </select>
        <Segmented ariaLabel="Thesis impact" value={impact} onChange={setImpact} options={[{ value: 'all', label: 'All' }, { value: 'positive', label: 'Positive' }, { value: 'negative', label: 'Negative' }, { value: 'mixed', label: 'Mixed' }, { value: 'neutral', label: 'Neutral' }]} />
        <span className="ml-auto text-[11px] text-faint">{rows.length} items</span>
      </div>
      {rows.length === 0 && <div className="panel py-12 text-center text-[12.5px] text-faint">No items match these filters.</div>}
      <ol className="relative space-y-3 border-l border-line pl-5">
        {rows.map((n) => (
          <li key={n.id} id={n.id} className="scroll-mt-24">
            <span className={cn('absolute -left-[5px] mt-4 h-2.5 w-2.5 rounded-full border-2 border-bg', n.thesisImpact === 'positive' ? 'bg-up' : n.thesisImpact === 'negative' ? 'bg-down' : n.thesisImpact === 'mixed' ? 'bg-warn' : 'bg-faint')} />
            <article className="panel p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="num text-muted">{date(n.date)}</span>
                <span className="rounded-[3px] bg-raised px-1.5 py-px uppercase tracking-wider text-faint">{n.category}</span>
                {!n.confirmed && <span className="rounded-[3px] border border-warn/40 px-1.5 py-px text-warn">Media report — unconfirmed</span>}
                <span className={cn('ml-auto rounded-[3px] border px-1.5 py-px uppercase tracking-wider', IMPACT[n.thesisImpact])}>Thesis: {n.thesisImpact}</span>
              </div>
              <h3 className="text-[14px] font-semibold leading-snug">{n.headline}</h3>
              <div className="mt-2 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="label mb-0.5">Reported facts</div>
                  <p className="text-[12.5px] leading-5 text-ink/90">{n.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {n.sourceIds.map((id) => {
                      const s = SOURCE_MAP[id];
                      return s ? (
                        <a key={id} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-info hover:underline">
                          {s.publisher}{s.published ? `, ${date(s.published)}` : ''}<ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="border-l-2 border-[#c79bf2]/40 pl-3">
                  <div className="label mb-0.5 text-[#c79bf2]/90">Interpretation</div>
                  <p className="text-[12.5px] leading-5 text-ink/85"><span className="text-muted">Relevance: </span>{n.relevance}</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-ink/85"><span className="text-muted">Potential financial impact: </span>{n.financialImpact}</p>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
