'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/format';

/** Shows how old the market data is relative to the viewer's clock. */
export function Freshness({ asOf, label }: { asOf: string; label: string }) {
  const [age, setAge] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setAge((Date.now() - new Date(asOf).getTime()) / 86_400_000);
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [asOf]);
  const tone = age == null ? 'bg-faint' : age <= 3.5 ? 'bg-up' : age <= 10 ? 'bg-warn' : 'bg-down';
  const text = age == null ? '' : age < 1 ? 'today' : `${Math.floor(age)}d old`;
  return (
    <span className="inline-flex items-center gap-1.5" title={`Market data snapshot: ${label}. Static dataset — refresh by re-seeding the data provider.`}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone)} />
      <span>{text || '…'}</span>
    </span>
  );
}
