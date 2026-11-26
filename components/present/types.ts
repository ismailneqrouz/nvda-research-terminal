import type { MonthRow } from '@/lib/data/returns';

/** Plain-data payload assembled on the server for the presentation mode. All USD amounts in millions unless noted. */
export interface PresentData {
  asOfLabel: string;
  asOfDate: string;
  price: number;
  prevClose: number;
  changePct: number;
  recordClose: number;
  shares: number; // millions
  debt: number;
  cash: number;
  securities: number;
  nonMarketable: number;
  fy26Revenue: number;
  nineM27Revenue: number;
  nineM26Revenue: number;
  ttmRevenue: number;
  ttmRevenuePrior: number;
  ttmGrossProfit: number;
  ttmOperatingIncome: number;
  ttmNetIncome: number;
  ttmOtherIncome: number;
  ttmDa: number;
  ttmOcf: number;
  ttmCapex: number; // positive outflow
  ttmEps: number;
  fy26Eps: number;
  nineM27Eps: number;
  nineM26Eps: number;
  equity: number;
  currentAssets: number;
  currentLiabilities: number;
  quarters: { label: string; revenue: number; grossMargin: number; operatingMargin: number }[];
  peers: { ticker: string; pe: number | null; evEbitda: number | null; fcfYield: number | null }[];
  peersAsOf: string;
  tenYear: number; // decimal
  monthly: MonthRow[];
  yahooBeta: number;
  dcf: { bull: number; base: number; bear: number };
  novMtd: number;
}
