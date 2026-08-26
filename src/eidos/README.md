# EIDOS Decision Observatory (Prototype)

> **Prototype — synthetic data.** This feature does **not** modify DIP Core, DIP API,
> the decision engine, the risk engine, or any database. It does **not** connect to
> any EIDOS system. Every number shown is generated locally from a deterministic
> synthetic dataset.

## Detailed documentation

- Overview (PL): [`README.pl.md`](./README.pl.md)
- Developer guide (EN): [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)
- Developer guide (PL): [`DEVELOPER_GUIDE.pl.md`](./DEVELOPER_GUIDE.pl.md)
- Management brief (EN): [`MANAGEMENT_BRIEF.md`](./MANAGEMENT_BRIEF.md)
- Management brief (PL): [`MANAGEMENT_BRIEF.pl.md`](./MANAGEMENT_BRIEF.pl.md)

## 1. Purpose

A standalone, decision-oriented observability surface that lets an energy-procurement
expert monitor many clients at once, focus only on the decisions that changed, see
_why_ a recommendation changed, compare procurement alternatives under different market
scenarios, and later check whether the decision turned out well.

## 2. Product hypothesis

> EIDOS could scale expert energy procurement decision-making across many clients by
> using a decision-oriented observability interface that identifies changed decisions,
> compares procurement alternatives, exposes risk/trade-offs, and tracks decision
> outcomes.

The interface is intentionally **exception-oriented**: 20 clients collapse to a small
set that requires attention, so a trader investigates only those.

## 3. Route

`/eidos` (locale-prefixed by the existing router, e.g. `/en/eidos`). Reachable from the
main Observatory header via the **EIDOS Observatory** link. `/eidos` redirects to the
active locale.

## 4. Synthetic data model

Types live in [`types/eidos.ts`](./types/eidos.ts). Core discriminated unions:

- `ProcurementStrategy` — `BUY_20 | BUY_40 | WAIT`
- `DecisionStatus` — `STABLE | STRATEGY_CHANGED | HIGH_RISK | ACTION_REQUIRED`
- `ClientRisk` — `LOW | MEDIUM | HIGH`
- `OutcomeStatus` — `FAVOURABLE | NEUTRAL | UNFAVOURABLE`
- `EidosScenario` — `BASELINE | HIGH_PRICE | LOW_PRICE | HIGH_DEMAND | LOW_DEMAND | HIGH_VOLATILITY`

Data generation:

- [`data/synthetic-eidos-data.ts`](./data/synthetic-eidos-data.ts) — 20 authored client
  seeds plus deterministic 12-month history and outcome generation (a seeded
  `mulberry32` PRNG keyed off each client id; **no runtime randomness**).
- [`lib/eidos-decision.ts`](./lib/eidos-decision.ts) — the deterministic decision engine.
  For each strategy it derives expected cost, risk, confidence and downside from the
  selected scenario, then ranks strategies by risk-adjusted cost. Expected cost is built
  from a locked forward that sits a fixed hedge discount below the reference forward / typically below baseline expected spot, so the three
  alternatives get distinct, meaningfully different costs under every scenario.
  The recommendation explanation surfaces the 3–4 most material, data-derived factors
  (coverage gap, cost, downside, confidence, price and demand moves). Recommendation,
  status, and portfolio summary are all **derived from data**, never hardcoded in the UI.

The portfolio is always evaluated at the `BASELINE` scenario for the overview and table;
scenario switching is a per-client exploration in the detail view.

## 5. Core workflow

The current prototype supports a clear client-facing workflow:

1. Start from the portfolio overview and focus on the clients that require attention.
2. Open an individual client to compare the current strategy and the recommended strategy.
3. Review the explanation of why the recommendation changed.
4. Compare procurement alternatives through cost, risk, confidence, and downside.
5. Switch market scenarios to see whether different assumptions lead to a different strategy.
6. Review decision history and tracked outcomes to understand how decisions evolved over time.

