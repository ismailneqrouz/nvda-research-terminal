# NVDA Research Terminal

Institutional-style fundamental analysis platform for **NVIDIA Corporation (NASDAQ: NVDA)**, built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix/shadcn-style primitives, Recharts, Zod and PostgreSQL.

The app ships pre-populated with a source-verified dataset (as of **Nov 22, 2026**: Q3 FY2027 results, Nov 20, 2026 close). No API keys or user input are required.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 82 tests (Postgres integration test runs when TEST_DATABASE_URL is set)
npm run build        # production build (server)
npm run build:static # static export to ./out (no server needed)
```

### Serving from PostgreSQL

```bash
export DATABASE_URL=postgres://user:pass@host:5432/nvda
npm run db:migrate   # applies db/schema.sql
npm run db:seed      # idempotent upsert of the verified dataset
npm run dev          # provider switches to Postgres automatically
TEST_DATABASE_URL=$DATABASE_URL npm test   # round-trip integration test
```

Time-series data (statements, quarters, quotes, price history, news, sources) live in Postgres. Editorial analysis (risk register, scenarios, scores, narrative) is versioned in code under `lib/data/`.

## Architecture

```
app/                     14 routes (React Server Components) + error/loading/not-found states
components/
  ui/                    shadcn-style primitives (Radix popover, tabs, slider, dialog, button)
  layout/                sidebar, top bar (price, filing, freshness), ⌘K global search
  data/                  Metric tiles, status badges, source citations, glossary terms, statement tables
  charts/                Recharts wrappers (single-axis, table view toggle, validated palette)
  tools/                 Interactive DCF, stress test, risk register, scenario explorer, news feed
lib/
  data/                  Zod schemas, sources, financial statements, market data, news, risks, scenarios
  data/provider.ts       Static vs Postgres provider boundary (chosen by DATABASE_URL)
  db/postgres.ts         Postgres loaders
  finance/core.ts        Pure calculation primitives (margins, growth, ROIC, EV, WACC…)
  finance/dcf.ts         DCF engine + sensitivity grids
  finance/metrics.ts     Analytics engine over any data store
db/                      schema.sql, migrate.ts, seed.ts
tests/                   core, DCF, metrics (with provider cross-checks), data integrity, Postgres
```

## Data integrity

* Every figure carries a status: reported · calculated · TTM · consensus · guidance · assumption · market · assessment.
* Every figure links to its source (title, publisher, dates, URL). Register on `/sources`.
* Tests assert that each income statement, balance sheet and cash-flow statement ties out, that segment revenue sums to total revenue, that 9M figures match the quarterly series, and that our valuation multiples agree with an independent provider within 1%.
* Missing values render as **"Data unavailable"** — never estimated.

## Updating the data

Edit `lib/data/financials.ts` (new period column), `lib/data/market.ts` (quote, peers) and `lib/data/news.ts`, run `npm test`, then `npm run db:seed` if using Postgres.

## Notes

* shadcn/ui components were written by hand in the shadcn pattern (the shadcn CLI registry was not reachable from the build environment).
* Not investment advice. The platform separates company quality, valuation and investment suitability and never produces a recommendation.
