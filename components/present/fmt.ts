/** German-locale formatting for the presentation mode. */
const nf = (d: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

export const deNum = (x: number, d = 2) => nf(d).format(x);
export const dePct = (x: number, d = 1, sign = false) => `${sign && x > 0 ? '+' : ''}${nf(d).format(x * 100)} %`;
export const deUsd = (x: number, d = 2) => `${nf(d).format(x)} $`;
/** USD millions → "3,61 Bio. $" / "361,8 Mrd. $" / "950 Mio. $" */
export const deUsdM = (m: number, d = 1) => {
  const a = Math.abs(m);
  if (a >= 1_000_000) return `${nf(2).format(m / 1_000_000)} Bio. $`;
  if (a >= 1_000) return `${nf(d).format(m / 1_000)} Mrd. $`;
  return `${nf(0).format(m)} Mio. $`;
};
export const deX = (x: number, d = 1) => `${nf(d).format(x)}×`;
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][Number(m) - 1]} ${y.slice(2)}`;
};
