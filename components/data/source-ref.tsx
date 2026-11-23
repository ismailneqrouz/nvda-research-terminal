'use client';
import { ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SOURCE_MAP } from '@/lib/data/sources';
import { cn, date } from '@/lib/format';

/** Small source marker that opens the full citation. */
export function SourceRef({ ids, period, className, label }: { ids: string | string[]; period?: string; className?: string; label?: string }) {
  const list = (Array.isArray(ids) ? ids : [ids]).map((id) => SOURCE_MAP[id]).filter(Boolean);
  if (!list.length) return null;
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Show source"
        className={cn('inline-flex items-center gap-1 rounded-[3px] px-1 text-[10px] text-faint hover:text-info hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info/50', className)}
      >
        {label ?? 'src'}
        {list.length > 1 && <span className="num">{list.length}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-96 space-y-3">
        {period && <div className="label">Reporting period · {period}</div>}
        {list.map((s) => (
          <div key={s.id} className="space-y-1">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-1.5 font-medium text-ink hover:text-info">
              <span>{s.title}</span>
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
            </a>
            <div className="text-[11px] text-muted">
              {s.publisher}
              {s.published && <> · published {date(s.published)}</>} · accessed {date(s.accessed)} · <span className="uppercase tracking-wider">{s.kind}</span>
            </div>
            {s.note && <p className="text-[11.5px] leading-5 text-muted">{s.note}</p>}
          </div>
        ))}
        <div className="border-t border-line pt-2 text-[10.5px] text-faint">Currency: USD. Statement values in millions unless stated.</div>
      </PopoverContent>
    </Popover>
  );
}
