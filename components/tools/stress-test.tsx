'use client';
import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/data/status';
import { cn } from '@/lib/format';

export interface StressBase {
  revenue: number; // TTM, $m
  grossMargin: number;
  opex: number; // TTM, $m
  taxRate: number;
  daPct: number;
  capexPct: number;
  owcPct: number; // operating working capital / revenue
  liquid: number; // cash + marketable securities
  debt: number;
  commitments: number;
  dividends: number; // annual, $m
}

interface Shock { rev: number; gm: number; opex: number; rate: number; writeDown: number; buybacks: boolean }
const PRESETS: { key: string; label: string; s: Shock; desc: string }[] = [
  { key: 'none', label: 'Baseline (TTM)', s: { rev: 0, gm: 0, opex: 0, rate: 0, writeDown: 0, buybacks: false }, desc: 'TTM run-rate, no shock.' },
  { key: 'contraction', label: 'Revenue −30%', s: { rev: -0.3, gm: -0.05, opex: 0.05, rate: 0, writeDown: 0.02, buybacks: false }, desc: 'Cyclical downturn similar in shape to FY2023, scaled to today.' },
  { key: 'ai', label: 'AI capex pause', s: { rev: -0.5, gm: -0.1, opex: 0.05, rate: 0, writeDown: 0.05, buybacks: false }, desc: 'Hyperscalers and neoclouds pause; Data Center falls ~55%.' },
  { key: 'rates', label: 'Rates +300bp', s: { rev: -0.1, gm: -0.02, opex: 0, rate: 0.03, writeDown: 0, buybacks: false }, desc: 'Higher funding cost slows customer projects; NVIDIA’s own interest cost rises.' },
  { key: 'supply', label: 'Supply shock', s: { rev: -0.4, gm: -0.08, opex: 0.05, rate: 0, writeDown: 0.03, buybacks: false }, desc: 'Multi-quarter TSMC/CoWoS or HBM disruption.' },
  { key: 'geo', label: 'Geopolitical shock', s: { rev: -0.7, gm: -0.15, opex: 0.05, rate: 0.01, writeDown: 0.1, buybacks: false }, desc: 'Taiwan blockade-type event: supply halted, commitments partly stranded.' },
];

const fmtB = (x: number) => `${x < 0 ? '−' : ''}$${Math.abs(x / 1000).toFixed(1)}B`;

