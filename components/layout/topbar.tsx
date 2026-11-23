import { COMPANY, DATA_LAST_UPDATED, LATEST_REPORT, QUOTE } from '@/lib/data/market';
import { date, pct, usd } from '@/lib/format';
import { SourceRef } from '@/components/data/source-ref';
import { Freshness } from './freshness';
import { GlobalSearch } from './global-search';

export function TopBar() {
  const down = QUOTE.change < 0;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="flex h-14 items-center gap-4 pl-14 pr-4 lg:pl-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="truncate text-[13.5px] font-semibold">{COMPANY.name}</span>
          <span className="num text-[11px] text-muted">{COMPANY.exchange}: {COMPANY.ticker}</span>
        </div>
        <div className="hidden items-baseline gap-2 sm:flex">
          <span className="num text-[15px] font-medium">{usd(QUOTE.price)}</span>
          <span className={`num text-[12px] ${down ? 'text-down' : 'text-up'}`}>
            {usd(QUOTE.change)} ({pct(QUOTE.changePct, 2, true)})
          </span>
          <SourceRef ids={QUOTE.sourceIds} period={QUOTE.asOfLabel} />
        </div>
        <div className="ml-auto hidden md:block md:w-64 lg:w-72">
          <GlobalSearch />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line/70 px-4 py-1.5 pl-14 text-[10.5px] text-faint lg:pl-6">
        <span className="sm:hidden">NVDA <span className="num text-ink">{usd(QUOTE.price)}</span> <span className={`num ${down ? 'text-down' : 'text-up'}`}>{pct(QUOTE.changePct, 2, true)}</span></span>
        <span>Price: <span className="text-muted">{QUOTE.asOfLabel}</span></span>
        <span>After hours: <span className="num text-muted">{usd(QUOTE.afterHours)}</span></span>
        <span>Latest filing: <span className="text-muted">{LATEST_REPORT.label}, released {date(LATEST_REPORT.filed)}</span></span>
        <span>Dataset updated: <span className="text-muted">{date(DATA_LAST_UPDATED)}</span></span>
        <span className="flex items-center gap-1">Market data age: <span className="text-muted"><Freshness asOf={QUOTE.asOf} label={QUOTE.asOfLabel} /></span></span>
        <span className="md:hidden"><GlobalSearch /></span>
      </div>
    </header>
  );
}
