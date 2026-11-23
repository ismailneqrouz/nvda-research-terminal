import type { DataStatus } from '@/lib/data/schema';
import { cn } from '@/lib/format';

const STYLES: Record<DataStatus, { label: string; cls: string; title: string }> = {
  reported: { label: 'Reported', cls: 'text-ink/80 border-line', title: 'Taken directly from an NVIDIA filing or press release' },
  calculated: { label: 'Calc.', cls: 'text-info border-info/30', title: 'Calculated by this platform from reported figures' },
  ttm: { label: 'TTM', cls: 'text-info border-info/30', title: 'Trailing twelve months: FY2026 + 9M FY2027 − 9M FY2026' },
  estimate: { label: 'Consensus', cls: 'text-warn border-warn/30', title: 'Third-party analyst consensus estimate' },
  guidance: { label: 'Guidance', cls: 'text-warn border-warn/30', title: 'NVIDIA management outlook' },
  assumption: { label: 'Assumption', cls: 'text-[#c79bf2] border-[#c79bf2]/30', title: 'This platform’s model assumption — not a fact' },
  market: { label: 'Market', cls: 'text-muted border-line', title: 'Market data' },
  assessment: { label: 'Assessment', cls: 'text-[#c79bf2] border-[#c79bf2]/30', title: 'Qualitative judgement by this platform' },
};

export function StatusBadge({ status, className }: { status: DataStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span title={s.title} className={cn('inline-flex items-center rounded-[3px] border px-1 py-px text-[9.5px] font-medium uppercase tracking-wider leading-none', s.cls, className)}>
      {s.label}
    </span>
  );
}

export function Unavailable({ className }: { className?: string }) {
  return <span className={cn('text-[11px] italic text-faint', className)}>Data unavailable</span>;
}

export function Tone({ v, children, invert = false }: { v: number | null | undefined; children: React.ReactNode; invert?: boolean }) {
  if (v == null) return <>{children}</>;
  const good = invert ? v < 0 : v > 0;
  return <span className={good ? 'text-up' : v === 0 ? '' : 'text-down'}>{children}</span>;
}