/** Interactive one-year stress test of NVIDIA’s operating model and liquidity. */
export function StressTest({ base, baseCoupon }: { base: StressBase; baseCoupon: number }) {
  const [preset, setPreset] = useState('ai');
  const [s, setS] = useState<Shock>(PRESETS[2].s);
  const r = useMemo(() => {
    const rev = base.revenue * (1 + s.rev);
    const gm = Math.max(0, base.grossMargin + s.gm);
    const gp = rev * gm;
    const opex = base.opex * (1 + s.opex);
    const op = gp - opex;
    const interest = base.debt * (baseCoupon + s.rate);
    const tax = Math.max(0, (op - interest) * base.taxRate);
    const ni = op - interest - tax;
    const wcRelease = (base.revenue - rev) * base.owcPct; // falling revenue releases working capital
    const losses = base.commitments * s.writeDown;
    const fcf = ni + rev * base.daPct - rev * base.capexPct + wcRelease - losses;
    const liquidityEnd = base.liquid + fcf - base.dividends;
    return { rev, gm, op, opMargin: op / rev, interest, coverage: interest > 0 ? op / interest : Infinity, ni, fcf, losses, wcRelease, liquidityEnd, netCashEnd: liquidityEnd - base.debt };
  }, [base, baseCoupon, s]);

  const set = (k: keyof Shock) => (v: number[]) => { setPreset('custom'); setS((x) => ({ ...x, [k]: v[0] })); };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.key} variant={preset === p.key ? 'active' : 'default'} onClick={() => { setPreset(p.key); setS(p.s); }}>{p.label}</Button>
          ))}
        </div>
        <p className="mb-4 text-[12px] text-muted">{PRESETS.find((p) => p.key === preset)?.desc ?? 'Custom combination.'}</p>
        <Control label="Revenue change vs TTM" value={`${(s.rev * 100).toFixed(0)}%`}><Slider aria-label="Revenue change vs TTM" min={-0.9} max={0.2} step={0.05} value={[s.rev]} onValueChange={set('rev')} /></Control>
        <Control label="Gross-margin change" value={`${(s.gm * 100).toFixed(0)} pts`}><Slider aria-label="Gross-margin change" min={-0.3} max={0.05} step={0.01} value={[s.gm]} onValueChange={set('gm')} /></Control>
        <Control label="Operating-expense change" value={`${(s.opex * 100).toFixed(0)}%`}><Slider aria-label="Operating-expense change" min={-0.2} max={0.4} step={0.05} value={[s.opex]} onValueChange={set('opex')} /></Control>
        <Control label="Interest-rate shock on debt" value={`+${(s.rate * 10000).toFixed(0)} bp`}><Slider aria-label="Interest-rate shock on debt" min={0} max={0.06} step={0.005} value={[s.rate]} onValueChange={set('rate')} /></Control>
        <Control label="Loss on supply commitments" value={`${(s.writeDown * 100).toFixed(0)}% of $390B`}><Slider aria-label="Loss on supply commitments" min={0} max={0.3} step={0.01} value={[s.writeDown]} onValueChange={set('writeDown')} /></Control>
        <p className="mt-3 text-[11px] leading-4 text-faint">One-year, static model: buybacks suspended, dividend maintained, working capital released in proportion to the revenue decline. All shocks are <StatusBadge status="assumption" /> inputs, not forecasts.</p>
      </div>
      <div className="grid content-start gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
        <Out label="Revenue" v={fmtB(r.rev)} />
        <Out label="Gross margin" v={`${(r.gm * 100).toFixed(1)}%`} />
        <Out label="Operating income" v={fmtB(r.op)} bad={r.op < 0} />
        <Out label="Operating margin" v={`${(r.opMargin * 100).toFixed(1)}%`} bad={r.opMargin < 0} />
        <Out label="Interest coverage" v={Number.isFinite(r.coverage) ? `${r.coverage.toFixed(1)}×` : '∞'} bad={r.coverage < 3} />
        <Out label="Supply-commitment losses" v={fmtB(-r.losses)} bad={r.losses > 0} />
        <Out label="Free cash flow (1 yr)" v={fmtB(r.fcf)} bad={r.fcf < 0} />
        <Out label="Liquid assets after 1 yr" v={fmtB(r.liquidityEnd)} bad={r.liquidityEnd < base.debt} sub={`vs debt ${fmtB(base.debt)}`} />
        <div className="col-span-full bg-panel px-4 py-3 text-[12px] leading-5">
          <span className={cn('font-medium', r.liquidityEnd < 0 ? 'text-down' : r.netCashEnd < 0 ? 'text-warn' : 'text-up')}>
            {r.liquidityEnd < 0 ? 'Liquidity exhausted within a year under these inputs.' : r.netCashEnd < 0 ? 'Remains liquid but moves to a net-debt position.' : 'Remains net cash after one year.'}
          </span>{' '}
          <span className="text-muted">Working-capital release adds {fmtB(r.wcRelease)} — the counter-cyclical cushion that protected cash flow in FY2023.</span>
        </div>
      </div>
    </div>
  );
}

function Control({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-0.5 flex justify-between text-[12px]"><span className="text-muted">{label}</span><span className="num">{value}</span></div>
      {children}
    </div>
  );
}
function Out({ label, v, bad, sub }: { label: string; v: string; bad?: boolean; sub?: string }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={cn('num text-[18px]', bad ? 'text-down' : 'text-ink')}>{v}</div>
      {sub && <div className="text-[10.5px] text-faint">{sub}</div>}
    </div>
  );
}
