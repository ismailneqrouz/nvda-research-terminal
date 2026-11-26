import { afterAll, describe, expect, it } from 'vitest';
import { migrate } from '@/db/migrate';
import { seed } from '@/db/seed';
import { closePool } from '@/lib/db/postgres';
import { PostgresProvider, StaticProvider } from '@/lib/data/provider';

/**
 * Integration test against a real PostgreSQL instance.
 * Set TEST_DATABASE_URL to run (e.g. postgres://postgres@localhost:5432/nvda_test).
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('PostgresProvider (integration)', () => {
  afterAll(closePool);

  it('migrates, seeds idempotently and round-trips the dataset', async () => {
    process.env.DATABASE_URL = url;
    await migrate(url);
    await seed(url);
    await seed(url); // idempotent
    const [pg, st] = await Promise.all([PostgresProvider.load(), StaticProvider.load()]);
    expect(pg.provider).toBe('postgres');
    expect(pg.lines.length).toBe(st.lines.length);
    for (const l of st.lines) {
      const p = pg.lines.find((x) => x.id === l.id)!;
      expect(p, l.id).toBeDefined();
      for (const [k, v] of Object.entries(l.values)) {
        if (v == null) expect(p.values[k]).toBeNull();
        else expect(p.values[k]).toBeCloseTo(v, 4);
      }
    }
    expect(pg.quarters.map((q) => q.key)).toEqual(st.quarters.map((q) => q.key));
    expect(pg.news.length).toBe(st.news.length);
    expect(pg.monthly).toHaveLength(st.monthly.length);
    expect(pg.monthly[59].nvda).toBeCloseTo(st.monthly[59].nvda, 4);
    expect(pg.quote.price).toBeCloseTo(st.quote.price, 6);
    expect(pg.analytics.ALL_METRICS.TTM.fcf).toBeCloseTo(st.analytics.ALL_METRICS.TTM.fcf!, 4);
    expect(pg.analytics.valuationSnapshot().pe).toBeCloseTo(st.analytics.valuationSnapshot().pe, 8);
  });
});
