-- NVIDIA Research Terminal — persistent data model (PostgreSQL 14+)
-- Time-series financial data, market data and news live here; editorial
-- analysis (risk register, scenarios, narrative) is versioned in code.

CREATE TABLE IF NOT EXISTS sources (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  publisher   TEXT NOT NULL,
  url         TEXT NOT NULL,
  published   DATE,
  accessed    DATE NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('filing','company','government','data-provider','news','research','legal')),
  note        TEXT
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
  key         TEXT NOT NULL,
  scope       TEXT NOT NULL CHECK (scope IN ('flow','balance')),
  label       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('annual','ytd','quarter','instant')),
  period_end  DATE NOT NULL,
  months      SMALLINT,
  source_id   TEXT NOT NULL REFERENCES sources(id),
  sort_order  SMALLINT NOT NULL,
  PRIMARY KEY (key, scope)
);

CREATE TABLE IF NOT EXISTS line_items (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  statement   TEXT NOT NULL CHECK (statement IN ('income','balance','cashflow')),
  unit        TEXT NOT NULL CHECK (unit IN ('usd_m','usd','shares_m')),
  status      TEXT NOT NULL CHECK (status IN ('reported','calculated')),
  level       SMALLINT NOT NULL DEFAULT 1,
  emphasis    BOOLEAN NOT NULL DEFAULT FALSE,
  note        TEXT,
  sort_order  SMALLINT NOT NULL
);

-- NULL value = explicitly unavailable (rendered as "Data unavailable")
CREATE TABLE IF NOT EXISTS line_values (
  line_id     TEXT NOT NULL REFERENCES line_items(id) ON DELETE CASCADE,
  period_key  TEXT NOT NULL,
  value       NUMERIC(20,4),
  PRIMARY KEY (line_id, period_key)
);

CREATE TABLE IF NOT EXISTS quarters (
  key              TEXT PRIMARY KEY,
  label            TEXT NOT NULL,
  period_end       DATE NOT NULL,
  revenue          NUMERIC(20,2) NOT NULL,
  gross_profit     NUMERIC(20,2) NOT NULL,
  operating_income NUMERIC(20,2) NOT NULL,
  net_income       NUMERIC(20,2) NOT NULL,
  diluted_eps      NUMERIC(12,4) NOT NULL,
  free_cash_flow   NUMERIC(20,2) NOT NULL,
  source_id        TEXT NOT NULL REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS quotes (
  ticker              TEXT NOT NULL,
  as_of               TIMESTAMPTZ NOT NULL,
  price               NUMERIC(14,4) NOT NULL,
  shares_outstanding  NUMERIC(20,2) NOT NULL,
  source_id           TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (ticker, as_of)
);

CREATE TABLE IF NOT EXISTS price_history (
  ticker     TEXT NOT NULL,
  date       DATE NOT NULL,
  close      NUMERIC(14,4) NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('year-end','daily')),
  source_id  TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (ticker, date)
);

CREATE TABLE IF NOT EXISTS news_items (
  id               TEXT PRIMARY KEY,
  date             DATE NOT NULL,
  category         TEXT NOT NULL,
  headline         TEXT NOT NULL,
  summary          TEXT NOT NULL,
  relevance        TEXT NOT NULL,
  financial_impact TEXT NOT NULL,
  thesis_impact    TEXT NOT NULL CHECK (thesis_impact IN ('positive','negative','mixed','neutral')),
  confirmed        BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS news_sources (
  news_id    TEXT NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  source_id  TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (news_id, source_id)
);

-- Month-end adjusted closes for NVDA and the SPY benchmark plus the TB3MS risk-free rate (risk statistics)
CREATE TABLE IF NOT EXISTS monthly_prices (
  month          CHAR(7) PRIMARY KEY,      -- YYYY-MM
  nvda_adj_close NUMERIC(14,4) NOT NULL,
  spy_adj_close  NUMERIC(14,4) NOT NULL,
  rf_annual_pct  NUMERIC(8,4) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_line_values_period ON line_values(period_key);
CREATE INDEX IF NOT EXISTS idx_news_date ON news_items(date DESC);
