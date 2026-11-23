'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/data/status';
import { cn } from '@/lib/format';

export interface ScenarioView {
  key: 'bull' | 'base' | 'bear';
  name: string;
  tagline: string;
  narrative: string;
  catalysts: string[];
  invalidation: string[];
  earnings: string;
  fcfNote: string;
  valuationNote: string;
  years: { fy: string; revenue: number; growth: number; margin: number; nopat: number; nopatPerShare: number; fcff: number; fcfMargin: number }[];
  intrinsic: number;
  upside: number;
  annualized3y: number;
  weight: number;
  inputs: { g1: number; g2: number; g3: number; targetMargin: number; wacc: number; tg: number };
}

const P = (x: number, d = 0) => `${x < 0 ? '−' : ''}${Math.abs(x * 100).toFixed(d)}%`;
const B = (x: number) => `$${(x / 1000).toFixed(0)}B`;

export function ScenarioExplorer({ views, price }: { views: ScenarioView[]; price: number }) {
  const [k, setK] = useState<ScenarioView['key']>('base');
  const v = views.find((x) => x.key === k)!;
  return (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        {views.map((x) => <Button key={x.key} variant={k === x.key ? 'active' : 'default'} onClick={() => setK(x.key)}>{x.name}</Button>)}
        <span className="ml-2 text-[12px] text-muted">{v.tagline}</span>
        <Link href={`/valuation?scenario=${v.key}#dcf`} className="ml-auto text-[11.5px] link">Edit in DCF →</Link>
      </div>
      <div className="grid gap-px bg-line sm:grid-cols-4">
        <Cell label="Intrinsic value / share" value={`$${v.intrinsic.toFixed(0)}`} />
        <Cell label="vs current price" value={P(v.upside)} tone={v.upside >= 0 ? 'up' : 'down'} />
        <Cell label="Expected annual return (3y convergence)" value={P(v.annualized3y, 1)} tone={v.annualized3y >= 0 ? 'up' : 'down'} />
        <Cell label="Current price" value={`$${price.toFixed(2)}`} />
      </div>
      <div className="grid gap-6 p-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0">
          <p className="mb-3 text-[13px] leading-6 text-ink/90">{v.narrative}</p>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[560px]">
              <thead><tr><th>Assumption / output <StatusBadge status="assumption" /></th>{v.years.map((y) => <th key={y.fy} className="n">{y.fy}</th>)}</tr></thead>
              <tbody>
                <tr><td className="text-muted">Revenue</td>{v.years.map((y) => <td key={y.fy} className="n">{B(y.revenue)}</td>)}</tr>
                <tr><td className="text-muted">Revenue growth</td>{v.years.map((y) => <td key={y.fy} className={cn('n', y.growth < 0 && 'text-down')}>{P(y.growth)}</td>)}</tr>
                <tr><td className="text-muted">Operating margin</td>{v.years.map((y) => <td key={y.fy} className="n">{P(y.margin)}</td>)}</tr>
                <tr><td className="text-muted">NOPAT (after-tax operating earnings)</td>{v.years.map((y) => <td key={y.fy} className="n">{B(y.nopat)}</td>)}</tr>
                <tr><td className="text-muted">NOPAT per diluted share</td>{v.years.map((y) => <td key={y.fy} className="n">${y.nopatPerShare.toFixed(2)}</td>)}</tr>
                <tr><td className="text-muted">Free cash flow to firm</td>{v.years.map((y) => <td key={y.fy} className="n">{B(y.fcff)}</td>)}</tr>
                <tr><td className="text-muted">FCF margin</td>{v.years.map((y) => <td key={y.fy} className="n">{P(y.fcfMargin)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <dl className="mt-3 grid gap-2 text-[12.5px] leading-5 sm:grid-cols-3">
            <div><dt className="label">Earnings</dt><dd className="text-ink/85">{v.earnings}</dd></div>
            <div><dt className="label">Free cash flow</dt><dd className="text-ink/85">{v.fcfNote}</dd></div>
            <div><dt className="label">Valuation</dt><dd className="text-ink/85">{v.valuationNote} Long-run growth fades from {P(v.inputs.g3)} to {P(v.inputs.tg, 1)}.</dd></div>
          </dl>
          <p className="mt-2 text-[11px] text-faint">NOPAT per share approximates earnings power excluding interest income and investment gains; it is not GAAP EPS.</p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="label mb-1.5">Key catalysts</div>
            <ul className="list-disc space-y-1 pl-4 text-[12.5px] leading-5 text-ink/85">{v.catalysts.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <div className="label mb-1.5 text-down/80">Conditions that invalidate this scenario</div>
            <ul className="list-disc space-y-1 pl-4 text-[12.5px] leading-5 text-ink/85">{v.invalidation.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={cn('num text-[20px]', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>{value}</div>
    </div>
  );
}
