import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/format';
import { SourceRef } from './source-ref';

export function PageHeader({ title, description, crumbs = [] }: { title: string; description: string; crumbs?: { href: string; label: string }[] }) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-[11px] text-faint">
        <Link href="/" className="hover:text-muted">NVDA</Link>
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={c.href} className="hover:text-muted">{c.label}</Link>
          </span>
        ))}
        <ChevronRight className="h-3 w-3" />
        <span className="text-muted">{title}</span>
      </nav>
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-muted">{description}</p>
    </header>
  );
}

export function Panel({ title, subtitle, right, children, className, bodyClass, sourceIds, id }: {
  title?: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string; sourceIds?: string[]; id?: string;
}) {
  return (
    <section id={id} className={cn('panel scroll-mt-20', className)}>
      {(title || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="h-section flex items-center gap-2">{title}{sourceIds && <SourceRef ids={sourceIds} />}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] leading-5 text-muted">{subtitle}</p>}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}
      <div className={cn('p-4', bodyClass)}>{children}</div>
    </section>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="mb-3 mt-10 scroll-mt-20 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted first:mt-0">{children}</h2>;
}

/** Visually separates factual statements from interpretation. */
export function Interpretation({ children, label = 'Interpretation' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="mt-3 border-l-2 border-[#c79bf2]/50 pl-3">
      <div className="label mb-1 text-[#c79bf2]/90">{label}</div>
      <div className="prose-research">{children}</div>
    </div>
  );
}

export function Callout({ tone = 'neutral', title, children }: { tone?: 'neutral' | 'warn' | 'down' | 'up'; title: string; children: React.ReactNode }) {
  const t = { neutral: 'border-line bg-raised/40', warn: 'border-warn/40 bg-warn/[0.06]', down: 'border-down/40 bg-down/[0.06]', up: 'border-up/40 bg-up/[0.06]' }[tone];
  const c = { neutral: 'text-ink', warn: 'text-warn', down: 'text-down', up: 'text-up' }[tone];
  return (
    <div className={cn('rounded border px-4 py-3', t)}>
      <div className={cn('mb-1 text-[12px] font-semibold', c)}>{title}</div>
      <div className="text-[12.5px] leading-5 text-ink/85">{children}</div>
    </div>
  );
}
