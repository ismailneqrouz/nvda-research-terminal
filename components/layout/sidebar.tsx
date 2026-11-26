'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Presentation,
  BookOpen, Boxes, Calculator, Factory, FileSpreadsheet, Globe2, Landmark, LayoutDashboard, Menu, Newspaper, Percent, ShieldCheck, Swords, TrendingUp, TriangleAlert, X,
} from 'lucide-react';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/format';

const ICONS = { BookOpen, Boxes, Calculator, Factory, FileSpreadsheet, Globe2, Landmark, LayoutDashboard, Newspaper, Percent, ShieldCheck, Swords, TrendingUp, TriangleAlert };

export function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const isActive = (href: string) => (href === '/' ? path === '/' : path?.startsWith(href));

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed left-3 top-3 z-40 rounded border border-line bg-panel p-1.5 text-muted lg:hidden" aria-label="Open navigation">
        <Menu className="h-4 w-4" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-[rgb(11,15,21)] transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[4px] border border-up/40 bg-up/10 font-mono text-[10px] font-semibold text-up">NV</span>
            <span className="leading-tight">
              <span className="block text-[12.5px] font-semibold">NVDA Research</span>
              <span className="block text-[10.5px] text-faint">Fundamental terminal</span>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-muted lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Sections">
          {NAV.map((n, i) => {
            const Icon = ICONS[n.icon as keyof typeof ICONS];
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group mb-px flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[12.5px] transition-colors',
                  active ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink',
                )}
              >
                <span className="num w-4 text-right text-[10px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                <Icon className={cn('h-[15px] w-[15px] shrink-0', active ? 'text-up' : 'text-faint group-hover:text-muted')} strokeWidth={1.75} />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-2">
          <Link href="/present" className="flex items-center gap-2.5 rounded-[4px] border border-up/40 bg-up/10 px-2.5 py-2 text-[12.5px] font-medium text-up hover:bg-up/20">
            <Presentation className="h-[15px] w-[15px]" strokeWidth={1.75} />
            Präsentationsmodus
          </Link>
        </div>
        <div className="border-t border-line px-4 py-3 text-[10.5px] leading-4 text-faint">
          Research tool, not investment advice. Figures in USD; statements in millions.
        </div>
      </aside>
    </>
  );
}
