'use client';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '@/lib/data/schema';
import { Segmented } from '@/components/ui/button';
import { SERIES } from './palette';

type View = 'daily' | 'long';

export function PriceChart({ points, height = 230 }: { points: PricePoint[]; height?: number }) {
  const [view, setView] = useState<View>('daily');
  const data = useMemo(
    () =>
      points
        .filter((p) => (view === 'daily' ? p.kind === 'daily' : p.kind === 'year-end' || p.date === points[points.length - 1].date))
        .map((p) => ({ date: p.date, label: view === 'daily' ? p.date.slice(5) : p.date.slice(0, 4) + (p.kind === 'daily' ? ' (Nov 20)' : ''), close: p.close })),
    [points, view],
  );
  const first = data[0]?.close ?? 0;
  const last = data[data.length - 1]?.close ?? 0;
  const chg = first ? last / first - 1 : 0;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11.5px] text-muted">
          {view === 'daily' ? 'Daily closes, Sep 14 – Nov 20, 2026' : 'Calendar year-end closes 2019–2025 (split- & dividend-adjusted) + latest close'}
          <span className={`num ml-2 ${chg < 0 ? 'text-down' : 'text-up'}`}>{chg < 0 ? '−' : '+'}{Math.abs(chg * 100).toFixed(1)}% over period</span>
        </div>
        <Segmented ariaLabel="Price history range" value={view} onChange={setView} options={[{ value: 'daily', label: 'Recent daily' }, { value: 'long', label: 'Long term' }]} />
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="px" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'rgb(33 42 54)' }} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} width={44} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} scale={view === 'long' ? 'log' : 'auto'} />
            {view === 'daily' && <ReferenceLine x="11-12" stroke="#c98500" strokeDasharray="3 3" label={{ value: 'CEO exit', fill: '#c98500', fontSize: 10, position: 'insideTopLeft' }} />}
            {view === 'daily' && <ReferenceLine x="11-17" stroke="#9085e9" strokeDasharray="3 3" label={{ value: 'Q3 report', fill: '#9085e9', fontSize: 10, position: 'insideTopRight' }} />}
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded border border-line bg-raised px-3 py-2 text-[11.5px] shadow-xl">
                    <div className="text-muted">{(payload[0].payload as { date: string }).date}</div>
                    <div className="num text-ink">${(payload[0].value as number).toFixed(2)}</div>
                  </div>
                ) : null
              }
            />
            <Area type="monotone" dataKey="close" stroke={SERIES[0]} strokeWidth={2} fill="url(#px)" isAnimationActive={false} dot={view === 'long' ? { r: 3, fill: SERIES[0], strokeWidth: 0 } : false} activeDot={{ r: 4.5, stroke: '#0e131a', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {view === 'long' && <p className="mt-2 text-[11px] text-faint">Log scale. Only verified closes are plotted — no interpolation between year-end points.</p>}
    </div>
  );
}
