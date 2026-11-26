import { BALANCE_PERIODS, BALANCE_SHEET, CASH_FLOW, FLOW_PERIODS, INCOME_STATEMENT, QUARTERS } from '../lib/data/financials';
import { PRICE_HISTORY, QUOTE } from '../lib/data/market';
import { NEWS } from '../lib/data/news';
import { MONTHLY } from '../lib/data/returns';
import { SOURCES } from '../lib/data/sources';
import { validateDataset } from '../lib/data/validate';
import { closePool, getPool } from '../lib/db/postgres';

/** Idempotent seed of the verified dataset into PostgreSQL (upserts inside one transaction). */
export async function seed(connectionString = process.env.DATABASE_URL) {
  validateDataset();
  const pool = await getPool(connectionString);
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    for (const s of SOURCES) {
      await db.query(
        `INSERT INTO sources (id,title,publisher,url,published,accessed,kind,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, publisher=EXCLUDED.publisher, url=EXCLUDED.url,
           published=EXCLUDED.published, accessed=EXCLUDED.accessed, kind=EXCLUDED.kind, note=EXCLUDED.note`,
        [s.id, s.title, s.publisher, s.url, s.published ?? null, s.accessed, s.kind, s.note ?? null],
      );
    }
    const periods = [
      ...FLOW_PERIODS.map((p, i) => ({ ...p, scope: 'flow', i })),
      ...BALANCE_PERIODS.map((p, i) => ({ ...p, scope: 'balance', i })),
    ];
    for (const p of periods) {
      await db.query(
        `INSERT INTO fiscal_periods (key,scope,label,kind,period_end,months,source_id,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (key,scope) DO UPDATE SET label=EXCLUDED.label, kind=EXCLUDED.kind, period_end=EXCLUDED.period_end,
           months=EXCLUDED.months, source_id=EXCLUDED.source_id, sort_order=EXCLUDED.sort_order`,
        [p.key, p.scope, p.label, p.kind, p.end, p.months ?? null, p.sourceId, p.i],
      );
    }
    const lines = [...INCOME_STATEMENT, ...CASH_FLOW, ...BALANCE_SHEET];
    for (const [i, l] of lines.entries()) {
      await db.query(
        `INSERT INTO line_items (id,label,statement,unit,status,level,emphasis,note,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label, statement=EXCLUDED.statement, unit=EXCLUDED.unit, status=EXCLUDED.status,
           level=EXCLUDED.level, emphasis=EXCLUDED.emphasis, note=EXCLUDED.note, sort_order=EXCLUDED.sort_order`,
        [l.id, l.label, l.statement, l.unit, l.status, l.level, l.emphasis, l.note ?? null, i],
      );
      for (const [k, v] of Object.entries(l.values)) {
        await db.query(
          `INSERT INTO line_values (line_id,period_key,value) VALUES ($1,$2,$3)
           ON CONFLICT (line_id,period_key) DO UPDATE SET value=EXCLUDED.value`,
          [l.id, k, v],
        );
      }
    }
    for (const q of QUARTERS) {
      await db.query(
        `INSERT INTO quarters (key,label,period_end,revenue,gross_profit,operating_income,net_income,diluted_eps,free_cash_flow,source_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, period_end=EXCLUDED.period_end, revenue=EXCLUDED.revenue,
           gross_profit=EXCLUDED.gross_profit, operating_income=EXCLUDED.operating_income, net_income=EXCLUDED.net_income,
           diluted_eps=EXCLUDED.diluted_eps, free_cash_flow=EXCLUDED.free_cash_flow, source_id=EXCLUDED.source_id`,
        [q.key, q.label, q.end, q.revenue, q.grossProfit, q.operatingIncome, q.netIncome, q.dilutedEps, q.freeCashFlow, q.sourceId],
      );
    }
    await db.query(
      `INSERT INTO quotes (ticker,as_of,price,shares_outstanding,source_id) VALUES ('NVDA',$1,$2,$3,$4)
       ON CONFLICT (ticker,as_of) DO UPDATE SET price=EXCLUDED.price, shares_outstanding=EXCLUDED.shares_outstanding`,
      [QUOTE.asOf, QUOTE.price, QUOTE.sharesOutstanding, QUOTE.sourceIds[0]],
    );
    for (const p of PRICE_HISTORY) {
      await db.query(
        `INSERT INTO price_history (ticker,date,close,kind,source_id) VALUES ('NVDA',$1,$2,$3,$4)
         ON CONFLICT (ticker,date) DO UPDATE SET close=EXCLUDED.close, kind=EXCLUDED.kind, source_id=EXCLUDED.source_id`,
        [p.date, p.close, p.kind, p.sourceId],
      );
    }
    for (const n of NEWS) {
      await db.query(
        `INSERT INTO news_items (id,date,category,headline,summary,relevance,financial_impact,thesis_impact,confirmed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET date=EXCLUDED.date, category=EXCLUDED.category, headline=EXCLUDED.headline, summary=EXCLUDED.summary,
           relevance=EXCLUDED.relevance, financial_impact=EXCLUDED.financial_impact, thesis_impact=EXCLUDED.thesis_impact, confirmed=EXCLUDED.confirmed`,
        [n.id, n.date, n.category, n.headline, n.summary, n.relevance, n.financialImpact, n.thesisImpact, n.confirmed],
      );
      for (const s of n.sourceIds) {
        await db.query(`INSERT INTO news_sources (news_id,source_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [n.id, s]);
      }
    }
    for (const m of MONTHLY) {
      await db.query(
        `INSERT INTO monthly_prices (month,nvda_adj_close,spy_adj_close,rf_annual_pct) VALUES ($1,$2,$3,$4)
         ON CONFLICT (month) DO UPDATE SET nvda_adj_close=EXCLUDED.nvda_adj_close, spy_adj_close=EXCLUDED.spy_adj_close, rf_annual_pct=EXCLUDED.rf_annual_pct`,
        [m.month, m.nvda, m.spy, m.rfAnnualPct],
      );
    }
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally {
    db.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => console.log('✓ dataset seeded'))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(closePool);
}
