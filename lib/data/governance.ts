/** Corporate governance facts (sourced) and implications (assessment). */

export const LEADERSHIP = [
  { name: 'Colette M. Kress', role: 'Interim CEO; EVP & Chief Financial Officer', since: 'CFO since Sep 2013; interim CEO since Nov 12, 2026', note: 'Nearly 25 years of prior finance roles at Cisco and Microsoft. Holds both CEO and CFO roles during the transition.', sourceId: 'nvda-ceo-8k' },
  { name: 'Harvey C. Jones', role: 'Chair of the Board (independent)', since: 'Nov 12, 2026', note: 'First-ever board chair. Former CEO and executive chairman of Synopsys; long-serving NVIDIA director.', sourceId: 'nvda-ceo-8k' },
  { name: 'Stephen C. Neal', role: 'Lead Independent Director (per 2026 proxy)', since: '—', note: 'Lead Director role as described in the 2026 proxy, prior to the creation of the chair role.', sourceId: 'proxy-ownership' },
  { name: 'Jen-Hsun (Jensen) Huang', role: 'Co-founder; former President & CEO and director', since: '1993 – Nov 12, 2026', note: 'Resigned all roles effective immediately. Beneficially owned 870.6M shares (3.58%) as of Mar 23, 2026, per the proxy.', sourceId: 'proxy-ownership' },
];

export const GOVERNANCE_FACTS = [
  { label: 'Board size (2026 proxy)', value: '10 directors, 9 independent', note: 'Before Huang’s departure; now 9 directors, all independent of management (one seat vacated).', sourceId: 'proxy-summary', status: 'reported' as const },
  { label: 'Board leadership', value: 'Independent chair (new, Nov 2026)', note: 'Separation of chair and CEO for the first time.', sourceId: 'nvda-ceo-8k', status: 'reported' as const },
  { label: 'Share classes', value: 'Single class, one share one vote', note: 'No super-voting founder shares.', sourceId: 'proxy-ownership', status: 'reported' as const },
  { label: 'Insider ownership', value: '3.90%', note: 'Directors & executive officers as a group held 3.94% in the 2026 proxy (Huang 3.58%).', sourceId: 'sa-nvda-stats', status: 'market' as const },
  { label: 'Institutional ownership', value: '70.4%', note: '', sourceId: 'sa-nvda-stats', status: 'market' as const },
  { label: 'Auditor', value: 'PricewaterhouseCoopers LLP', note: 'Ratification for FY2027 on the 2026 ballot.', sourceId: 'proxy-summary', status: 'reported' as const },
  { label: 'Supermajority voting', value: 'Retained', note: 'Board recommended AGAINST a 2026 shareholder proposal to replace supermajority provisions with simple majority.', sourceId: 'proxy-summary', status: 'reported' as const },
  { label: 'Director pay', value: '≈$363,809 per outside director (FY2026)', note: 'Board met five times in FY2026.', sourceId: 'proxy-ownership', status: 'reported' as const },
  { label: 'Prior SEC settlement', value: '$5.5M (May 2022)', note: 'Over inadequate disclosure of crypto-mining impact on FY2018 Gaming revenue.', sourceId: 'sec-probe-wsj', status: 'reported' as const },
  { label: 'New committee', value: 'National security & global trade compliance', note: 'Created after the CEO-related revelations.', sourceId: 'huang-resign-sfs', status: 'reported' as const },
];

export const CAPITAL_ALLOCATION = {
  buybackAuthorizationRemaining: 227300,
  buybackIncreaseSep2026: 150000,
  returnedQ3: 28100,
  returnedFy26: 41100,
  quarterlyDividendNow: 0.25,
  quarterlyDividendFeb2026: 0.01,
  sourceIds: ['nvda-q3fy27-pr', 'nvda-q4fy26-pr'],
};

export const COMPENSATION_NOTES = [
  'NEO pay is dominated by performance-based equity: single-year and multi-year PSUs tied to non-GAAP revenue and operating income goals, plus a variable cash plan (2026 proxy terminology: “Base” and “Stretch” compensation plans).',
  'Performance goals are set on non-GAAP metrics, which exclude stock-based compensation; SBC was $7.7B TTM (2.1% of revenue) — modest relative to revenue but large in absolute terms.',
  'Specific FY2026 NEO pay amounts were not extracted for this platform: Data unavailable — see the proxy statement.',
];

export const GOVERNANCE_IMPLICATIONS = [
  { title: 'Positive structural features', points: ['Single share class: shareholders can, in principle, change the board.', 'Board now has an independent chair, ending the combined founder-CEO/board-leadership model.', 'Capital returns are large and rising (dividend 25× higher than in February 2026).'] },
  { title: 'Concerns', points: ['Several long-tenured directors (first seated 1993–1997) — independence in form but potentially less in substance relative to a founder.', 'Interim CEO also serves as CFO while the SEC reportedly examines accounting and disclosure: concentration of responsibility over the financial statements.', 'Supermajority provisions retained; board opposed shareholder proposals on voting standards.', 'Disclosure-related allegations (geographic revenue presentation) are unresolved.'] },
  { title: 'What would improve confidence', points: ['Appointment of a separate permanent CEO and/or CFO.', 'Publication of the independent committee’s findings.', 'Unqualified audit opinion and no material weakness in the FY2027 10-K.', 'More granular disclosure of end-customer geography and of investments in customers.'] },
];
