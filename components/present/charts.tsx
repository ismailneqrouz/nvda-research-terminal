'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { SERIES } from '@/components/charts/palette';
import { dePct, deUsdM, monthLabel } from './fmt';
import type { ReturnRow } from '@/lib/finance/risk-report';

const tip = { background: '#141b24', border: '1px solid #212a36', fontSize: 12, borderRadius: 4 };
const NEG = '#e66767';

export function QuarterBars({ data, height = 220 }: { data: { label: string; revenue: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)} Mrd`} />
        <Tooltip contentStyle={tip} formatter={(v) => [deUsdM(Number(v)), 'Umsatz']} />
        <Bar dataKey="revenue" fill={SERIES[0]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MarginLines({ data, height = 220 }: { data: { label: string; grossMargin: number; operatingMargin: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} width={40} domain={[0.4, 0.8]} tickFormatter={(v) => `${Math.round(v * 100)} %`} />
        <Tooltip contentStyle={tip} formatter={(v, n) => [dePct(Number(v)), n === 'grossMargin' ? 'Bruttomarge' : 'Operative Marge']} />
        <Line dataKey="grossMargin" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
        <Line dataKey="operatingMargin" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Monthly returns as bars, coloured by sign; optional highlight of months below the risk-free rate. */
export function ReturnBars({ rows, mode = 'return', height = 220 }: { rows: ReturnRow[]; mode?: 'return' | 'downside'; height?: number }) {
  const data = rows.map((r) => ({ m: monthLabel(r.month), v: mode === 'return' ? r.nvda : r.excess, neg: mode === 'return' ? r.nvda < 0 : r.excess < 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="12%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={false} minTickGap={16} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${Math.round(v * 100)} %`} />
        <ReferenceLine y={0} stroke="#5c6775" />
        <Tooltip contentStyle={tip} formatter={(v) => [dePct(Number(v)), mode === 'return' ? 'Monatsrendite' : 'Überrendite']} />
        <Bar dataKey="v" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.neg ? NEG : mode === 'downside' ? '#3a4452' : SERIES[0]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Underwater({ series, months, height = 220 }: { series: number[]; months: string[]; height?: number }) {
  const data = series.map((v, i) => ({ m: monthLabel(months[i]), v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={false} minTickGap={20} tick={{ fontSize: 10 }} />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${Math.round(v * 100)} %`} />
        <Tooltip contentStyle={tip} formatter={(v) => [dePct(Number(v)), 'Abstand zum Hoch']} />
        <Area dataKey="v" stroke={NEG} fill={NEG} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BetaScatter({ rows, beta, alphaMonthly, height = 260 }: { rows: ReturnRow[]; beta: number; alphaMonthly: number; height?: number }) {
  const pts = rows.map((r) => ({ x: r.spy, y: r.nvda, m: monthLabel(r.month) }));
  const xs = pts.map((p) => p.x);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const c = meanY - beta * meanX;
  const line = [{ x: lo, y: c + beta * lo }, { x: hi, y: c + beta * hi }];
  void alphaMonthly;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="S&P 500" tickFormatter={(v) => `${Math.round(v * 100)} %`} tickLine={false} label={{ value: 'S&P 500 (SPY) Monatsrendite', position: 'insideBottom', offset: -6, fill: '#8b96a3', fontSize: 10 }} />
        <YAxis type="number" dataKey="y" name="NVDA" width={40} tickFormatter={(v) => `${Math.round(v * 100)} %`} tickLine={false} />
        <ZAxis range={[36, 36]} />
        <ReferenceLine x={0} stroke="#5c6775" />
        <ReferenceLine y={0} stroke="#5c6775" />
        <Tooltip contentStyle={tip} formatter={(v) => dePct(Number(v))} />
        <Scatter data={pts} fill={SERIES[1]} isAnimationActive={false} />
        <Scatter data={line} line={{ stroke: SERIES[2], strokeWidth: 2 }} shape={() => null} isAnimationActive={false} legendType="none" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Histogram({ values, varLine, height = 220 }: { values: number[]; varLine: number; height?: number }) {
  const step = 0.05;
  const lo = Math.floor(Math.min(...values) / step) * step;
  const hi = Math.ceil(Math.max(...values) / step) * step;
  const bins: { b: string; n: number; from: number }[] = [];
  for (let x = lo; x < hi - 1e-9; x += step) {
    const n = values.filter((v) => v >= x && v < x + step).length;
    bins.push({ b: `${Math.round(x * 100)}…${Math.round((x + step) * 100)}`, n, from: x });
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={bins} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="6%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="b" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 9 }} />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={tip} formatter={(v) => [`${v} Monate`, 'Anzahl']} labelFormatter={(l) => `${l} %`} />
        <Bar dataKey="n" isAnimationActive={false} radius={[2, 2, 0, 0]}>
          {bins.map((b, i) => <Cell key={i} fill={b.from < -varLine ? NEG : SERIES[1]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({ data, height = 200, pctFmt = false }: { data: { name: string; v: number | null; me?: boolean }[]; height?: number; pctFmt?: boolean }) {
  const rows = data.filter((d) => d.v != null) as { name: string; v: number; me?: boolean }[];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 30, left: 4, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={56} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tip} formatter={(v) => (pctFmt ? dePct(Number(v)) : `${Number(v).toFixed(1)}×`)} />
        <Bar dataKey="v" isAnimationActive={false} radius={[0, 3, 3, 0]} label={{ position: 'right', fill: '#8b96a3', fontSize: 11, formatter: (v: unknown) => (pctFmt ? dePct(Number(v)) : `${Number(v).toFixed(1)}×`) }}>
          {rows.map((r, i) => <Cell key={i} fill={r.me ? SERIES[0] : '#3a4452'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
