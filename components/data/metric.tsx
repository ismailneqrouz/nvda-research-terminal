import type { DataStatus } from '@/lib/data/schema';
import { cn, isUnavailable } from '@/lib/format';
import { SourceRef } from './source-ref';
import { StatusBadge } from './status';
import { Term } from './term';

export interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  delta?: { text: string; positive: boolean | null };
  status: DataStatus;
  sourceIds?: string[];
  period?: string;
  termId?: string;
  className?: string;
}

/** KPI tile used across the terminal. Always shows status and source. */
export function Metric({ label, value, sub, delta, status, sourceIds, period, termId, className }: MetricProps) {
  const unavailable = isUnavailable(value);
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 bg-panel px-3.5 py-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[11px] font-medium text-muted">{termId ? <Term id={termId}>{label}</Term> : label}</div>
        <StatusBadge status={status} />
      </div>
      <div className={cn('num truncate text-[19px] font-medium leading-tight tracking-tight', unavailable && 'text-[12px] italic text-faint font-sans')}>{value}</div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-faint">
        <span className="truncate">
          {delta && <span className={cn('num mr-1.5', delta.positive == null ? 'text-muted' : delta.positive ? 'text-up' : 'text-down')}>{delta.text}</span>}
          {sub}
        </span>
        {sourceIds && sourceIds.length > 0 && <SourceRef ids={sourceIds} period={period} />}
      </div>
    </div>
  );
}

/** Grid wrapper giving 1px hairline separators between tiles. */
export function MetricGrid({ children, cols = 'grid-cols-2 md:grid-cols-4 xl:grid-cols-6', className }: { children: React.ReactNode; cols?: string; className?: string }) {
  return <div className={cn('grid gap-px overflow-hidden rounded border border-line bg-line', cols, className)}>{children}</div>;
}
