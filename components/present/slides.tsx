'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';
import { maxDrawdown } from '@/lib/finance/risk';
import { riskReport, RISK_5Y } from '@/lib/finance/risk-report';
import { BetaScatter, CompareBars, Histogram, MarginLines, QuarterBars, ReturnBars, Underwater } from './charts';
import { dePct, deNum, deUsd, deUsdM, deX, monthLabel } from './fmt';
import { light, type Light, type Model } from './model';
import type { PresentData } from './types';

// ── building blocks ──────────────────────────────────────────────────────
export interface MiniCell { ref: string; label: string; value: string; formula?: string; input?: boolean; strong?: boolean }

function MiniSheet({ cells, title = 'Rechenblatt' }: { cells: MiniCell[]; title?: string }) {
  return (
    <div className="overflow-hidden rounded border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line bg-raised/60 px-3 py-1.5 text-[11px] text-muted">
        <span className="font-medium">{title}</span>
        <span className="font-mono text-faint">fx</span>
      </div>
      <table className="w-full text-[12px]">
        <tbody>
          {cells.map((c) => (
            <tr key={c.ref} className={cn('border-b border-line/50 last:border-0', c.strong && 'bg-up/[0.06]')}>
              <td className="w-10 border-r border-line/60 bg-raised/40 px-2 py-1 text-center font-mono text-[10.5px] text-faint">{c.ref}</td>
              <td className="px-2 py-1 text-muted">{c.label}</td>
              <td className={cn('num whitespace-nowrap px-2 py-1 text-right', c.input && 'bg-warn/10 text-warn', c.strong && 'font-semibold text-ink')}>{c.value}</td>
              <td className="hidden whitespace-nowrap px-2 py-1 font-mono text-[10.5px] text-info/80 md:table-cell">{c.formula ?? (c.input ? 'Eingabe' : '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Explain({ what, how, read, remember }: { what: ReactNode; how: ReactNode; read: ReactNode; remember?: ReactNode }) {
  return (
    <div className="space-y-3">
      <Box n="1" title="Was misst das?">{what}</Box>
      <Box n="2" title="So wird gerechnet">{how}</Box>
      <Box n="3" title="So liest man es">{read}</Box>
      {remember && (
        <div className="rounded border border-up/30 bg-up/[0.06] px-3 py-2 text-[13px] leading-5">
          <span className="mr-1.5 font-semibold text-up">Merksatz:</span>
          <span className="text-ink/90">{remember}</span>
        </div>
      )}
    </div>
  );
}

function Box({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line text-[10.5px] text-muted">{n}</span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</div>
        <div className="mt-0.5 text-[14px] leading-6 text-ink/90">{children}</div>
      </div>
    </div>
  );
}

function Big({ label, value, sub, tone, small }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' | 'warn'; small?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={cn('num whitespace-nowrap font-medium leading-tight tracking-tight', small ? 'text-[26px] sm:text-[30px]' : 'text-[34px] sm:text-[42px]', tone === 'up' && 'text-up', tone === 'down' && 'text-down', tone === 'warn' && 'text-warn')}>{value}</div>
      {sub && <div className="text-[12px] text-faint">{sub}</div>}
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return <div className="my-1.5 overflow-x-auto rounded bg-bg px-3 py-2 font-mono text-[13px] text-info">{children}</div>;
}

function Layout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0 space-y-5">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

const windowLabel = (w: string) => ({ '1Y': '1 Jahr', '3Y': '3 Jahre', '5Y': '5 Jahre' })[w] ?? w;

// ── slides ──────────────────────────────────────────────────────────────
export interface SlideDef { id: string; chapter: string; title: string; usesRisk?: boolean; render: (d: PresentData, m: Model) => ReactNode }

export const SLIDES: SlideDef[] = [
  {
    id: 'start',
    chapter: 'Einstieg',
    title: 'NVIDIA in 13 Kennzahlen verstehen',
    render: (d, m) => (
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <p className="max-w-xl text-[17px] leading-8 text-ink/90">
            Diese Präsentation führt Schritt für Schritt durch die wichtigsten Kennzahlen, mit denen Profis eine Aktie beurteilen —
            von <strong>Umsatz und Marge</strong> über <strong>Bewertung</strong> bis zu <strong>risikobereinigter Rendite</strong> wie Sharpe- und Sortino-Ratio.
            Jede Folie erklärt: <em>Was misst das? Wie rechnet man es? Wie liest man es?</em>
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Big label="Aktienkurs" value={deUsd(m.s.price)} sub={`${dePct(d.changePct, 1, true)} am Tag · ${d.asOfLabel}`} tone={d.changePct < 0 ? 'down' : 'up'} />
            <Big label="Börsenwert" value={deUsdM(m.marketCap)} />
            <Big label="Umsatz (12 Monate)" value={deUsdM(d.ttmRevenue)} sub={`${dePct(m.revenueGrowth, 0, true)} ggü. Vorjahr`} />
          </div>
          <p className="text-[13px] leading-6 text-muted">
            Bedienung: <kbd className="rounded border border-line px-1">←</kbd> <kbd className="rounded border border-line px-1">→</kbd> blättern · <kbd className="rounded border border-line px-1">T</kbd> Tabellenblatt · <kbd className="rounded border border-line px-1">F</kbd> Vollbild · <kbd className="rounded border border-line px-1">Esc</kbd> zurück. Oben rechts lassen sich Zeitraum (1/3/5 Jahre) und risikoloser Zins einstellen — alle Risikokennzahlen rechnen live neu.
          </p>
        </div>
        <ol className="grid content-start gap-1.5 text-[13px]">
          {['Börsenwert & Unternehmenswert', 'Umsatz & Wachstum', 'Margen', 'Free Cashflow & FCF-Rendite', 'KGV & EV/EBITDA', 'Rendite & Volatilität', 'Sharpe-Ratio', 'Sortino-Ratio', 'Max. Drawdown & Calmar', 'Beta, Alpha & Korrelation', 'Value at Risk', 'Bilanz & Liquidität', 'Spickzettel'].map((t, i) => (
            <li key={t} className="flex items-center gap-3 rounded border border-line bg-panel px-3 py-2">
              <span className="num w-5 text-faint">{String(i + 1).padStart(2, '0')}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: 'ev',
    chapter: 'Größe',
    title: 'Börsenwert und Unternehmenswert (EV)',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-2 gap-6">
            <Big label="Marktkapitalisierung" value={deUsdM(m.marketCap)} sub="Kurs × Aktienanzahl" />
            <Big label="Enterprise Value (EV)" value={deUsdM(m.ev)} sub={`Netto-Cash ${deUsdM(m.netCash)}`} />
          </div>
          <MiniSheet cells={[
            { ref: 'B2', label: 'Aktienkurs', value: deUsd(m.s.price), input: true },
            { ref: 'B3', label: 'Aktien (Mio.)', value: deNum(m.s.shares, 0), input: true },
            { ref: 'B4', label: 'Marktkapitalisierung', value: deUsdM(m.marketCap), formula: '=B2*B3', strong: true },
            { ref: 'B5', label: 'Finanzschulden', value: deUsdM(d.debt), formula: 'Bilanz 25.10.26' },
            { ref: 'B6', label: 'Cash + Wertpapiere', value: deUsdM(d.cash + d.securities), formula: 'Bilanz 25.10.26' },
            { ref: 'B7', label: 'Enterprise Value', value: deUsdM(m.ev), formula: '=B4+B5-B6', strong: true },
          ]} />
        </>}
        right={<Explain
          what={<>Die <strong>Marktkapitalisierung</strong> ist der Preis aller Aktien zusammen. Der <strong>Enterprise Value</strong> ist der Preis des ganzen Unternehmens — so, als würde man es komplett kaufen, inklusive seiner Schulden und abzüglich der Kasse, die man mitbekommt.</>}
          how={<Formula>EV = Marktkapitalisierung + Schulden − Cash</Formula>}
          read={<>NVIDIA hat mehr Cash als Schulden (Netto-Cash), deshalb ist der EV <em>kleiner</em> als der Börsenwert. Für Bewertungs-Kennzahlen wie EV/EBITDA nimmt man den EV, weil er unabhängig von der Finanzierung ist.</>}
          remember="Börsenwert = Preis der Aktien. EV = Preis des Geschäfts."
        />}
      />
    ),
  },
  {
    id: 'revenue',
    chapter: 'Wachstum',
    title: 'Umsatz und Umsatzwachstum',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-2 gap-6">
            <Big label="Umsatz letzte 12 Monate (TTM)" value={deUsdM(d.ttmRevenue)} />
            <Big label="Wachstum ggü. Vorjahr" value={dePct(m.revenueGrowth, 0, true)} tone="up" />
          </div>
          <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Quartalsumsatz (Geschäftsjahr endet Ende Januar)</div><QuarterBars data={d.quarters} /></div>
        </>}
        right={<>
          <Explain
            what={<>Der <strong>Umsatz</strong> ist alles, was NVIDIA in einem Zeitraum verkauft. „TTM“ (trailing twelve months) heißt: die letzten vier Quartale — immer aktuell, aber trotzdem ein volles Jahr.</>}
            how={<Formula>TTM = Geschäftsjahr 2026 + 9 Monate GJ27 − 9 Monate GJ26</Formula>}
            read={<>Über 50 % Wachstum ist für ein Unternehmen dieser Größe extrem selten. Wichtig ist nicht nur die Höhe, sondern ob es <em>anhält</em>: Wachstum aus einem Investitionszyklus (KI-Rechenzentren) kann auch abrupt enden.</>}
            remember="Wachstum ist nur so viel wert, wie es dauerhaft ist."
          />
          <div className="mt-4"><MiniSheet cells={[
            { ref: 'B2', label: 'Umsatz GJ2026', value: deUsdM(d.fy26Revenue), formula: '10-K / 8-K' },
            { ref: 'B3', label: '9 Monate GJ2027', value: deUsdM(d.nineM27Revenue), formula: '8-K Q3' },
            { ref: 'B4', label: '9 Monate GJ2026', value: deUsdM(d.nineM26Revenue), formula: '8-K Q3' },
            { ref: 'B5', label: 'Umsatz TTM', value: deUsdM(d.ttmRevenue), formula: '=B2+B3-B4', strong: true },
            { ref: 'B6', label: 'TTM ein Jahr früher', value: deUsdM(d.ttmRevenuePrior), formula: 'Σ 4 Quartale' },
            { ref: 'B7', label: 'Wachstum', value: dePct(m.revenueGrowth, 1, true), formula: '=B5/B6-1', strong: true },
          ]} /></div>
        </>}
      />
    ),
  },
  {
    id: 'margins',
    chapter: 'Profitabilität',
    title: 'Margen: Wie viel vom Umsatz bleibt hängen?',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-3 gap-4">
            <Big label="Bruttomarge" value={dePct(m.grossMargin, 1)} />
            <Big label="Operative Marge" value={dePct(m.operatingMargin, 1)} />
            <Big label="Nettomarge" value={dePct(m.netMargin, 1)} />
          </div>
          <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Brutto- (grün) und operative Marge (blau) je Quartal</div><MarginLines data={d.quarters} /></div>
        </>}
        right={<>
          <Explain
            what={<>Eine <strong>Marge</strong> zeigt, wie viel Cent von jedem Umsatz-Dollar übrig bleiben. <strong>Brutto</strong>: nach Herstellkosten. <strong>Operativ</strong>: zusätzlich nach Forschung und Verwaltung. <strong>Netto</strong>: nach allem, inkl. Steuern und Finanzergebnis.</>}
            how={<Formula>Marge = Gewinngröße ÷ Umsatz</Formula>}
            read={<>Hardware-Firmen kommen typischerweise auf 40–60 % Bruttomarge. NVIDIA liegt bei ~75 % — ein Zeichen von <strong>Preissetzungsmacht</strong>. Achtung: Die Nettomarge ist gerade durch einmalige Buchgewinne auf Beteiligungen ({deUsdM(d.ttmOtherIncome)}) aufgebläht.</>}
            remember="Hohe Marge = Kunden zahlen für etwas, das sie woanders nicht bekommen."
          />
          <div className="mt-4"><MiniSheet cells={[
            { ref: 'B2', label: 'Umsatz TTM', value: deUsdM(d.ttmRevenue) },
            { ref: 'B3', label: 'Bruttogewinn', value: deUsdM(d.ttmGrossProfit) },
            { ref: 'B4', label: 'Operatives Ergebnis', value: deUsdM(d.ttmOperatingIncome) },
            { ref: 'B5', label: 'Nettogewinn', value: deUsdM(d.ttmNetIncome) },
            { ref: 'B6', label: 'Bruttomarge', value: dePct(m.grossMargin), formula: '=B3/B2', strong: true },
            { ref: 'B7', label: 'Operative Marge', value: dePct(m.operatingMargin), formula: '=B4/B2', strong: true },
            { ref: 'B8', label: 'Nettomarge', value: dePct(m.netMargin), formula: '=B5/B2', strong: true },
          ]} /></div>
        </>}
      />
    ),
  },
  {
    id: 'fcf',
    chapter: 'Cash',
    title: 'Free Cashflow und FCF-Rendite',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-3 gap-4">
            <Big label="Free Cashflow (TTM)" value={deUsdM(m.fcf)} />
            <Big label="FCF-Marge" value={dePct(m.fcfMargin, 1)} />
            <Big label="FCF-Rendite" value={dePct(m.fcfYield, 1)} sub={`10-j. US-Anleihe ≈ ${dePct(d.tenYear, 1)}`} />
          </div>
          <MiniSheet cells={[
            { ref: 'B2', label: 'Operativer Cashflow', value: deUsdM(d.ttmOcf), formula: 'Kapitalflussrechnung' },
            { ref: 'B3', label: 'Investitionen (Capex)', value: deUsdM(d.ttmCapex), formula: 'Kapitalflussrechnung' },
            { ref: 'B4', label: 'Free Cashflow', value: deUsdM(m.fcf), formula: '=B2-B3', strong: true },
            { ref: 'B5', label: 'Marktkapitalisierung', value: deUsdM(m.marketCap), formula: '=Kurs*Aktien' },
            { ref: 'B6', label: 'FCF-Rendite', value: dePct(m.fcfYield), formula: '=B4/B5', strong: true },
          ]} />
        </>}
        right={<Explain
          what={<>Der <strong>Free Cashflow (FCF)</strong> ist das Geld, das nach allen nötigen Investitionen wirklich übrig bleibt — für Aktienrückkäufe, Dividenden oder Übernahmen. Gewinne kann man buchhalterisch gestalten, Cash kaum.</>}
          how={<Formula>FCF = operativer Cashflow − Investitionen · FCF-Rendite = FCF ÷ Börsenwert</Formula>}
          read={<>Die FCF-Rendite ist wie ein „Zins“, den das Unternehmen auf deinen Kaufpreis erwirtschaftet. Liegt sie unter der Rendite risikoloser Staatsanleihen, setzt der Markt auf <em>Wachstum</em>. NVIDIA: rund {dePct(m.fcfYield, 1)} vs. ≈{dePct(d.tenYear, 1)} bei 10-jährigen US-Anleihen.</>}
          remember="Gewinn ist eine Meinung, Cash ist eine Tatsache."
        />}
      />
    ),
  },
  {
    id: 'valuation',
    chapter: 'Bewertung',
    title: 'KGV und EV/EBITDA: Ist die Aktie teuer?',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-3 gap-4">
            <Big label="KGV (P/E, TTM)" value={deX(m.pe)} sub={`bereinigt ${deX(m.peExOther)}`} />
            <Big label="EV/EBITDA" value={deX(m.evEbitda)} />
            <Big label="Gewinnrendite" value={dePct(m.earningsYield, 1)} sub="= 1 ÷ KGV" />
          </div>
          <div className="rounded border border-line bg-panel p-3">
            <div className="mb-1 text-[12px] text-muted">KGV im Vergleich (Wettbewerber: Stand {d.peersAsOf})</div>
            <CompareBars data={[{ name: 'NVDA', v: m.pe, me: true }, ...d.peers.map((p) => ({ name: p.ticker, v: p.pe }))]} />
          </div>
        </>}
        right={<>
          <Explain
            what={<>Das <strong>KGV</strong> (Kurs-Gewinn-Verhältnis) sagt: Wie viele Jahresgewinne zahle ich für eine Aktie? <strong>EV/EBITDA</strong> macht das Gleiche auf Ebene des ganzen Unternehmens und vor Abschreibungen.</>}
            how={<Formula>KGV = Kurs ÷ Gewinn je Aktie · EV/EBITDA = EV ÷ (op. Ergebnis + Abschreibungen)</Formula>}
            read={<>Ein KGV von {deNum(m.pe, 1)} ist für ein Unternehmen mit &gt;50 % Wachstum niedrig — der Markt traut den heutigen Gewinnen also nicht über den Weg (Zyklus-Höhepunkt? Governance?). Ein niedriges KGV auf <em>Spitzengewinnen</em> kann eine Falle sein.</>}
            remember="Ein KGV ist nur so gut wie der Gewinn, auf den es sich bezieht."
          />
          <div className="mt-4"><MiniSheet cells={[
            { ref: 'B2', label: 'Kurs', value: deUsd(m.s.price), input: true },
            { ref: 'B3', label: 'EPS verwässert TTM', value: deUsd(d.ttmEps), formula: '=GJ26+9M27-9M26' },
            { ref: 'B4', label: 'KGV', value: deX(m.pe), formula: '=B2/B3', strong: true },
            { ref: 'B5', label: 'EBITDA TTM', value: deUsdM(m.ebitda), formula: '=EBIT+Abschreibungen' },
            { ref: 'B6', label: 'EV/EBITDA', value: deX(m.evEbitda), formula: '=EV/B5', strong: true },
          ]} /></div>
        </>}
      />
    ),
  },
  {
    id: 'returnvol',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Rendite und Volatilität',
    render: (_d, m) => {
      const r = m.risk;
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-3 gap-4">
              <Big label={`Rendite p. a. (${windowLabel(r.window)})`} value={dePct(r.nvda.cagr, 1, true)} sub={`S&P 500: ${dePct(r.spy.cagr, 1, true)}`} tone={r.nvda.cagr >= 0 ? 'up' : 'down'} />
              <Big label="Volatilität p. a." value={dePct(r.nvda.volatility, 0)} sub={`S&P 500: ${dePct(r.spy.volatility, 0)}`} tone="warn" />
              <Big label="Positive Monate" value={dePct(r.nvda.hitRate, 0)} sub={`bester ${dePct(r.nvda.bestMonth, 0, true)} · schlechtester ${dePct(r.nvda.worstMonth, 0)}`} />
            </div>
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Monatsrenditen NVDA ({monthLabel(r.from)} – {monthLabel(r.to)})</div><ReturnBars rows={r.rows} /></div>
          </>}
          right={<Explain
            what={<><strong>Rendite p. a.</strong> (CAGR) ist der durchschnittliche jährliche Zuwachs mit Zinseszins. <strong>Volatilität</strong> misst, wie stark die Renditen schwanken — die Standardabweichung, hochgerechnet aufs Jahr.</>}
            how={<Formula>CAGR = (Endwert ÷ Startwert)^(12/Monate) − 1 · Vola = STABW(Monatsrenditen) × √12</Formula>}
            read={<>Eine Vola von {dePct(r.nvda.volatility, 0)} heißt grob: In zwei von drei Jahren liegt die Rendite innerhalb von ±{dePct(r.nvda.volatility, 0)} um den Durchschnitt. Das ist rund {deNum(r.nvda.volatility / r.spy.volatility, 1)}-mal so schwankungsreich wie der Gesamtmarkt.</>}
            remember="Rendite allein sagt nichts — man muss fragen: für wie viel Schwankung?"
          />}
        />
      );
    },
  },
  {
    id: 'sharpe',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Sharpe-Ratio: Rendite pro Einheit Risiko',
    render: (_d, m) => {
      const r = m.risk;
      const ex = r.rows.map((x) => x.excess);
      const mean = ex.reduce((a, b) => a + b, 0) / ex.length;
      const sd = Math.sqrt(ex.reduce((a, x) => a + (x - mean) ** 2, 0) / (ex.length - 1));
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-2 gap-6">
              <Big label={`Sharpe-Ratio NVDA (${windowLabel(r.window)})`} value={deNum(r.nvda.sharpe, 2)} tone={r.nvda.sharpe >= 1 ? 'up' : r.nvda.sharpe < 0.5 ? 'down' : 'warn'} />
              <Big label="Sharpe-Ratio S&P 500 (SPY)" value={deNum(r.spy.sharpe, 2)} />
            </div>
            <MiniSheet title={`Rechenblatt · ${r.rows.length} Monatsrenditen`} cells={[
              { ref: 'R1', label: 'Ø risikoloser Zins p. a.', value: dePct(r.avgRf, 2), input: m.s.rfMode === 'fixed', formula: m.s.rfMode === 'fixed' ? undefined : '=MITTELWERT(F:F)*12' },
              { ref: 'R2', label: 'Ø Überrendite pro Monat', value: dePct(mean, 2), formula: '=MITTELWERT(G:G)' },
              { ref: 'R3', label: 'Standardabw. Überrendite', value: dePct(sd, 2), formula: '=STABW.S(G:G)' },
              { ref: 'R4', label: 'Sharpe (monatlich)', value: deNum(mean / sd, 3), formula: '=R2/R3' },
              { ref: 'R5', label: 'Sharpe (annualisiert)', value: deNum(r.nvda.sharpe, 2), formula: '=R4*WURZEL(12)', strong: true },
            ]} />
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Überrendite je Monat (NVDA − risikoloser Zins): Der Durchschnitt ist der Zähler, die Streuung der Nenner</div><ReturnBars rows={r.rows} mode="downside" height={180} /></div>
            <p className="text-[12px] text-faint">Spalte G im Tabellenblatt = NVDA-Monatsrendite − risikoloser Monatszins (Taste T).</p>
          </>}
          right={<Explain
            what={<>Die <strong>Sharpe-Ratio</strong> beantwortet: <em>Wie viel Mehrrendite gegenüber einer sicheren Anlage bekomme ich pro Einheit Schwankung?</em> Erfunden von Nobelpreisträger William Sharpe.</>}
            how={<Formula>Sharpe = (Rendite − risikoloser Zins) ÷ Volatilität der Überrendite</Formula>}
            read={<>Faustregel: &lt; 0,5 schwach · 0,5–1 ordentlich · &gt; 1 gut · &gt; 2 sehr gut. NVDA kommt über {windowLabel(r.window)} auf {deNum(r.nvda.sharpe, 2)}, der Gesamtmarkt auf {deNum(r.spy.sharpe, 2)}. {r.window === '1Y' ? 'Im letzten Jahr hat NVIDIA also kaum mehr verdient als Cash — bei hoher Schwankung.' : 'Über längere Zeit wurde das hohe Risiko gut bezahlt.'} Probier oben rechts den Zeitraum aus: Die Sharpe-Ratio hängt stark vom Fenster ab.</>}
            remember="Sharpe misst, ob sich das Zittern gelohnt hat."
          />}
        />
      );
    },
  },
  {
    id: 'sortino',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Sortino-Ratio: nur Abwärtsrisiko zählt',
    render: (_d, m) => {
      const r = m.risk;
      const down = r.rows.filter((x) => x.excess < 0).length;
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-3 gap-4">
              <Big label={`Sortino NVDA (${windowLabel(r.window)})`} value={deNum(r.nvda.sortino, 2)} tone={r.nvda.sortino >= 1.5 ? 'up' : r.nvda.sortino < 0.75 ? 'down' : 'warn'} />
              <Big label="Sortino S&P 500" value={deNum(r.spy.sortino, 2)} />
              <Big label="Downside-Abweichung" value={dePct(r.nvda.downsideDeviation, 1)} sub={`Vola gesamt ${dePct(r.nvda.volatility, 1)}`} />
            </div>
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Überrenditen je Monat — rot = unter dem risikolosen Zins ({down} von {r.rows.length} Monaten)</div><ReturnBars rows={r.rows} mode="downside" /></div>
          </>}
          right={<>
            <Explain
              what={<>Die Sharpe-Ratio bestraft <em>jede</em> Schwankung — auch starke Kursgewinne. Die <strong>Sortino-Ratio</strong> zählt nur die schlechten Monate als Risiko: Monate, in denen die Aktie weniger als der sichere Zins gebracht hat.</>}
              how={<Formula>Sortino = Ø Überrendite × 12 ÷ (√(Σ min(Überrendite,0)² ÷ n) × √12)</Formula>}
              read={<>Ist die Sortino-Ratio deutlich höher als die Sharpe-Ratio ({deNum(r.nvda.sortino, 2)} vs. {deNum(r.nvda.sharpe, 2)}), kommt ein großer Teil der Schwankung von <em>Aufwärtssprüngen</em>. Faustregel: &gt; 1 gut, &gt; 2 sehr gut.</>}
              remember="Sortino fragt: Wie weh tun die schlechten Monate?"
            />
            <div className="mt-4"><MiniSheet cells={[
              { ref: 'R1', label: 'Ø Überrendite pro Monat', value: dePct(r.rows.reduce((a, x) => a + x.excess, 0) / r.rows.length, 2), formula: '=MITTELWERT(G:G)' },
              { ref: 'R2', label: 'Σ Downside² / n', value: deNum(r.rows.reduce((a, x) => a + x.downsideSq, 0) / r.rows.length, 5), formula: '=MITTELWERT(H:H)' },
              { ref: 'R3', label: 'Downside-Abw. p. a.', value: dePct(r.nvda.downsideDeviation, 2), formula: '=WURZEL(R2)*WURZEL(12)' },
              { ref: 'R4', label: 'Sortino', value: deNum(r.nvda.sortino, 2), formula: '=R1*12/R3', strong: true },
            ]} /></div>
          </>}
        />
      );
    },
  },
  {
    id: 'drawdown',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Maximaler Drawdown und Calmar-Ratio',
    render: (d, m) => {
      const r = m.risk;
      const n = r.months + 1;
      const slice = d.monthly.slice(d.monthly.length - n);
      const dd = maxDrawdown(slice.map((x) => x.nvda));
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-3 gap-4">
              <Big label={`Max. Drawdown (${windowLabel(r.window)})`} value={dePct(r.nvda.maxDrawdown, 0)} sub={`${monthLabel(r.nvda.mddPeak)} → ${monthLabel(r.nvda.mddTrough)}`} tone="down" />
              <Big label="Calmar-Ratio" value={r.nvda.calmar == null ? '–' : deNum(r.nvda.calmar, 2)} sub="Rendite p. a. ÷ |Max. DD|" />
              <Big label="Aktuell (Tageskurse)" value={dePct(d.price / d.recordClose - 1, 0)} sub="vom Rekord am 6. Okt 2026" tone="down" />
            </div>
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">„Unter Wasser“: Abstand zum bisherigen Höchststand (Monatsende)</div><Underwater series={dd.series} months={slice.map((x) => x.month)} /></div>
          </>}
          right={<Explain
            what={<>Der <strong>maximale Drawdown</strong> ist der größte Verlust vom Hoch bis zum anschließenden Tief. Er zeigt, was man im schlimmsten Fall hätte aushalten müssen. Die <strong>Calmar-Ratio</strong> setzt die Jahresrendite ins Verhältnis zu diesem Absturz.</>}
            how={<Formula>Drawdown = Kurs ÷ bisheriges Hoch − 1 · Calmar = CAGR ÷ |Max. Drawdown|</Formula>}
            read={<>NVIDIA hat 2021/22 auf Monatsbasis {dePct(RISK_5Y.nvda.maxDrawdown, 0)} verloren ({monthLabel(RISK_5Y.nvda.mddPeak)} → {monthLabel(RISK_5Y.nvda.mddTrough)}) — und sich danach mehr als verzehnfacht. Monatsendkurse glätten Extreme: Auf Tagesbasis lag der Rückgang vom 6. Okt. bis 20. Nov. 2026 bei −47,5 %. Frage dich: Hätte ich das durchgehalten?</>}
            remember="Ein Verlust von 50 % braucht +100 %, um ihn wieder aufzuholen."
          />}
        />
      );
    },
  },
  {
    id: 'beta',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Beta, Korrelation und Alpha',
    render: (d, m) => {
      const r = m.risk;
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Big small label="Beta" value={deNum(r.beta, 2)} sub={r.window === '5Y' ? `Yahoo (5 J.): ${deNum(d.yahooBeta, 2)}` : 'vs. S&P 500'} tone="warn" />
              <Big small label="Korrelation" value={deNum(r.correlation, 2)} sub={`R² ${dePct(r.rSquared, 0)}`} />
              <Big small label="Alpha p. a." value={dePct(r.alpha, 1, true)} tone={r.alpha >= 0 ? 'up' : 'down'} />
              <Big small label="Treynor" value={deNum(r.treynor, 2)} sub={`Info-Ratio ${deNum(r.informationRatio, 2)}`} />
            </div>
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Jeder Punkt = ein Monat. Steigung der gelben Linie = Beta.</div><BetaScatter rows={r.rows} beta={r.beta} alphaMonthly={r.alpha / 12} /></div>
          </>}
          right={<Explain
            what={<><strong>Beta</strong> misst, wie stark die Aktie mit dem Gesamtmarkt mitschwingt. <strong>Alpha</strong> ist die Rendite, die nicht durch dieses Marktrisiko erklärt wird. <strong>Treynor</strong> ist Überrendite pro Einheit Beta; die <strong>Information-Ratio</strong> misst, wie verlässlich die Aktie den Index schlägt.</>}
            how={<Formula>Beta = KOVAR(NVDA; Markt) ÷ VARIANZ(Markt) · Alpha = (Ø ÜR − Beta × Ø ÜR Markt) × 12</Formula>}
            read={<>Beta {deNum(r.beta, 2)} heißt: Fällt der Markt um 10 %, fiel NVIDIA im Schnitt um ~{deNum(r.beta * 10, 0)} %. Unsere 5-Jahres-Berechnung ({deNum(RISK_5Y.beta, 2)}) stimmt mit Yahoo Finance ({deNum(d.yahooBeta, 2)}) überein. Up-Capture {r.upCapture == null ? '–' : dePct(r.upCapture, 0)} / Down-Capture {r.downCapture == null ? '–' : dePct(r.downCapture, 0)}: so viel der Markt-Auf- bzw. Abwärtsbewegung machte NVDA im Schnitt mit.</>}
            remember="Beta = Hebel auf den Markt. Alpha = Können (oder Glück) darüber hinaus."
          />}
        />
      );
    },
  },
  {
    id: 'var',
    chapter: 'Risiko',
    usesRisk: true,
    title: 'Value at Risk: Wie schlecht kann ein Monat werden?',
    render: (_d, m) => {
      const r = m.risk;
      return (
        <Layout
          left={<>
            <div className="grid grid-cols-3 gap-4">
              <Big label="VaR 95 % (historisch)" value={dePct(-r.nvda.var95, 1)} sub="pro Monat" tone="down" />
              <Big label="VaR 95 % (Normalvert.)" value={dePct(-r.nvda.varParam95, 1)} />
              <Big label="CVaR / Expected Shortfall" value={dePct(-r.nvda.cvar95, 1)} sub="Ø der schlimmsten 5 %" tone="down" />
            </div>
            <div className="rounded border border-line bg-panel p-3"><div className="mb-1 text-[12px] text-muted">Verteilung der Monatsrenditen in %, rot = jenseits des VaR</div><Histogram values={r.rows.map((x) => x.nvda)} varLine={r.nvda.var95} /></div>
          </>}
          right={<Explain
            what={<>Der <strong>Value at Risk (VaR)</strong> sagt: <em>In 19 von 20 Monaten war der Verlust nicht größer als X.</em> Der <strong>CVaR</strong> schaut auf den 20. Monat: Wie schlimm war es im Schnitt, wenn es schlimm wurde?</>}
            how={<Formula>VaR 95 % = 5 %-Quantil der Monatsrenditen · CVaR = Ø aller Renditen ≤ VaR</Formula>}
            read={<>Bei 10.000 $ in NVDA hieß das ({r.window}): In einem von 20 Monaten mehr als {deNum(r.nvda.var95 * 10000, 0)} $ Verlust; in diesen schlechten Monaten im Schnitt {deNum(r.nvda.cvar95 * 10000, 0)} $. Bei wenigen Datenpunkten (1 Jahr = 12 Monate) ist der VaR sehr unsicher.</>}
            remember="VaR ist kein Worst Case — er sagt nur, wo die Schmerzzone beginnt."
          />}
        />
      );
    },
  },
  {
    id: 'balance',
    chapter: 'Bilanz',
    title: 'Bilanz und Liquidität',
    render: (d, m) => (
      <Layout
        left={<>
          <div className="grid grid-cols-3 gap-4">
            <Big label="Netto-Cash" value={deUsdM(m.netCash)} tone="up" />
            <Big label="Current Ratio" value={deX(m.currentRatio, 1)} sub="kurzfr. Vermögen ÷ kurzfr. Schulden" />
            <Big label="Eigenkapital" value={deUsdM(d.equity)} />
          </div>
          <MiniSheet cells={[
            { ref: 'B2', label: 'Cash + Wertpapiere', value: deUsdM(m.liquid) },
            { ref: 'B3', label: 'Finanzschulden', value: deUsdM(d.debt) },
            { ref: 'B4', label: 'Netto-Cash', value: deUsdM(m.netCash), formula: '=B2-B3', strong: true },
            { ref: 'B5', label: 'Umlaufvermögen', value: deUsdM(d.currentAssets) },
            { ref: 'B6', label: 'Kurzfristige Verbindlichk.', value: deUsdM(d.currentLiabilities) },
            { ref: 'B7', label: 'Current Ratio', value: deX(m.currentRatio, 2), formula: '=B5/B6', strong: true },
          ]} />
        </>}
        right={<Explain
          what={<>Die <strong>Bilanz</strong> zeigt, was ein Unternehmen besitzt und schuldet. <strong>Netto-Cash</strong> = mehr Geld als Schulden. Die <strong>Current Ratio</strong> zeigt, ob kurzfristige Rechnungen aus kurzfristigem Vermögen bezahlt werden können.</>}
          how={<Formula>Netto-Cash = Cash − Schulden · Current Ratio = Umlaufvermögen ÷ kurzfr. Verbindlichkeiten</Formula>}
          read={<>Über 1,5 gilt als komfortabel — NVIDIA liegt bei {deNum(m.currentRatio, 1)}. Pleiterisiko ist hier kein Thema. Das echte Risiko steht <em>außerhalb</em> der Bilanz: rund 390 Mrd. $ Lieferverpflichtungen und 118 Mrd. $ Garantien.</>}
          remember="Liquidität entscheidet, ob man eine Krise überlebt — nicht, ob man sie vermeidet."
        />}
      />
    ),
  },
  {
    id: 'summary',
    chapter: 'Zusammenfassung',
    usesRisk: true,
    title: 'Spickzettel: Alle Kennzahlen auf einen Blick',
    render: (d, m) => {
      const r = m.risk;
      const rows: { k: string; v: string; rule: string; l: Light }[] = [
        { k: 'Umsatzwachstum (TTM)', v: dePct(m.revenueGrowth, 0, true), rule: '> 15 % stark', l: light(m.revenueGrowth, 0.15, 0.03) },
        { k: 'Bruttomarge', v: dePct(m.grossMargin, 1), rule: '> 60 % stark', l: light(m.grossMargin, 0.6, 0.4) },
        { k: 'Operative Marge', v: dePct(m.operatingMargin, 1), rule: '> 30 % stark', l: light(m.operatingMargin, 0.3, 0.1) },
        { k: 'FCF-Marge', v: dePct(m.fcfMargin, 1), rule: '> 20 % stark', l: light(m.fcfMargin, 0.2, 0.05) },
        { k: 'KGV (TTM)', v: deX(m.pe), rule: '< 20 günstig, > 35 teuer', l: light(m.pe, 20, 35, false) },
        { k: 'EV/EBITDA', v: deX(m.evEbitda), rule: '< 15 günstig, > 25 teuer', l: light(m.evEbitda, 15, 25, false) },
        { k: 'FCF-Rendite', v: dePct(m.fcfYield, 1), rule: '> 5 % günstig, < 2 % teuer', l: light(m.fcfYield, 0.05, 0.02) },
        { k: `Rendite p. a. (${r.window})`, v: dePct(r.nvda.cagr, 1, true), rule: '> Markt gut', l: light(r.nvda.cagr - r.spy.cagr, 0.0, -0.05) },
        { k: `Volatilität (${r.window})`, v: dePct(r.nvda.volatility, 0), rule: '< 20 % ruhig, > 40 % sehr hoch', l: light(r.nvda.volatility, 0.2, 0.4, false) },
        { k: `Sharpe (${r.window})`, v: deNum(r.nvda.sharpe, 2), rule: '> 1 gut, < 0,5 schwach', l: light(r.nvda.sharpe, 1, 0.5) },
        { k: `Sortino (${r.window})`, v: deNum(r.nvda.sortino, 2), rule: '> 1,5 gut, < 0,75 schwach', l: light(r.nvda.sortino, 1.5, 0.75) },
        { k: `Max. Drawdown (${r.window})`, v: dePct(r.nvda.maxDrawdown, 0), rule: '> −20 % gering, < −40 % hoch', l: light(r.nvda.maxDrawdown, -0.2, -0.4) },
        { k: `Beta (${r.window})`, v: deNum(r.beta, 2), rule: '≈1 marktähnlich, > 1,5 sehr hoch', l: light(r.beta, 1.2, 1.6, false) },
        { k: 'VaR 95 % / Monat', v: dePct(-r.nvda.var95, 1), rule: '> −8 % moderat', l: light(-r.nvda.var95, -0.08, -0.15) },
        { k: 'Netto-Cash', v: deUsdM(m.netCash), rule: '> 0 solide', l: light(m.netCash, 0, -1) },
        { k: 'Current Ratio', v: deX(m.currentRatio, 1), rule: '> 1,5 komfortabel', l: light(m.currentRatio, 1.5, 1) },
      ];
      const dot = { gut: 'bg-up', mittel: 'bg-warn', schwach: 'bg-down' } as const;
      const rfo = m.s.rfMode === 'fixed' ? m.s.rfFixed : null;
      const r1 = riskReport('1Y', rfo, d.monthly);
      const r5 = riskReport('5Y', rfo, d.monthly);
      return (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-raised/50 text-left text-[11px] uppercase tracking-wider text-muted"><tr><th className="px-3 py-2">Kennzahl</th><th className="px-3 py-2 text-right">NVDA</th><th className="px-3 py-2">Faustregel</th><th className="px-3 py-2">Einordnung</th></tr></thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.k} className="border-t border-line/60">
                    <td className="px-3 py-1.5">{x.k}</td>
                    <td className="num px-3 py-1.5 text-right">{x.v}</td>
                    <td className="px-3 py-1.5 text-muted">{x.rule}</td>
                    <td className="px-3 py-1.5"><span className="inline-flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', dot[x.l])} />{x.l}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-4 text-[14px] leading-6 text-ink/90">
            <p><strong>Das Geschäft</strong> ist außergewöhnlich: Wachstum, Margen und Cash-Erzeugung sind fast überall „grün“.</p>
            <p><strong>Die Aktie</strong> ist ein Hochrisiko-Wertpapier: Beta über 2, Drawdowns von 40–60 % kommen vor. Die risikobereinigte Rendite hängt stark vom Zeitraum ab: Sharpe {deNum(r1.nvda.sharpe, 2)} über 1 Jahr, aber {deNum(r5.nvda.sharpe, 2)} über 5 Jahre (S&P 500: {deNum(r1.spy.sharpe, 2)} bzw. {deNum(r5.spy.sharpe, 2)}).</p>
            <p><strong>Die Bewertung</strong> wirkt auf heutigen Gewinnen moderat. Unser DCF reicht von {deUsd(d.dcf.bear, 0)} (Bär) über {deUsd(d.dcf.base, 0)} (Basis) bis {deUsd(d.dcf.bull, 0)} (Bulle) — die Spanne ist die eigentliche Aussage.</p>
            <p className="rounded border border-line bg-panel px-3 py-2 text-[12.5px] text-muted">Ampeln sind Faustregeln zum Lernen, keine Anlageempfehlung. Ein gutes Unternehmen ist nicht automatisch eine gute Aktie — und ob sie zu dir passt, hängt von deinem Zeithorizont und deiner Verlusttoleranz ab.</p>
          </div>
        </div>
      );
    },
  },
];
