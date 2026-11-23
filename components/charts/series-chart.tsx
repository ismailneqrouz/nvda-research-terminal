'use client';
import { useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Segmented } from '@/components/ui/button';
import { cn } from '@/lib/format';
import { SERIES } from './palette';

export type Fmt = 'usdM' | 'pct' | 'x' | 'usd' | 'days' | 'num';

export function fmtValue(v: number | null | undefined, f: Fmt): string {
  if (v == null || !Number.isFinite(v)) return 'Data unavailable';
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  switch (f) {
    case 'usdM': return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(2)}T` : a >= 1000 ? `${s}$${(a / 1000).toFixed(1)}B` : `${s}$${a.toFixed(0)}M`;
    case 'pct': return `${s}${(a * 100).toFixed(1)}%`;
    case 'x': return `${v.toFixed(1)}×`;
    case 'usd': return `${s}$${a.toFixed(2)}`;
    case 'days': return `${v.toFixed(0)} d`;
    default: return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
}
function axisTick(v: number, f: Fmt): string {
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  if (f === 'usdM') return a >= 1e6 ? `${s}${(a / 1e6).toFixed(1)}T` : a >= 1000 ? `${s}${(a / 1000).toFixed(0)}B` : `${s}${a.toFixed(0)}M`;
  if (f === 'pct') return `${(v * 100).toFixed(0)}%`;
  if (f === 'usd') return `$${v.toFixed(a < 10 ? 1 : 0)}`;
  if (f === 'x') return `${v.toFixed(0)}×`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export interface SeriesDef {
  key: string;
  name: string;
  type?: 'bar' | 'line';
  color?: string;
  stack?: string;
  dashed?: boolean;
}

export interface SeriesChartProps {
  data: Record<string, string | number | null>[];
  xKey?: string;
  series: SeriesDef[];
  format: Fmt;
  height?: number;
  /** Colour bars by sign (for single-series bar charts like growth or cash flow). */
  signColor?: boolean;
  zeroLine?: boolean;
  note?: string;
  showTableToggle?: boolean;
}

function TooltipBox({ active, payload, label, format }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; format: Fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-line bg-raised px-3 py-2 text-[11.5px] shadow-xl shadow-black/40">
      <div className="mb-1 font-medium text-ink">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />{p.name}</span>
          <span className="num text-ink">{fmtValue(p.value, format)}</span>
        </div>
      ))}
    </div>
  );
}

/** Single-axis bar/line chart with hover tooltip and a table view (accessibility). */
export function SeriesChart({ data, xKey = 'label', series, format, height = 240, signColor = false, zeroLine = false, note, showTableToggle = true }: SeriesChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? SERIES[i % SERIES.length] }));
  const hasNeg = data.some((d) => series.some((s) => typeof d[s.key] === 'number' && (d[s.key] as number) < 0));
  return (
    <div>
      {showTableToggle && (
        <div className="mb-2 flex justify-end">
          <Segmented ariaLabel="Chart or table" value={view} onChange={setView} options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} />
        </div>
      )}
      {view === 'chart' ? (
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%" barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={{ stroke: 'rgb(33 42 54)' }} interval="preserveStartEnd" minTickGap={8} />
              <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => axisTick(v, format)} />
              <Tooltip content={<TooltipBox format={format} />} cursor={{ fill: 'rgb(20 27 36 / 0.6)' }} />
              {colored.length > 1 && <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8b96a3', paddingTop: 6 }} />}
              {(zeroLine || hasNeg) && <ReferenceLine y={0} stroke="#5c6775" />}
              {colored.map((s) =>
                s.type === 'line' ? (
                  <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '4 3' : undefined} dot={{ r: 2.5, strokeWidth: 0, fill: s.color }} activeDot={{ r: 4.5, stroke: '#0e131a', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                ) : (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} stackId={s.stack} radius={s.stack ? [0, 0, 0, 0] : [3, 3, 0, 0]} maxBarSize={38} isAnimationActive={false} stroke={s.stack ? '#0e131a' : undefined} strokeWidth={s.stack ? 1 : 0}>
                    {signColor && colored.length === 1 && data.map((d, i) => <Cell key={i} fill={(d[s.key] as number) < 0 ? '#e66767' : s.color} />)}
                  </Bar>
                ),
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ maxHeight: height + 40 }}>
          <table className="tbl">
            <thead><tr><th>Period</th>{colored.map((s) => <th key={s.key} className="n">{s.name}</th>)}</tr></thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}><td>{String(d[xKey])}</td>{colored.map((s) => <td key={s.key} className="n">{fmtValue(d[s.key] as number | null, format)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {note && <p className={cn('mt-2 text-[11px] leading-4 text-faint')}>{note}</p>}
    </div>
  );
}
