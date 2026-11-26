'use client';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/format';
import { beta, correlation, covariance, mean, stdev } from '@/lib/finance/risk';
import { dePct, deNum, deUsd, deUsdM, deX, monthLabel } from './fmt';
import type { Model, Settings } from './model';
import type { PresentData } from './types';

interface Cell {
  display: string;
  raw?: string | number; // value used for copy-to-clipboard
  formula?: string;
  note?: string;
  input?: { value: number; step: number; onChange: (v: number) => void; suffix?: string; scale?: number };
  strong?: boolean;
  muted?: boolean;
  align?: 'left' | 'right';
}

const COLS = 'ABCDEFGHIJ';

function Grid({ header, rows, selected, onSelect, colWidths }: { header: string[]; rows: Cell[][]; selected: string; onSelect: (ref: string, c: Cell) => void; colWidths?: string[] }) {
  return (
    <div className="overflow-auto rounded border border-line bg-bg" style={{ maxHeight: '62vh' }}>
      <table className="border-collapse text-[12.5px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 w-10 border border-line bg-raised px-1 text-[10.5px] font-normal text-faint" />
            {header.map((_, i) => <th key={i} className="border border-line bg-raised px-2 py-0.5 text-center font-mono text-[10.5px] font-normal text-faint" style={{ minWidth: colWidths?.[i] }}>{COLS[i]}</th>)}
          </tr>
          <tr>
            <th className="sticky left-0 z-20 border border-line bg-raised px-1 text-center font-mono text-[10.5px] font-normal text-faint">1</th>
            {header.map((h, i) => <th key={i} className="border border-line bg-panel px-2 py-1 text-left text-[11px] font-semibold text-muted">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              <td className="sticky left-0 z-10 border border-line bg-raised px-1 text-center font-mono text-[10.5px] text-faint">{ri + 2}</td>
              {r.map((c, ci) => {
                const ref = `${COLS[ci]}${ri + 2}`;
                const isSel = ref === selected;
                return (
                  <td
                    key={ci}
                    onClick={() => onSelect(ref, c)}
                    className={cn(
                      'cursor-cell whitespace-nowrap border border-line/70 px-2 py-1',
                      c.align === 'left' || ci === 0 ? 'text-left' : 'num text-right',
                      c.input && 'bg-warn/10',
                      c.strong && 'bg-up/[0.07] font-semibold text-ink',
                      c.muted && 'text-muted',
                      isSel && 'outline outline-2 -outline-offset-2 outline-up',
                    )}
                  >
                    {c.input ? (
                      <input
                        type="number"
                        step={c.input.step}
                        value={Number((c.input.value * (c.input.scale ?? 1)).toFixed(4))}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) c.input!.onChange(v / (c.input!.scale ?? 1));
                        }}
                        onFocus={() => onSelect(ref, c)}
                        aria-label={`Eingabe ${ref}`}
                        className="num w-24 bg-transparent text-right text-warn focus:outline-none"
                      />
                    ) : (
                      c.display
                    )}
                    {c.input?.suffix && <span className="ml-1 text-[11px] text-warn/70">{c.input.suffix}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TeachingSheet({ d, m, setS }: { d: PresentData; m: Model; setS: (fn: (s: Settings) => Settings) => void }) {
  const [tab, setTab] = useState<'kpi' | 'returns'>('kpi');
  const [sel, setSel] = useState<{ ref: string; cell: Cell } | null>(null);
  const [copied, setCopied] = useState(false);
  const r = m.risk;

  // ── Sheet 1: Kennzahlen ────────────────────────────────────────────────
  const kpiRows: Cell[][] = useMemo(() => {
    const row = (label: string, value: Cell, formula: string, note: string): Cell[] => [
      { display: label, raw: label, align: 'left' },
      { ...value, formula: value.formula ?? formula },
      { display: formula, raw: formula, align: 'left', muted: true },
      { display: note, raw: note, align: 'left', muted: true },
    ];
    const v = (display: string, raw: number, extra: Partial<Cell> = {}): Cell => ({ display, raw, ...extra });
    return [
      row('Aktienkurs (USD)', v(deUsd(m.s.price), m.s.price, { input: { value: m.s.price, step: 0.5, onChange: (x) => setS((s) => ({ ...s, price: x })) } }), 'Eingabe', `Schlusskurs ${d.asOfLabel}. Ändern, um alle Kennzahlen neu zu rechnen.`),
      row('Aktien ausstehend (Mio.)', v(deNum(m.s.shares, 0), m.s.shares, { input: { value: m.s.shares, step: 10, onChange: (x) => setS((s) => ({ ...s, shares: x })) } }), 'Eingabe', 'Laut letztem 10-Q-Deckblatt (24,15 Mrd.).'),
      row('Marktkapitalisierung', v(deUsdM(m.marketCap), m.marketCap, { strong: true }), '=B2*B3', 'Wert aller Aktien.'),
      row('Finanzschulden', v(deUsdM(d.debt), d.debt), 'Bilanz', 'Kurz- + langfristige Anleihen, 25.10.2026.'),
      row('Cash + Wertpapiere', v(deUsdM(d.cash + d.securities), d.cash + d.securities), 'Bilanz', 'Ohne nicht börsennotierte Beteiligungen.'),
      row('Enterprise Value', v(deUsdM(m.ev), m.ev, { strong: true }), '=B4+B5-B6', 'Preis des gesamten Geschäfts.'),
      row('Umsatz TTM', v(deUsdM(d.ttmRevenue), d.ttmRevenue), '=GJ26+9M27-9M26', 'Letzte vier Quartale.'),
      row('Umsatz Vorjahres-TTM', v(deUsdM(d.ttmRevenuePrior), d.ttmRevenuePrior), 'Σ Q4/25–Q3/26', 'Vergleichsbasis.'),
      row('Umsatzwachstum', v(dePct(m.revenueGrowth), m.revenueGrowth, { strong: true }), '=B8/B9-1', ''),
      row('Bruttogewinn TTM', v(deUsdM(d.ttmGrossProfit), d.ttmGrossProfit), 'GuV', ''),
      row('Operatives Ergebnis TTM', v(deUsdM(d.ttmOperatingIncome), d.ttmOperatingIncome), 'GuV', ''),
      row('Nettogewinn TTM', v(deUsdM(d.ttmNetIncome), d.ttmNetIncome), 'GuV', `Inkl. ${deUsdM(d.ttmOtherIncome)} sonstiger Erträge.`),
      row('Bruttomarge', v(dePct(m.grossMargin), m.grossMargin, { strong: true }), '=B11/B8', ''),
      row('Operative Marge', v(dePct(m.operatingMargin), m.operatingMargin, { strong: true }), '=B12/B8', ''),
      row('Nettomarge', v(dePct(m.netMargin), m.netMargin, { strong: true }), '=B13/B8', ''),
      row('Operativer Cashflow TTM', v(deUsdM(d.ttmOcf), d.ttmOcf), 'Kapitalflussrechnung', ''),
      row('Capex TTM', v(deUsdM(d.ttmCapex), d.ttmCapex), 'Kapitalflussrechnung', ''),
      row('Free Cashflow', v(deUsdM(m.fcf), m.fcf, { strong: true }), '=B17-B18', ''),
      row('FCF-Rendite', v(dePct(m.fcfYield), m.fcfYield, { strong: true }), '=B19/B4', 'Vergleich: 10-j. US-Anleihe.'),
      row('EPS verwässert TTM', v(deUsd(d.ttmEps), d.ttmEps), '=GJ26+9M27-9M26', `${deUsd(d.fy26Eps)} + ${deUsd(d.nineM27Eps)} − ${deUsd(d.nineM26Eps)}`),
      row('KGV', v(deX(m.pe), m.pe, { strong: true }), '=B2/B21', ''),
      row('EBITDA TTM', v(deUsdM(m.ebitda), m.ebitda), '=B12+Abschreibungen', `Abschreibungen ${deUsdM(d.ttmDa)}.`),
      row('EV/EBITDA', v(deX(m.evEbitda), m.evEbitda, { strong: true }), '=B7/B23', ''),
      row('Risikoloser Zins (fest)', v(dePct(m.s.rfFixed), m.s.rfFixed, { input: { value: m.s.rfFixed, step: 0.25, scale: 100, suffix: '%', onChange: (x) => setS((s) => ({ ...s, rfFixed: x, rfMode: 'fixed' })) } }), 'Eingabe', m.s.rfMode === 'fixed' ? 'Aktiv: fester Satz für alle Monate.' : 'Inaktiv: es wird der historische T-Bill-Satz je Monat genutzt (Ändern aktiviert festen Satz).'),
      row(`Sharpe (${r.window})`, v(deNum(r.nvda.sharpe, 2), r.nvda.sharpe, { strong: true }), "=Monatsrenditen!H6", 'Details im Blatt „Monatsrenditen“.'),
      row(`Sortino (${r.window})`, v(deNum(r.nvda.sortino, 2), r.nvda.sortino, { strong: true }), "=Monatsrenditen!H9", ''),
      row(`Volatilität p. a. (${r.window})`, v(dePct(r.nvda.volatility), r.nvda.volatility), '=STABW.S(C:C)*WURZEL(12)', ''),
      row(`Beta (${r.window})`, v(deNum(r.beta, 2), r.beta), `=Monatsrenditen!C${r.rows.length + 11}`, 'Kovarianz(NVDA, SPY) ÷ Varianz(SPY).'),
      row(`Max. Drawdown (${r.window})`, v(dePct(r.nvda.maxDrawdown), r.nvda.maxDrawdown), '=MIN(Kurs/MAX(Kurs bis dato)-1)', ''),
      row(`VaR 95 % pro Monat (${r.window})`, v(dePct(-r.nvda.var95), -r.nvda.var95), '=QUANTIL.INKL(C:C;0,05)', ''),
    ];
  }, [d, m, r, setS]);

  // ── Sheet 2: Monatsrenditen ────────────────────────────────────────────
  const retRows: Cell[][] = useMemo(() => {
    const rows = r.rows;
    const n = rows.length;
    const first = 2;
    const last = first + n - 1;
    const body: Cell[][] = rows.map((x, i) => {
      const rr = first + i;
      return [
        { display: monthLabel(x.month), raw: x.month, align: 'left' },
        { display: deNum(x.nvdaPrice, 2), raw: x.nvdaPrice, formula: 'Adj. Close (Yahoo)' },
        { display: dePct(x.nvda, 2), raw: x.nvda, formula: i === 0 ? `=B${rr}/Vormonatskurs-1` : `=B${rr}/B${rr - 1}-1` },
        { display: deNum(x.spyPrice, 2), raw: x.spyPrice, formula: 'Adj. Close SPY' },
        { display: dePct(x.spy, 2), raw: x.spy, formula: i === 0 ? `=D${rr}/Vormonatskurs-1` : `=D${rr}/D${rr - 1}-1` },
        { display: dePct(x.rf, 3), raw: x.rf, formula: m.s.rfMode === 'fixed' ? `=${dePct(m.s.rfFixed, 2)}/12` : `=TB3MS/12 (${x.month})` },
        { display: dePct(x.excess, 2), raw: x.excess, formula: `=C${rr}-F${rr}` },
        { display: deNum(x.downsideSq * 10000, 2), raw: x.downsideSq, formula: `=MIN(G${rr};0)^2 (×10.000 angezeigt)` },
        { display: dePct(x.spyExcess, 2), raw: x.spyExcess, formula: `=E${rr}-F${rr}` },
      ];
    });
    const ex = rows.map((x) => x.excess);
    const mEx = mean(ex);
    const sdEx = stdev(ex);
    const dd = Math.sqrt(rows.reduce((a, x) => a + x.downsideSq, 0) / n);
    const nv = rows.map((x) => x.nvda);
    const sp = rows.map((x) => x.spy);
    const blank = (): Cell => ({ display: '' });
    const stat = (label: string, cVal: string, cF: string, raw: number, strong = false): Cell[] => [
      { display: label, raw: label, align: 'left', strong },
      blank(),
      { display: cVal, raw, formula: cF, strong },
      blank(), blank(), blank(), blank(), blank(), blank(),
    ];
    const R = `${first}:${last}`;
    return [
      ...body,
      [{ display: '' }, blank(), blank(), blank(), blank(), blank(), blank(), blank(), blank()],
      stat('Ø Monatsrendite NVDA', dePct(mean(nv), 2), `=MITTELWERT(C${R.replace(':', ':C')})`, mean(nv)),
      stat('Ø Überrendite (G)', dePct(mEx, 3), `=MITTELWERT(G${R.replace(':', ':G')})`, mEx),
      stat('STABW Überrendite (G)', dePct(sdEx, 3), `=STABW.S(G${R.replace(':', ':G')})`, sdEx),
      stat('Sharpe annualisiert', deNum((mEx / sdEx) * Math.sqrt(12), 2), '=Ø Überrendite/STABW*WURZEL(12)', (mEx / sdEx) * Math.sqrt(12), true),
      stat('Downside-Abw. (Monat)', dePct(dd, 3), `=WURZEL(MITTELWERT(H${R.replace(':', ':H')}))`, dd),
      stat('Sortino annualisiert', deNum((mEx * 12) / (dd * Math.sqrt(12)), 2), '=Ø Überrendite*12/(Downside*WURZEL(12))', (mEx * 12) / (dd * Math.sqrt(12)), true),
      stat('Volatilität p. a.', dePct(stdev(nv) * Math.sqrt(12), 1), `=STABW.S(C${R.replace(':', ':C')})*WURZEL(12)`, stdev(nv) * Math.sqrt(12)),
      stat('Kovarianz NVDA/SPY', deNum(covariance(nv, sp), 5), `=KOVARIANZ.S(C${R.replace(':', ':C')};E${R.replace(':', ':E')})`, covariance(nv, sp)),
      stat('Beta', deNum(beta(nv, sp), 2), '=Kovarianz/VAR.S(E)', beta(nv, sp), true),
      stat('Korrelation', deNum(correlation(nv, sp), 2), `=KORREL(C;E)`, correlation(nv, sp)),
    ];
  }, [r, m.s.rfMode, m.s.rfFixed]);

  const header = tab === 'kpi' ? ['Kennzahl', 'Wert', 'Formel', 'Erklärung'] : ['Monat', 'NVDA Kurs (adj.)', 'NVDA Rendite', 'SPY Kurs (adj.)', 'SPY Rendite', 'rf (Monat)', 'Überrendite', 'Downside² ×10⁴', 'SPY Überrendite'];
  const rows = tab === 'kpi' ? kpiRows : retRows;

  const copyTsv = async () => {
    const tsv = [header.join('\t'), ...rows.map((r) => r.map((c) => (c.input ? c.input.value : c.raw ?? c.display)).join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-line bg-bg px-2 py-1.5 font-mono text-[12px]">
          <span className="w-10 shrink-0 text-center text-faint">{sel?.ref ?? '—'}</span>
          <span className="text-faint">fx</span>
          <span className="truncate text-info">{sel ? sel.cell.formula ?? (sel.cell.input ? 'Eingabewert (änderbar)' : sel.cell.display) : 'Zelle anklicken, um ihre Formel zu sehen'}</span>
        </div>
        <button onClick={copyTsv} className="inline-flex h-8 items-center gap-1.5 rounded border border-line bg-raised px-3 text-[12px] hover:border-faint">
          {copied ? <Check className="h-3.5 w-3.5 text-up" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Kopiert' : 'Als Tabelle kopieren (für Excel)'}
        </button>
      </div>
      <Grid header={header} rows={rows} selected={sel?.ref ?? ''} onSelect={(ref, cell) => setSel({ ref, cell })} colWidths={tab === 'kpi' ? ['210px', '120px', '200px', '320px'] : undefined} />
      <div className="flex items-center gap-0.5 border-t border-line pt-1">
        {(['kpi', 'returns'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSel(null); }} className={cn('rounded-b px-3 py-1 text-[12px]', tab === t ? 'border border-t-0 border-line bg-panel text-ink' : 'text-muted hover:text-ink')}>
            {t === 'kpi' ? 'Kennzahlen' : `Monatsrenditen (${r.window})`}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-faint">Gelb = Eingabezelle · Grün = Ergebnis · Quellen: SEC-Filings, Yahoo Finance (Kurse), FRED (T-Bill)</span>
      </div>
    </div>
  );
}
