# Futures Mispricing Plugin (DIP Core)

`futures-mispricing` is a DIP Core research plugin that produces a deterministic,
robust hedge-timing decision for a single futures contract. It lives at
`src/dip/plugins/futures-mispricing/` and is exposed to the Observatory over
HTTP via the Next.js API route `POST /api/dip/futures-mispricing`.

> **Independence statement.** This is an independent deterministic robust/minimax
> baseline. It does not reproduce EIDOS's internal methodology and does not
> implement Kapustian's published mathematical estimator.

## Business problem

Given a forward curve snapshot and the pre-decision price history for a target
contract, decide whether *now* is a good time and price to buy a hedge:

- **BUY** — the price is robustly below a defensible valuation range.
- **WATCH** — the price is below the central valuation, but not robustly.
- **NO_ACTION** — the price is at or above the central valuation.

## Input / output contracts

### Request — `FuturesMispricingRequest`

Contains **only pre-decision information**. It has no field for outcome, future
price, or realized return.

| Field | Type | Notes |
| --- | --- | --- |
| `decisionDate` | `string` (ISO 8601) | Hard information cutoff. |
| `targetContract` | `string` | e.g. `"Q1-2027"`. |
| `marketSnapshot` | `MarketSnapshot` | Forward curve at the decision date. |
| `historicalObservations` | `Array<{ date; price }>` | Pre-decision prices. |
| `configuration` | `Partial<FuturesMispricingConfigV1>` | Optional overrides. |

### Response — `FuturesMispricingResponse`

| Field | Type | Notes |
| --- | --- | --- |
| `decision` | `HedgeDecision` | Canonical decision output. |
| `pluginVersion` | `string` | `0.1.0`. |
| `modelVersion` | `string` | `1.0`. |
| `configurationVersion` | `string` | `1.0`. |
| `computedAt` | `string` | Metadata timestamp only. |
| `decisionTrace` | `DecisionTrace` | Full auditable trace. |

## Mathematical components

The pipeline is deterministic (no random sampling, no Monte Carlo):

1. **Curve analysis** (`curve-analysis.ts`) — OLS overall slope, central-difference
   local slope, discrete curvature, calendar/annual spreads, normalised deviation.
2. **Structural valuation** (`valuation.ts`, `StructuralCurveValuationV1`) —
   weighted average of a local linear interpolation (adjacent quarterly
   contracts) and the nearest annual (Cal) proxy.
3. **Historical dynamics** (`historical-dynamics.ts`) — trend (OLS slope per day),
   volatility (sample std dev), and momentum (last − first), computed only from
   observations with `date <= decisionDate`.
4. **Uncertainty range** (`uncertainty.ts`) — deterministic interval derived from
   historical dispersion, local curve dispersion, distance and density factors.
5. **Robust minimax** (`minimax.ts`, `RobustMinimaxEstimatorV1` /
   `runMinimax`) — worst-case bounds over a deterministic grid.
6. **Mispricing signal** (`mispricing.ts`) — BUY / WATCH / NO_ACTION classification
   with a qualitative robustness label.
7. **Hedge decision** (`hedge-decision.ts`) — orchestrates the above into a final
   `HedgeDecision` with rationale.

## Configuration values (`FuturesMispricingConfigV1`)

| Key | Default | Meaning |
| --- | --- | --- |
| `valuationWeights.localInterpolation` | `0.7` | Weight on local interpolation. |
| `valuationWeights.annualProxy` | `0.3` | Weight on annual proxy. |
| `uncertaintyCoverageFactor` | `1.5` | Half-width coverage factor `k`. |
| `minimumHalfWidth` | `10.0` | Minimum uncertainty half-width (PLN/MWh). |
| `minimaxGridSize` | `100` | Deterministic minimax grid points. |
| `minimumBuyDiscountPercent` | `0.03` | Minimum discount for a BUY. |
| `minimumDiscountUncertaintyRatio` | `0.5` | Discount / uncertainty ratio for BUY. |
| `minimumAbsoluteDiscountPln` | `5.0` | Minimum absolute discount (PLN/MWh). |
| `historicalWindowDays` | `180` | Historical window length (days). |
| `robustnessHighThreshold` | `1.5` | Robustness HIGH threshold. |
| `robustnessMediumThreshold` | `0.5` | Robustness MEDIUM threshold. |
| `configVersion` | `"1.0"` | Configuration schema version. |

These values are explicit **structural assumptions**, not parameters fitted to
any observed outcome.

## Outcome separation (look-ahead protection)

- The request contract cannot carry outcome/future data.
- `computeHistoricalDynamics` filters observations to `date <= decisionDate`
  before computing any statistic — a hard information cutoff.
- Outcome reporting (e.g. the EIDOS 558 PLN reference price) is handled entirely
  outside the decision pipeline and never flows back into any calculation.

## Limitations

- Single-case reasoning: a favourable historical case does **not** validate the
  methodology. Multiple out-of-sample cases are required before any effectiveness
  claim can be made.
- Thresholds and weights are structural assumptions, not optimised parameters.
- The minimax layer is a transparent robust baseline, not a faithful
  implementation of any published PDE-based estimator.
