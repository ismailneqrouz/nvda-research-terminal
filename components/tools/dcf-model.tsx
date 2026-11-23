'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DcfError, perShareOrNull, runDcf, sensitivity, steps, type DcfInputs } from '@/lib/finance/dcf';
import { costOfEquity, marginOfSafety, upside, wacc as waccFn } from '@/lib/finance/core';
import type { Scenario, ScenarioKey } from '@/lib/data/scenarios';
import { Slider } from '@/components/ui/slider';
import { Button, Segmented } from '@/components/ui/button';
import { StatusBadge } from '@/components/data/status';
import { Term } from '@/components/data/term';
import { SERIES } from '@/components/charts/palette';
import { cn } from '@/lib/format';

const B = (x: number) => `${x < 0 ? '−' : ''}$${Math.abs(x / 1000).toFixed(1)}B`;
const T = (x: number) => `$${(x / 1e6).toFixed(2)}T`;
const P = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const S = (x: number | null) => (x == null ? 'n/a' : `$${x.toFixed(0)}`);

interface Props {
  scenarios: Record<ScenarioKey, Scenario>;
  price: number;
  marketCap: number;
  baseFiscalYear: number; // fiscal year of baseRevenue (2027)
}

type SliderKey = 'g1' | 'g2' | 'g3' | 'terminalGrowth' | 'startMargin' | 'targetMargin' | 'taxRate' | 'capexPct' | 'daPct' | 'nwcPct' | 'wacc';
const CONTROLS: { key: SliderKey; label: string; min: number; max: number; step: number; term?: string; help: string }[] = [
  { key: 'g1', label: 'Revenue growth — FY2028', min: -0.4, max: 1, step: 0.01, help: 'Management indicated ≈75% on the Q3 call. FY2028 consensus: Data unavailable.' },
  { key: 'g2', label: 'Revenue growth — FY2029–30', min: -0.4, max: 0.6, step: 0.01, help: 'Per year.' },
  { key: 'g3', label: 'Revenue growth — FY2031–32', min: -0.3, max: 0.4, step: 0.01, help: 'Per year; then fades linearly to terminal growth by year 10.' },
  { key: 'terminalGrowth', label: 'Terminal growth', min: 0, max: 0.05, step: 0.0025, term: 'terminal-growth', help: 'Must stay below WACC and long-run nominal GDP.' },
  { key: 'startMargin', label: 'Operating margin — FY2028', min: 0.2, max: 0.75, step: 0.01, term: 'operating-margin', help: 'Q4 FY27 guide implies ≈63%; TTM 66%.' },
  { key: 'targetMargin', label: 'Operating margin — steady state', min: 0.15, max: 0.75, step: 0.01, help: 'Reached after 5 years, then held.' },
  { key: 'taxRate', label: 'Tax rate', min: 0.1, max: 0.3, step: 0.005, help: 'FY27 GAAP guide 16–18%.' },
  { key: 'daPct', label: 'D&A / revenue', min: 0, max: 0.05, step: 0.001, help: 'TTM ≈1.2%.' },
  { key: 'capexPct', label: 'Capex / revenue', min: 0, max: 0.08, step: 0.001, help: 'TTM ≈2.8%.' },
  { key: 'nwcPct', label: 'ΔNWC / Δrevenue', min: 0, max: 0.4, step: 0.01, help: 'Operating working capital ≈19% of TTM revenue.' },
  { key: 'wacc', label: 'WACC', min: 0.06, max: 0.16, step: 0.0025, term: 'wacc', help: 'See the WACC builder.' },
];

