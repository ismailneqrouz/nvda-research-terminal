import 'server-only';
import { cache } from 'react';
import { ALL_LINES, QUARTERS, GUIDANCE } from './financials';
import { CONSENSUS, QUOTE } from './market';
import { NEWS } from './news';
import type { LineItem, NewsItem, Quarter } from './schema';
import { createStore, type FinancialStore } from './store';
import { validateDataset } from './validate';
import { buildAnalytics, type Analytics } from '../finance/metrics';

/**
 * Data-provider boundary. Pages request data through `getResearchData()`;
 * the implementation is chosen by environment:
 *   - DATABASE_URL set  → PostgresProvider (seeded via `npm run db:seed`)
 *   - otherwise         → StaticProvider (bundled, source-verified dataset)
 * Both return identical shapes, validated with Zod.
 */
export interface ResearchData {
  provider: 'static' | 'postgres';
  lines: LineItem[];
  quarters: Quarter[];
  news: NewsItem[];
  quote: { price: number; sharesOutstanding: number; asOf: string };
  store: FinancialStore;
  analytics: Analytics;
}

export interface ResearchDataProvider {
  name: ResearchData['provider'];
  load(): Promise<ResearchData>;
}

function assemble(provider: ResearchData['provider'], lines: LineItem[], quarters: Quarter[], news: NewsItem[], quote: ResearchData['quote']): ResearchData {
  const store = createStore({
    lines,
    quarters,
    quote: { price: quote.price, sharesOutstanding: quote.sharesOutstanding },
    consensus: { fy2027EpsAvg: CONSENSUS.fy2027EpsAvg },
    quarterlyDividend: GUIDANCE.quarterlyDividend,
  });
  return { provider, lines, quarters, news, quote, store, analytics: buildAnalytics(store) };
}

export const StaticProvider: ResearchDataProvider = {
  name: 'static',
  async load() {
    validateDataset();
    return assemble('static', ALL_LINES, QUARTERS, NEWS, { price: QUOTE.price, sharesOutstanding: QUOTE.sharesOutstanding, asOf: QUOTE.asOf });
  },
};

export const PostgresProvider: ResearchDataProvider = {
  name: 'postgres',
  async load() {
    const { getPool, loadLines, loadQuarters, loadNews, loadLatestQuote } = await import('../db/postgres');
    const db = await getPool();
    const [lines, quarters, news, quote] = await Promise.all([loadLines(db), loadQuarters(db), loadNews(db), loadLatestQuote(db)]);
    if (!lines.length) throw new Error('Postgres provider: no line items found — run `npm run db:migrate && npm run db:seed`.');
    if (!quote) throw new Error('Postgres provider: no quote found for NVDA.');
    return assemble('postgres', lines, quarters, news, quote);
  },
};

export function selectProvider(): ResearchDataProvider {
  return process.env.DATABASE_URL ? PostgresProvider : StaticProvider;
}

/** Request-deduplicated loader for React Server Components. */
export const getResearchData = cache(async (): Promise<ResearchData> => selectProvider().load());
