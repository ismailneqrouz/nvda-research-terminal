'use client';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GLOSSARY_MAP } from '@/lib/data/glossary';
import { cn } from '@/lib/format';

/** Clickable financial term: explains what it measures, how it is calculated and why it matters. */
export function Term({ id, children, className, icon = false }: { id: string; children?: React.ReactNode; className?: string; icon?: boolean }) {
  const t = GLOSSARY_MAP[id];
  if (!t) return <>{children}</>;
  return (
    <Popover>
      <PopoverTrigger className={cn('group inline-flex items-center gap-1 text-left decoration-faint/70 decoration-dotted underline-offset-[3px] hover:underline hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-up/50 rounded-[2px]', className)}>
        {children ?? t.term}
        {icon && <Info className="h-3 w-3 text-faint group-hover:text-muted" />}
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] space-y-2.5">
        <div className="text-[13px] font-semibold">{t.term}</div>
        <Row k="Measures">{t.measures}</Row>
        <Row k="Calculation"><span className="font-mono text-[11.5px] text-ink/90">{t.formula}</span></Row>
        <Row k="Why it matters">{t.why}</Row>
        {t.good && <Row k="Reading it">{t.good}</Row>}
      </PopoverContent>
    </Popover>
  );
}
function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-0.5">{k}</div>
      <div className="leading-5 text-ink/85">{children}</div>
    </div>
  );
}