## 6. Architecture

```
src/eidos/
├── components/          # presentation only, built on existing Observatory UI primitives
│   ├── eidos-workspace.tsx        # owns filter/sort/search/selection/scenario state
│   ├── eidos-overview.tsx         # exception-oriented summary metrics
│   ├── client-table.tsx           # sort / filter / search / select
│   ├── client-decision-detail.tsx # composes the detail panels below
│   ├── scenario-selector.tsx
│   ├── decision-alternatives.tsx
│   ├── decision-tradeoff-chart.tsx  # d3 (already a repo dependency)
│   ├── decision-explanation.tsx
│   ├── decision-replay.tsx
│   ├── decision-history.tsx
│   └── decision-outcome.tsx
├── data/synthetic-eidos-data.ts
├── lib/
│   ├── eidos-decision.ts          # deterministic decision engine
│   └── eidos-format.ts            # labels, tones, formatters
├── types/eidos.ts
└── eidos-decision.test.ts         # unit tests (data + decision logic)
```

Routing: [`src/app/[locale]/eidos/page.tsx`](../app/%5Blocale%5D/eidos/page.tsx) renders
the workspace; [`src/app/eidos/page.tsx`](../app/eidos/page.tsx) redirects to the active
locale. UI behaviour is covered by [`e2e/eidos.spec.ts`](../../e2e/eidos.spec.ts).

## 7. Known limitations

- Synthetic data only; costs/risks are illustrative, not financially accurate.
- The decision model is a compact deterministic heuristic, not the DIP decision engine.
- Scenario set and client archetypes are fixed and small (no server pagination).
- Risk buckets in the seeded portfolio are MEDIUM/HIGH; there are no LOW-risk clients.
- No persistence: replay and scenario switching are UI simulations, not stored state.

## 8. What real EIDOS integration would require

- Replace `synthetic-eidos-data.ts` with an Observatory API client that reads real client,
  market, and decision-history data (respecting the existing tenant/auth model).
- Replace `lib/eidos-decision.ts` with calls into the real DIP decision and risk engines
  instead of the local heuristic.
- Source scenario definitions and forecasts from real market/forecast services.
- Persist decisions, outcomes, and executed strategies for genuine outcome tracking and
  variance analysis.

## No production assumptions

This prototype makes **no** claim of real market prediction, real financial optimization,
real procurement recommendation, real EIDOS integration, production readiness, or
financial accuracy.

---

## Futures Mispricing Research Prototype (v0)

> **HISTORICAL CASE STUDY — NOT STATISTICAL VALIDATION.**
> A single successful 2026-05-26 case does not prove the methodology is generally effective.
> Multiple out-of-sample decision dates and contracts are required before any effectiveness claim can be made.

### 1. Product hypothesis

Given the futures forward curve and historical futures prices available at a decision date, can DIP identify a futures contract whose current price is materially below a defensible valuation range and therefore generate a BUY / WATCH / NO ACTION hedge-timing recommendation?

### 2. EIDOS problem definition

A corporate energy buyer needs to decide whether the current market price of Q1-2027 Polish electricity futures represents a good hedging entry point. The decision must be made ex-ante (before the price moves), using only information available on 2026-05-26.

- Decision date: 2026-05-26
- Contract: Q1-2027
- Price at decision time: **479 PLN/MWh**
- Subsequent reference price (NOT used in decision): 558 PLN/MWh

### 3. Mathematical model

The pipeline:

```
MarketSnapshot (ex-ante only)
  → CurveMetrics (structural analysis)
  → ValuationRange (structural + uncertainty)
  → MinimaxResult (robust worst-case)
  → MispricingSignal (decision)
  → HedgeDecision (recommendation)
```

### 4. Forward curve model

