export const NAV = [
  { href: '/', label: 'Overview', icon: 'LayoutDashboard', keywords: 'dashboard thesis scores summary bull bear' },
  { href: '/financial-statements', label: 'Financial Statements', icon: 'FileSpreadsheet', keywords: 'income statement balance sheet cash flow three-statement' },
  { href: '/profitability', label: 'Profitability & Efficiency', icon: 'Percent', keywords: 'margins roe roa roic turnover dso dio earnings quality' },
  { href: '/financial-health', label: 'Financial Health', icon: 'ShieldCheck', keywords: 'debt liquidity solvency current ratio stress test' },
  { href: '/valuation', label: 'Valuation', icon: 'Calculator', keywords: 'dcf multiples pe ev ebitda sensitivity intrinsic value peers' },
  { href: '/business-model', label: 'Business Model', icon: 'Boxes', keywords: 'segments data center gaming cuda moat customers' },
  { href: '/competition', label: 'Competition & Market', icon: 'Swords', keywords: 'amd broadcom intel tpu trainium maia market share' },
  { href: '/corporate-governance', label: 'Corporate Governance', icon: 'Landmark', keywords: 'ceo board kress huang buyback dividend auditor' },
  { href: '/industry', label: 'Industry Analysis', icon: 'Factory', keywords: 'semiconductor tam capex hyperscaler foundry memory energy' },
  { href: '/macroeconomics', label: 'Macroeconomics', icon: 'Globe2', keywords: 'rates inflation gdp dollar export controls fed' },
  { href: '/risk-analysis', label: 'Risk Analysis', icon: 'TriangleAlert', keywords: 'risk register fat tail taiwan scenario matrix watchlist' },
  { href: '/future-outlook', label: 'Future Outlook', icon: 'TrendingUp', keywords: 'bull base bear scenarios expected return' },
  { href: '/news', label: 'News & Events', icon: 'Newspaper', keywords: 'earnings sec probe resignation export rule' },
  { href: '/sources', label: 'Sources & Methodology', icon: 'BookOpen', keywords: 'sources methodology data integrity definitions' },
] as const;

export const PRESENT_LINK = { href: '/present', label: 'Präsentationsmodus', keywords: 'presentation slides lernen sharpe sortino tabelle spreadsheet' };
