import { z } from 'zod';
import { BALANCE_PERIODS, BALANCE_SHEET, CASH_FLOW, FLOW_PERIODS, INCOME_STATEMENT, QUARTERS } from './financials';
import { PEERS, PRICE_HISTORY } from './market';
import { NEWS } from './news';
import { RISKS } from './risks';
import { LineItemSchema, NewsItemSchema, PeerSchema, PeriodSchema, PricePointSchema, QuarterSchema, RiskSchema, SourceSchema } from './schema';
import { SOURCES, SOURCE_MAP } from './sources';

export class DataValidationError extends Error {
  constructor(public issues: string[]) {
    super(`Dataset failed validation:\n- ${issues.join('\n- ')}`);
  }
}

/** Validates the bundled dataset (shape + referential integrity). Throws DataValidationError. */
export function validateDataset() {
  const issues: string[] = [];
  const check = <T>(schema: z.ZodType<T>, items: unknown[], label: string) => {
    items.forEach((it, i) => {
      const r = schema.safeParse(it);
      if (!r.success) issues.push(`${label}[${i}]: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
    });
  };
  check(SourceSchema, SOURCES, 'source');
  check(PeriodSchema, [...FLOW_PERIODS, ...BALANCE_PERIODS], 'period');
  check(LineItemSchema, [...INCOME_STATEMENT, ...CASH_FLOW, ...BALANCE_SHEET], 'line');
  check(QuarterSchema, QUARTERS, 'quarter');
  check(PricePointSchema, PRICE_HISTORY, 'price');
  check(PeerSchema, PEERS, 'peer');
  check(NewsItemSchema, NEWS, 'news');
  check(RiskSchema, RISKS, 'risk');

  const ids = new Set(SOURCES.map((s) => s.id));
  if (ids.size !== SOURCES.length) issues.push('Duplicate source ids');
  const refs = [
    ...FLOW_PERIODS.map((p) => p.sourceId),
    ...BALANCE_PERIODS.map((p) => p.sourceId),
    ...QUARTERS.map((q) => q.sourceId),
    ...PRICE_HISTORY.map((p) => p.sourceId),
    ...PEERS.map((p) => p.sourceId),
    ...NEWS.flatMap((n) => n.sourceIds),
    ...RISKS.flatMap((r) => r.sourceIds),
  ];
  for (const r of refs) if (!SOURCE_MAP[r]) issues.push(`Unknown source reference: ${r}`);
  if (issues.length) throw new DataValidationError(issues);
  return true;
}
