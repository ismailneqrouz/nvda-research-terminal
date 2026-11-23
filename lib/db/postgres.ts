import type { Pool as PgPool } from 'pg';
import { LineItemSchema, NewsItemSchema, QuarterSchema, type LineItem, type NewsItem, type Quarter } from '../data/schema';

/** Lazily-created connection pool (server-only). */
let pool: PgPool | null = null;
export async function getPool(connectionString = process.env.DATABASE_URL): Promise<PgPool> {
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
export async function closePool() {
  if (pool) await pool.end();
  pool = null;
}

const num = (x: unknown) => (x == null ? null : Number(x));

export async function loadLines(db: PgPool): Promise<LineItem[]> {
  const items = await db.query(`SELECT id, label, statement, unit, status, level, emphasis, note FROM line_items ORDER BY sort_order`);
  const values = await db.query(`SELECT line_id, period_key, value FROM line_values`);
  const byLine = new Map<string, Record<string, number | null>>();
  for (const r of values.rows) {
    const m = byLine.get(r.line_id) ?? {};
    m[r.period_key] = num(r.value);
    byLine.set(r.line_id, m);
  }
  return items.rows.map((r) =>
    LineItemSchema.parse({ ...r, note: r.note ?? undefined, values: byLine.get(r.id) ?? {} }),
  );
}

export async function loadQuarters(db: PgPool): Promise<Quarter[]> {
  const res = await db.query(`SELECT * FROM quarters ORDER BY period_end`);
  return res.rows.map((r) =>
    QuarterSchema.parse({
      key: r.key,
      label: r.label,
      end: new Date(r.period_end).toISOString().slice(0, 10),
      revenue: num(r.revenue),
      grossProfit: num(r.gross_profit),
      operatingIncome: num(r.operating_income),
      netIncome: num(r.net_income),
      dilutedEps: num(r.diluted_eps),
      freeCashFlow: num(r.free_cash_flow),
      sourceId: r.source_id,
    }),
  );
}

export async function loadLatestQuote(db: PgPool, ticker = 'NVDA') {
  const res = await db.query(`SELECT price, shares_outstanding, as_of, source_id FROM quotes WHERE ticker=$1 ORDER BY as_of DESC LIMIT 1`, [ticker]);
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return { price: Number(r.price), sharesOutstanding: Number(r.shares_outstanding), asOf: new Date(r.as_of).toISOString(), sourceId: r.source_id as string };
}

export async function loadNews(db: PgPool): Promise<NewsItem[]> {
  const res = await db.query(
    `SELECT n.*, COALESCE(array_agg(s.source_id) FILTER (WHERE s.source_id IS NOT NULL), '{}') AS source_ids
       FROM news_items n LEFT JOIN news_sources s ON s.news_id = n.id
      GROUP BY n.id ORDER BY n.date DESC`,
  );
  return res.rows.map((r) =>
    NewsItemSchema.parse({
      id: r.id,
      date: new Date(r.date).toISOString().slice(0, 10),
      category: r.category,
      headline: r.headline,
      summary: r.summary,
      relevance: r.relevance,
      financialImpact: r.financial_impact,
      thesisImpact: r.thesis_impact,
      confirmed: r.confirmed,
      sourceIds: r.source_ids,
    }),
  );
}
