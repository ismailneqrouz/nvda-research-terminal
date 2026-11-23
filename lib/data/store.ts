import type { LineItem, Quarter } from './schema';
import { ALL_LINES, QUARTERS, GUIDANCE } from './financials';
import { CONSENSUS, QUOTE } from './market';

/** Minimal read interface the analytics engine needs. Implemented by the static dataset and by the Postgres provider. */
export interface FinancialStore {
  val(id: string, period: string): number | null;
  lines: LineItem[];
  quarters: Quarter[];
  quote: { price: number; sharesOutstanding: number };
  consensus: { fy2027EpsAvg: number };
  quarterlyDividend: number;
}

export function createStore(args: Omit<FinancialStore, 'val'>): FinancialStore {
  const map = new Map(args.lines.map((l) => [l.id, l]));
  return {
    ...args,
    val(id, period) {
      const l = map.get(id);
      if (!l) throw new Error(`Unknown line item: ${id}`);
      return l.values[period] ?? null;
    },
  };
}

export const STATIC_STORE: FinancialStore = createStore({
  lines: ALL_LINES,
  quarters: QUARTERS,
  quote: { price: QUOTE.price, sharesOutstanding: QUOTE.sharesOutstanding },
  consensus: { fy2027EpsAvg: CONSENSUS.fy2027EpsAvg },
  quarterlyDividend: GUIDANCE.quarterlyDividend,
});