- **Overall slope**: OLS linear regression over all curve points
- **Local slope**: central difference `(P[i+1] - P[i-1]) / (ord[i+1] - ord[i-1])`
- **Curvature**: discrete second derivative `(P[i+1] - 2·P[i] + P[i-1]) / (Δord)²`
- **Structural valuation**: 70% local linear interpolation (adjacent quarterly) + 30% annual (Cal) proxy
- **Calendar spreads**: target price minus adjacent quarterly contracts
- **Annual spread**: target price minus nearest Cal contract
- **Normalised deviation**: `(P_target - P_interpolated) / σ_local`

### 5. Uncertainty model

Uncertainty width is derived from measurable data properties:

```
σ_hist         = sample std dev of historical price observations
σ_local        = population std dev of neighbouring contracts (excluding target)
distanceFactor = 1 + (maxOrdinalGap - 1) × 0.5  [clamped to 2.5]
densityFactor  = √(10 / n)  [for n < 10 curve points]

σ_combined = √(σ_hist² + σ_local²) × distanceFactor × densityFactor
halfWidth   = max(1.5 × σ_combined, 10 PLN/MWh)
```

The output is a deterministic interval, NOT a probability distribution.

### 6. Minimax layer

A transparent minimax over a 100-point deterministic grid:

```
U = [central - halfWidth, central + halfWidth]
worstCaseLow  = min(U)
worstCaseHigh = max(U)
robustDiscount = worstCaseLow - currentPrice
```

The adversary picks the state that minimises the apparent discount (collapses valuation).

This prototype demonstrates the minimax principle. It does NOT reproduce Kapustian's published PDE estimator.

### 7. Decision policy

Explicit thresholds (not calibrated to the 2026-05-26 outcome):

| Signal | Condition |
|--------|-----------|
| BUY | `robustDiscount > 0` AND `discountPct > 3%` AND `discountAbsolute / uncertaintyWidth ≥ 0.5` AND `discountAbsolute > 5 PLN` |
| WATCH | `currentPrice < central` but not BUY |
| NO_ACTION | `currentPrice ≥ central` |

### 8. Historical case (2026-05-26)

Running `computeHedgeDecision(EIDOS_MARKET_SNAPSHOT, "Q1-2027", EIDOS_Q1_2027_HISTORY, "2026-05-26")` produces the decision. The regression test prints the exact values.

The 558 PLN subsequent price is in the sealed `EIDOS_Q1_2027_OUTCOME` object with discriminant label `SUBSEQUENT_OUTCOME_NOT_AVAILABLE_AT_DECISION_TIME` to make accidental use in decision code a TypeScript error.

### 9. Look-ahead bias protection

- `computeHedgeDecision()` accepts only `MarketSnapshot` (no outcome data)
- Historical observations array contains only pre-decision dates
- `OutcomeData` type carries a discriminant label that prevents accidental import
- Unit tests explicitly verify that no snapshot point contains 558 PLN
- The UI renders the outcome section after a visual separator labelled "post-decision information"

### 10. Known limitations

- Only 7 historical observations for Q1-2027 (July 2025 → May 2026)
- The minimax grid is uniform — not a PDE solution
- No cross-asset correlations (gas, coal, CO₂)
- No seasonality model
- No liquidity adjustment
- Single decision date — no out-of-sample validation

### 11. Why this is NOT Kapustian's published PDE estimator

This prototype tests whether uncertainty-aware minimax decisioning can identify futures mispricing. It does not claim that the current implementation reproduces Kapustian's published PDE results.

Kapustian's estimator involves a PDE over the uncertainty set, solved with a specific finite-difference scheme. This prototype uses a uniform grid over a symmetric interval — a first-order approximation that demonstrates the principle without the full mathematical machinery.

### 12. Next R&D steps

1. Replace uniform grid with Kapustian's PDE discretisation
2. Add cross-asset factors (TTF gas, API2 coal, EUA carbon)
3. Extend historical dataset to 24+ months
4. Add multiple decision dates for out-of-sample validation
5. Implement seasonality adjustment for Q1 winter premium
