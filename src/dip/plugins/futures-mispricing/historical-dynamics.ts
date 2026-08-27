/**
 * DIP Core plugin — historical market dynamics.
 *
 * Computes trend, volatility and momentum from pre-decision price
 * observations only. This module enforces a HARD information cutoff:
 * observations dated after the decision date are discarded before any
 * calculation. No look-ahead is possible through this function.
 */

export interface HistoricalDynamics {
  /** Linear regression slope (PLN/MWh per day). */
  trend: number;
  /** Sample standard deviation of prices (PLN/MWh). */
  volatility: number;
  /** Price change over the window (latest - oldest, PLN/MWh). */
  momentum: number;
  /** Number of observations used (after the decisionDate cutoff). */
  observationCount: number;
  /** Span of the observation window in days. */
  windowDays: number;
}

/** Convert an ISO date string to whole days since the Unix epoch. */
function toEpochDays(isoDate: string): number {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return Math.floor(timestamp / 86_400_000);
}

export function filterHistoricalObservations(
  observations: Array<{ date: string; price: number }>,
  decisionDate: string,
): Array<{ date: string; price: number }> {
  const cutoff = toEpochDays(decisionDate);

  return observations
    .map((observation) => ({
      epochDays: toEpochDays(observation.date),
      observation,
    }))
    .filter(({ epochDays }) => epochDays <= cutoff)
    .sort((a, b) => a.epochDays - b.epochDays)
    .map(({ observation }) => observation);
}

/**
 * Compute historical dynamics for a contract from pre-decision observations.
 *
 * Only observations with `date <= decisionDate` are used — this is a hard
 * information cutoff enforced before any statistic is computed.
 *
 * - trend:      OLS linear regression slope of price against day index.
 * - volatility: sample standard deviation of prices (n-1 denominator).
 * - momentum:   last price - first price (chronological order).
 *
 * @param observations  Historical price observations (any order).
 * @param decisionDate  ISO 8601 date string; the information cutoff.
 */
export function computeHistoricalDynamics(
  observations: Array<{ date: string; price: number }>,
  decisionDate: string,
): HistoricalDynamics {
  const filtered = filterHistoricalObservations(observations, decisionDate);

  const observationCount = filtered.length;

  if (observationCount === 0) {
    return { trend: 0, volatility: 0, momentum: 0, observationCount: 0, windowDays: 0 };
  }

  const firstDay = toEpochDays(filtered[0].date);
  const lastDay = toEpochDays(filtered[filtered.length - 1].date);
  const windowDays = lastDay - firstDay;

  const momentum = filtered[filtered.length - 1].price - filtered[0].price;

  if (observationCount < 2) {
    return { trend: 0, volatility: 0, momentum, observationCount, windowDays };
  }

  // --- Trend: OLS slope of price against day offset ---
  const xs = filtered.map((o) => toEpochDays(o.date) - firstDay);
  const ys = filtered.map((o) => o.price);
  const n = observationCount;
  const xBar = xs.reduce((s, x) => s + x, 0) / n;
  const yBar = ys.reduce((s, y) => s + y, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xBar;
    num += dx * (ys[i] - yBar);
    den += dx * dx;
  }
  const trend = den === 0 ? 0 : num / den;

  // --- Volatility: sample standard deviation (n-1) ---
  const variance = ys.reduce((s, y) => s + (y - yBar) ** 2, 0) / (n - 1);
  const volatility = Math.sqrt(variance);

  return { trend, volatility, momentum, observationCount, windowDays };
}