export function DcfModel({ scenarios, price, marketCap, baseFiscalYear }: Props) {
  const sp = useSearchParams();
  const initial = (sp.get('scenario') as ScenarioKey) || 'base';
  const [scenario, setScenario] = useState<ScenarioKey | 'custom'>(scenarios[initial as ScenarioKey] ? initial : 'base');
  const [inp, setInp] = useState<DcfInputs>(scenarios[(scenarios[initial as ScenarioKey] ? initial : 'base') as ScenarioKey].inputs);
  const [includePrivate, setIncludePrivate] = useState(true);
  const [wb, setWb] = useState({ rf: 0.05, beta: 1.5, erp: 0.045, kd: 0.05 });
  const [tab, setTab] = useState<'proj' | 'sens' | 'scen'>('proj');

  useEffect(() => {
    const k = sp.get('scenario') as ScenarioKey | null;
    if (k && scenarios[k]) { setScenario(k); setInp(scenarios[k].inputs); }
  }, [sp, scenarios]);

  const effective: DcfInputs = { ...inp, nonOperatingAssets: includePrivate ? inp.nonOperatingAssets : 0 };
  const result = useMemo(() => {
    try { return { ok: true as const, r: runDcf(effective) }; } catch (e) { return { ok: false as const, msg: e instanceof DcfError ? e.message : 'Invalid inputs' }; }
  }, [effective]);

  const ke = costOfEquity(wb.rf, wb.beta, wb.erp);
  const builtWacc = waccFn({ equityValue: marketCap, debtValue: inp.debt, costOfEquity: ke, preTaxCostOfDebt: wb.kd, taxRate: inp.taxRate });

  const sensWg = useMemo(() => sensitivity(effective, 'wacc', steps(effective.wacc, 0.01, 2), 'terminalGrowth', steps(effective.terminalGrowth, 0.005, 2), { row: 'WACC', col: 'Terminal growth' }), [effective]);
  const sensGm = useMemo(() => sensitivity(effective, 'g1', steps(effective.g1, 0.15, 2), 'targetMargin', steps(effective.targetMargin, 0.05, 2), { row: 'FY2028 growth', col: 'Steady-state margin' }), [effective]);

  // Reverse DCF: steady-state margin that equates value to price (others held).
  const implied = useMemo(() => {
    let lo = 0.0, hi = 0.9;
    const f = (m: number) => (perShareOrNull({ ...effective, targetMargin: m }) ?? NaN) - price;
    if (!(f(lo) < 0 && f(hi) > 0)) return null;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }, [effective, price]);

  const update = (k: SliderKey) => (v: number[]) => { setScenario('custom'); setInp((x) => ({ ...x, [k]: v[0] })); };
  const pick = (k: ScenarioKey) => { setScenario(k); setInp(scenarios[k].inputs); };

  const r = result.ok ? result.r : null;
  const up = r ? upside(r.perShare, price) : null;
  const mos = r ? marginOfSafety(r.perShare, price) : null;
  const chart = r?.years.map((y) => ({ label: `FY${baseFiscalYear + y.year}`, fcff: y.fcff, pv: y.pv })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label mr-1">Scenario</span>
        {(['bear', 'base', 'bull'] as ScenarioKey[]).map((k) => (
          <Button key={k} variant={scenario === k ? 'active' : 'default'} onClick={() => pick(k)}>{scenarios[k].name}</Button>
        ))}
        {scenario === 'custom' && <span className="rounded border border-[#c79bf2]/40 px-2 py-1 text-[11px] text-[#c79bf2]">Custom assumptions</span>}
        <label className="ml-auto flex items-center gap-2 text-[12px] text-muted">
          <input type="checkbox" checked={includePrivate} onChange={(e) => setIncludePrivate(e.target.checked)} className="accent-[#199e70]" />
          Include non-marketable investments ({B(inp.nonOperatingAssets)}) at carrying value
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        {/* Assumptions */}
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="h-section">Model assumptions</h3><StatusBadge status="assumption" /></div>
          {CONTROLS.map((c) => (
            <div key={c.key} className="mb-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted">{c.term ? <Term id={c.term}>{c.label}</Term> : c.label}</span>
                <span className="num text-ink">{P(inp[c.key] as number, c.step < 0.01 ? 2 : 0)}</span>
              </div>
              <Slider min={c.min} max={c.max} step={c.step} value={[inp[c.key] as number]} onValueChange={update(c.key)} aria-label={c.label} />
              <div className="text-[10.5px] text-faint">{c.help}</div>
            </div>
          ))}
          <div className="mt-4 rounded border border-line bg-bg p-3">
            <div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-medium">WACC builder (CAPM)</span><Button size="sm" onClick={() => { setScenario('custom'); setInp((x) => ({ ...x, wacc: Math.round(builtWacc * 400) / 400 })); }}>Apply {P(builtWacc)}</Button></div>
            {([['rf', 'Risk-free (10Y UST ≈5.1%)', 0.02, 0.07, 0.0025], ['beta', 'Beta (5Y raw 2.25)', 0.8, 2.5, 0.05], ['erp', 'Equity risk premium', 0.03, 0.07, 0.0025], ['kd', 'Pre-tax cost of debt', 0.03, 0.08, 0.0025]] as const).map(([k, l, mn, mx, st]) => (
              <div key={k} className="mb-2">
                <div className="flex justify-between text-[11.5px]"><span className="text-muted">{l}</span><span className="num">{k === 'beta' ? wb.beta.toFixed(2) : P(wb[k], 2)}</span></div>
                <Slider min={mn} max={mx} step={st} value={[wb[k]]} onValueChange={(v) => setWb((x) => ({ ...x, [k]: v[0] }))} aria-label={l} />
              </div>
            ))}
            <div className="text-[11px] text-faint">Cost of equity {P(ke)} · market-value weights (debt {P(inp.debt / (marketCap + inp.debt))})</div>
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-4 min-w-0">
          {!result.ok && <div className="rounded border border-down/40 bg-down/10 px-4 py-3 text-[12.5px] text-down">Model error: {result.msg}</div>}
          {r && (
            <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
              <Out label="Current price" v={`$${price.toFixed(2)}`} badge="market" />
              <Out label="Intrinsic value / share" v={`$${r.perShare.toFixed(2)}`} badge="calculated" strong />
              <Out label="Upside / downside" v={P(up!, 0)} tone={up! >= 0 ? 'up' : 'down'} badge="calculated" />
              <Out label={<Term id="margin-of-safety">Margin of safety</Term>} v={P(mos ?? 0, 0)} tone={(mos ?? 0) >= 0 ? 'up' : 'down'} badge="calculated" />
              <Out label="Enterprise value" v={T(r.enterpriseValue)} badge="calculated" />
              <Out label="Terminal value share of EV" v={P(r.terminalShareOfEv, 0)} badge="calculated" />
            </div>
          )}
          {r && (
            <div className="panel p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="h-section">Equity bridge</h3>
                <span className="text-[11px] text-faint">Implied exit EV/EBIT at year 10: {r.impliedExitEvEbit.toFixed(1)}× · {implied != null ? <>Market-implied steady-state margin (all else equal): <span className="num text-ink">{P(implied)}</span></> : 'Market-implied margin: outside 0–90% range'}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ['PV of FCFF (10y)', B(r.sumPv)], ['PV of terminal value', B(r.pvTerminal)], ['+ Cash & liquid securities', B(effective.cash)],
                  ['+ Non-marketable investments', B(effective.nonOperatingAssets)], ['− Debt', B(-effective.debt)], ['= Equity value', T(r.equityValue)],
                  ['÷ Diluted shares', `${(effective.dilutedShares / 1000).toFixed(2)}B`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col border-l border-line pl-2"><span className="text-[11px] text-muted">{k}</span><span className="num">{v}</span></div>
                ))}
              </div>
            </div>
          )}

          <div className="panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <Segmented ariaLabel="DCF view" value={tab} onChange={setTab} options={[{ value: 'proj', label: 'Projections' }, { value: 'sens', label: 'Sensitivity' }, { value: 'scen', label: 'Bull / base / bear' }]} />
              <span className="text-[11px] text-faint">USD; fiscal years ending late January; mid-year discounting</span>
            </div>
            <div className="p-4">
              {tab === 'proj' && r && (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'rgb(33 42 54)' }} />
                        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`} />
                        <Tooltip formatter={(v) => B(Number(v))} contentStyle={{ background: '#141b24', border: '1px solid #212a36', fontSize: 12 }} />
                        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="fcff" name="Free cash flow to firm" fill={SERIES[0]} radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
                        <Bar dataKey="pv" name="Present value" fill={SERIES[1]} radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="tbl min-w-[900px]">
                      <thead><tr><th>$ billions</th><th className="n text-faint">FY{baseFiscalYear}E</th>{r.years.map((y) => <th key={y.year} className="n">FY{baseFiscalYear + y.year}</th>)}<th className="n">Terminal</th></tr></thead>
                      <tbody>
                        <PRow label="Revenue" base={effective.baseRevenue} vals={r.years.map((y) => y.revenue)} />
                        <PRow label="Growth" vals={r.years.map((y) => y.growth)} pct />
                        <PRow label="Operating margin" vals={r.years.map((y) => y.margin)} pct />
                        <PRow label="EBIT" vals={r.years.map((y) => y.ebit)} />
                        <PRow label="NOPAT" vals={r.years.map((y) => y.nopat)} />
                        <PRow label="+ D&A" vals={r.years.map((y) => y.da)} />
                        <PRow label="− Capex" vals={r.years.map((y) => -y.capex)} />
                        <PRow label="− Δ Net working capital" vals={r.years.map((y) => -y.deltaNwc)} />
                        <PRow label="= FCFF" vals={r.years.map((y) => y.fcff)} strong extra={B(r.terminalValue)} />
                        <PRow label="Discount factor" vals={r.years.map((y) => y.discountFactor)} raw />
                        <PRow label="Present value" vals={r.years.map((y) => y.pv)} strong extra={B(r.pvTerminal)} />
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[11px] text-faint">FY{baseFiscalYear}E base revenue = 9M FY2027 reported + Q4 guidance midpoint ($130.0B) <StatusBadge status="guidance" />. GAAP operating margin already includes stock-based compensation as a cost.</p>
                </>
              )}
              {tab === 'sens' && (
                <div className="grid gap-6 2xl:grid-cols-2">
                  <SensTable grid={sensWg} rowFmt={(x) => P(x)} colFmt={(x) => P(x)} price={price} centre={[2, 2]} />
                  <SensTable grid={sensGm} rowFmt={(x) => P(x, 0)} colFmt={(x) => P(x, 0)} price={price} centre={[2, 2]} />
                  <p className="text-[11px] text-faint 2xl:col-span-2">Value per share; green = above the current price, red = below. Outlined cell = current assumptions. Cells marked n/a are invalid (WACC ≤ terminal growth).</p>
                </div>
              )}
              {tab === 'scen' && (
                <div className="overflow-x-auto">
                  <table className="tbl min-w-[720px]">
                    <thead><tr><th>Assumption / output</th>{(['bear', 'base', 'bull'] as ScenarioKey[]).map((k) => <th key={k} className="n">{scenarios[k].name}</th>)}</tr></thead>
                    <tbody>
                      {([
                        ['FY2028 growth', (i: DcfInputs) => P(i.g1, 0)], ['FY2029–30 growth', (i: DcfInputs) => P(i.g2, 0)], ['FY2031–32 growth', (i: DcfInputs) => P(i.g3, 0)],
                        ['Terminal growth', (i: DcfInputs) => P(i.terminalGrowth)], ['Steady-state op. margin', (i: DcfInputs) => P(i.targetMargin, 0)], ['WACC', (i: DcfInputs) => P(i.wacc)],
                        ['ΔNWC / Δrevenue', (i: DcfInputs) => P(i.nwcPct, 0)],
                      ] as [string, (i: DcfInputs) => string][]).map(([l, f]) => (
                        <tr key={l}><td className="text-muted">{l}</td>{(['bear', 'base', 'bull'] as ScenarioKey[]).map((k) => <td key={k} className="n">{f(scenarios[k].inputs)}</td>)}</tr>
                      ))}
                      {(['FY2032 revenue', 'Intrinsic value / share', 'vs current price'] as const).map((l) => (
                        <tr key={l} className="font-medium">
                          <td>{l}</td>
                          {(['bear', 'base', 'bull'] as ScenarioKey[]).map((k) => {
                            const rr = runDcf({ ...scenarios[k].inputs, nonOperatingAssets: includePrivate ? scenarios[k].inputs.nonOperatingAssets : 0 });
                            const val = l === 'FY2032 revenue' ? B(rr.years[4].revenue) : l === 'Intrinsic value / share' ? `$${rr.perShare.toFixed(0)}` : P(rr.perShare / price - 1, 0);
                            return <td key={k} className={cn('n', l === 'vs current price' && (rr.perShare >= price ? 'text-up' : 'text-down'))}>{val}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <p className="text-[11.5px] leading-5 text-faint">A DCF is only as good as its assumptions. Every output above is a calculated consequence of the labelled assumptions, not an objective measure of what NVIDIA is worth. Small changes in steady-state margin and WACC dominate the result.</p>
        </div>
      </div>
    </div>
  );
}

function Out({ label, v, tone, badge, strong }: { label: React.ReactNode; v: string; tone?: 'up' | 'down'; badge: 'market' | 'calculated'; strong?: boolean }) {
  return (
    <div className="bg-panel px-3.5 py-3">
      <div className="flex items-center justify-between gap-1 text-[11px] text-muted">{label}<StatusBadge status={badge} /></div>
      <div className={cn('num mt-1 text-[19px]', strong && 'text-[22px] font-medium', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>{v}</div>
    </div>
  );
}

function PRow({ label, vals, base, pct, raw, strong, extra }: { label: string; vals: number[]; base?: number; pct?: boolean; raw?: boolean; strong?: boolean; extra?: string }) {
  const f = (x: number) => (pct ? P(x) : raw ? x.toFixed(3) : (x / 1000).toFixed(1));
  return (
    <tr className={strong ? 'font-medium' : ''}>
      <td className={strong ? 'text-ink' : 'text-muted'}>{label}</td>
      <td className="n text-faint">{base != null ? f(base) : ''}</td>
      {vals.map((x, i) => <td key={i} className={cn('n', !pct && !raw && x < 0 && 'text-down/90')}>{f(x)}</td>)}
      <td className="n text-muted">{extra ?? ''}</td>
    </tr>
  );
}

function SensTable({ grid, rowFmt, colFmt, price, centre }: { grid: ReturnType<typeof sensitivity>; rowFmt: (x: number) => string; colFmt: (x: number) => string; price: number; centre: [number, number] }) {
  return (
    <div className="overflow-x-auto">
      <div className="mb-1.5 text-[12px] font-medium">{grid.rowLabel} × {grid.colLabel}</div>
      <table className="tbl">
        <thead><tr><th>{grid.rowLabel} ↓ / {grid.colLabel} →</th>{grid.cols.map((c) => <th key={c} className="n">{colFmt(c)}</th>)}</tr></thead>
        <tbody>
          {grid.rows.map((row, i) => (
            <tr key={row}>
              <td className="num text-muted">{rowFmt(row)}</td>
              {grid.values[i].map((v, j) => (
                <td key={j} className={cn('n', v == null ? 'text-faint' : v >= price ? 'text-up' : 'text-down', i === centre[0] && j === centre[1] && 'outline outline-1 -outline-offset-1 outline-ink/50 font-medium')}>{S(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
