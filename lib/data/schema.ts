import { z } from 'zod';

/**
 * Data-integrity vocabulary. Every figure shown in the terminal is tagged with
 * one of these statuses so that reported history is never confused with
 * calculations, consensus estimates, management guidance or model assumptions.
 */
export const DataStatus = z.enum([
  'reported', // taken directly from a filing / press release
  'calculated', // derived by this platform from reported figures
  'ttm', // trailing-twelve-month calculation from reported periods
  'estimate', // third-party analyst consensus
  'guidance', // company management outlook
  'assumption', // this platform's own model assumption
  'market', // market data (prices, market cap)
  'assessment', // qualitative judgement by this platform
]);
export type DataStatus = z.infer<typeof DataStatus>;

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  url: z.string().url(),
  published: z.string().optional(), // ISO date
  accessed: z.string(), // ISO date
  kind: z.enum(['filing', 'company', 'government', 'data-provider', 'news', 'research', 'legal']),
  note: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const PeriodSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(['annual', 'ytd', 'quarter', 'instant']),
  /** Fiscal period end date (ISO). NVIDIA's fiscal year ends on the last Sunday of January. */
  end: z.string(),
  months: z.number().int().optional(),
  sourceId: z.string(),
});
export type Period = z.infer<typeof PeriodSchema>;

export const LineItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  statement: z.enum(['income', 'balance', 'cashflow']),
  /** USD millions unless `unit` says otherwise. null = data unavailable. */
  values: z.record(z.string(), z.number().nullable()),
  unit: z.enum(['usd_m', 'usd', 'shares_m']).default('usd_m'),
  status: z.enum(['reported', 'calculated']).default('reported'),
  level: z.number().int().min(0).max(2).default(1),
  emphasis: z.boolean().default(false),
  note: z.string().optional(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const QuarterSchema = z.object({
  key: z.string(),
  label: z.string(),
  end: z.string(),
  revenue: z.number(),
  grossProfit: z.number(),
  operatingIncome: z.number(),
  netIncome: z.number(),
  dilutedEps: z.number(),
  freeCashFlow: z.number(),
  sourceId: z.string(),
});
export type Quarter = z.infer<typeof QuarterSchema>;

export const PricePointSchema = z.object({
  date: z.string(),
  close: z.number(),
  sourceId: z.string(),
  kind: z.enum(['year-end', 'daily']),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

export const PeerSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  price: z.number(),
  marketCapB: z.number(),
  evB: z.number(),
  pe: z.number().nullable(),
  forwardPe: z.number().nullable(),
  peg: z.number().nullable(),
  ps: z.number().nullable(),
  pb: z.number().nullable(),
  evEbitda: z.number().nullable(),
  evEbit: z.number().nullable(),
  evFcf: z.number().nullable(),
  fcfYield: z.number().nullable(),
  dividendYield: z.number().nullable(),
  ttmRevenueB: z.number().nullable(),
  grossMargin: z.number().nullable(),
  operatingMargin: z.number().nullable(),
  netMargin: z.number().nullable(),
  roe: z.number().nullable(),
  roic: z.number().nullable(),
  debtEquity: z.number().nullable(),
  currentRatio: z.number().nullable(),
  asOf: z.string(),
  sourceId: z.string(),
  businessModel: z.string(),
  comparabilityNote: z.string(),
});
export type Peer = z.infer<typeof PeerSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.enum([
    'earnings',
    'guidance',
    'product',
    'customer',
    'partnership',
    'acquisition',
    'regulatory',
    'export',
    'governance',
    'legal',
    'competitor',
    'industry',
    'market',
    'macro',
  ]),
  headline: z.string(),
  /** Factual summary of what was reported. */
  summary: z.string(),
  /** Interpretation by this platform — kept separate from the factual summary. */
  relevance: z.string(),
  financialImpact: z.string(),
  thesisImpact: z.enum(['positive', 'negative', 'mixed', 'neutral']),
  sourceIds: z.array(z.string()).min(1),
  confirmed: z.boolean(), // false = reported by media, not confirmed by company/regulator
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

export const Severity = z.enum(['low', 'moderate', 'high', 'critical']);
export type Severity = z.infer<typeof Severity>;

export const RiskSchema = z.object({
  id: z.string(),
  category: z.enum([
    'Financial',
    'Operational',
    'Competitive',
    'Technological',
    'Regulatory',
    'Geopolitical',
    'Customer concentration',
    'Supply chain',
    'Cybersecurity',
    'Accounting & governance',
    'Valuation',
  ]),
  title: z.string(),
  description: z.string(),
  probability: z.enum(['low', 'medium', 'elevated', 'high']),
  impact: z.string(),
  severity: Severity,
  horizon: z.enum(['0–12 months', '1–3 years', '3+ years']),
  warnings: z.array(z.string()),
  mitigation: z.string(),
  residual: Severity,
  sourceIds: z.array(z.string()).default([]),
});
export type Risk = z.infer<typeof RiskSchema>;
