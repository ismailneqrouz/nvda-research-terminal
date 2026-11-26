'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Expand, LayoutList, Presentation, Table2, X } from 'lucide-react';
import { Segmented } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/format';
import type { Window } from '@/lib/finance/risk-report';
import { buildModel, type Settings } from './model';
import { SLIDES } from './slides';
import { TeachingSheet } from './sheet';
import type { PresentData } from './types';
import { dePct } from './fmt';

/** Full-screen teaching presentation: slides + spreadsheet, keyboard-navigable. Slide index is kept in the URL hash (#folie-3). */
export function PresentationDeck({ data }: { data: PresentData }) {
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<'slides' | 'sheet'>('slides');
  const [menu, setMenu] = useState(false);
  const [s, setS] = useState<Settings>({ window: '3Y', rfMode: 'hist', rfFixed: 0.0405, price: data.price, shares: data.shares });
  const m = useMemo(() => buildModel(data, s), [data, s]);
  const slide = SLIDES[i];

  const go = useCallback((n: number) => setI(Math.max(0, Math.min(SLIDES.length - 1, n))), []);

  useEffect(() => {
    const fromHash = () => {
      const h = /^#folie-(\d+)$/.exec(window.location.hash);
      if (h) go(Number(h[1]) - 1);
      if (window.location.hash === '#tabelle') setMode('sheet');
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [go]);

  useEffect(() => {
    const h = mode === 'sheet' ? '#tabelle' : `#folie-${i + 1}`;
    try { history.replaceState(null, '', h); } catch { /* sandboxed frames may refuse */ }
  }, [i, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && mode === 'slides')) { e.preventDefault(); setMode('slides'); go(i + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setMode('slides'); go(i - 1); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(SLIDES.length - 1);
      else if (e.key.toLowerCase() === 't') setMode((x) => (x === 'sheet' ? 'slides' : 'sheet'));
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      else if (e.key === 'Escape' && !document.fullscreenElement) window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, mode, go]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-bg">
      {/* header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[12.5px] text-muted hover:text-ink" aria-label="Präsentation beenden">
          <X className="h-4 w-4" /> <span className="hidden sm:inline">Beenden</span>
        </Link>
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-up" />
          <span className="text-[13px] font-semibold">NVIDIA · Präsentationsmodus</span>
          <span className="hidden text-[11.5px] text-faint md:inline">Daten: {data.asOfLabel}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented ariaLabel="Ansicht" value={mode} onChange={setMode} options={[{ value: 'slides', label: 'Folien' }, { value: 'sheet', label: 'Tabellenblatt' }]} />
          <Segmented ariaLabel="Zeitraum für Risikokennzahlen" value={s.window} onChange={(w: Window) => setS((x) => ({ ...x, window: w }))} options={[{ value: '1Y', label: '1 J.' }, { value: '3Y', label: '3 J.' }, { value: '5Y', label: '5 J.' }]} />
          <div className="flex items-center gap-2 rounded border border-line bg-panel px-2 py-1">
            <select
              value={s.rfMode}
              onChange={(e) => setS((x) => ({ ...x, rfMode: e.target.value as Settings['rfMode'] }))}
              aria-label="Risikoloser Zins"
              className="bg-transparent text-[11.5px] text-muted focus:outline-none"
            >
              <option value="hist">rf: T-Bill historisch</option>
              <option value="fixed">rf: fester Satz</option>
            </select>
            {s.rfMode === 'fixed' && (
              <div className="flex w-36 items-center gap-2">
                <Slider aria-label="Fester risikoloser Zins" min={0} max={0.08} step={0.0025} value={[s.rfFixed]} onValueChange={(v) => setS((x) => ({ ...x, rfFixed: v[0] }))} />
                <span className="num w-12 text-right text-[11.5px]">{dePct(s.rfFixed, 2)}</span>
              </div>
            )}
          </div>
          <button onClick={toggleFullscreen} className="rounded border border-line p-1.5 text-muted hover:text-ink" aria-label="Vollbild"><Expand className="h-3.5 w-3.5" /></button>
        </div>
      </header>

      {/* progress */}
      <div className="h-0.5 w-full bg-line"><div className="h-0.5 bg-up transition-all" style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} /></div>

      {/* body */}
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        {mode === 'slides' ? (
          <div key={slide.id} className="mx-auto max-w-[1280px] px-5 py-6 sm:px-10 sm:py-10">
            <div className="mb-1 flex items-center gap-2 text-[12px] uppercase tracking-wider text-up">
              <span className="num">{String(i + 1).padStart(2, '0')} / {SLIDES.length}</span>
              <span className="text-faint">·</span>
              <span>{slide.chapter}</span>
              {slide.usesRisk && <span className="ml-2 rounded border border-line px-1.5 py-px text-[10px] normal-case tracking-normal text-muted">Monatsdaten {m.risk.from} – {m.risk.to} · {s.rfMode === 'hist' ? 'rf = T-Bill je Monat' : `rf = ${dePct(s.rfFixed, 2)}`}</span>}
            </div>
            <h1 className="mb-8 text-[26px] font-semibold leading-tight tracking-tight sm:text-[34px]">{slide.title}</h1>
            {slide.render(data, m)}
          </div>
        ) : (
          <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8">
            <h1 className="mb-1 text-[22px] font-semibold tracking-tight">Tabellenblatt: jede Zahl mit ihrer Formel</h1>
            <p className="mb-4 max-w-3xl text-[13px] leading-6 text-muted">Wie in Excel: Klicke auf eine Zelle, um oben ihre Formel zu sehen. Gelbe Zellen sind Eingaben — ändere z. B. den Aktienkurs oder den risikolosen Zins, und alle Kennzahlen (auch in den Folien) rechnen neu. „Als Tabelle kopieren“ fügt das Blatt direkt in Excel oder Google Sheets ein.</p>
            <TeachingSheet d={data} m={m} setS={setS} />
          </div>
        )}
      </main>

      {/* footer nav */}
      {mode === 'slides' && (
        <footer className="relative flex items-center gap-3 border-t border-line px-4 py-2.5 sm:px-6">
          <button onClick={() => go(i - 1)} disabled={i === 0} className="inline-flex h-9 items-center gap-1 rounded border border-line px-3 text-[12.5px] disabled:opacity-40" aria-label="Vorherige Folie"><ChevronLeft className="h-4 w-4" /> Zurück</button>
          <button onClick={() => setMenu((x) => !x)} className="inline-flex h-9 items-center gap-1.5 rounded px-2 text-[12.5px] text-muted hover:text-ink" aria-expanded={menu}><LayoutList className="h-4 w-4" /> Kapitel</button>
          <div className="hidden flex-1 items-center justify-center gap-1.5 md:flex">
            {SLIDES.map((x, k) => (
              <button key={x.id} onClick={() => go(k)} title={x.title} aria-label={`Folie ${k + 1}: ${x.title}`} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-up' : 'w-1.5 bg-line hover:bg-faint')} />
            ))}
          </div>
          <button onClick={() => setMode('sheet')} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded px-2 text-[12.5px] text-muted hover:text-ink md:ml-0"><Table2 className="h-4 w-4" /> Tabelle</button>
          <button onClick={() => go(i + 1)} disabled={i === SLIDES.length - 1} className="inline-flex h-9 items-center gap-1 rounded border border-up/50 bg-up/15 px-3 text-[12.5px] text-up disabled:opacity-40" aria-label="Nächste Folie">Weiter <ChevronRight className="h-4 w-4" /></button>
          {menu && (
            <div className="absolute bottom-14 left-4 z-10 w-80 rounded-md border border-line bg-raised p-1.5 shadow-2xl">
              {SLIDES.map((x, k) => (
                <button key={x.id} onClick={() => { go(k); setMenu(false); }} className={cn('flex w-full items-center gap-3 rounded px-2.5 py-1.5 text-left text-[12.5px] hover:bg-panel', k === i && 'text-up')}>
                  <span className="num w-5 text-faint">{k + 1}</span>{x.title}
                </button>
              ))}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}

function toggleFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  } catch {
    /* fullscreen not allowed in this frame */
  }
}
