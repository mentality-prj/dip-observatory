# EIDOS Decision Observatory (Prototype)

> **Prototype — synthetic data.** This feature does **not** modify DIP Core, DIP API,
> the decision engine, the risk engine, or any database. It does **not** connect to
> any EIDOS system. Every number shown is generated locally from a deterministic
> synthetic dataset.

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
  selected scenario, then ranks strategies by risk-adjusted cost. Recommendation, status,
  and portfolio summary are all **derived from data**, never hardcoded in the UI.

The portfolio is always evaluated at the `BASELINE` scenario for the overview and table;
scenario switching is a per-client exploration in the detail view.

## 5. Demo scenario (~5–7 min)

1. Open `/eidos`.
2. Dashboard shows **20 clients → 12 stable / 4 strategy changed / 2 high risk /
   2 action required** (derived from the dataset).
3. Select the pre-highlighted client whose recommendation changed
   (`BUY_20 → BUY_40`).
4. Read **Why did the recommendation change?** — structured market/demand/risk factors.
5. Compare alternatives **BUY 20% / BUY 40% / WAIT** (cost ↔ risk trade-off, ranking).
6. Switch scenario **BASELINE → HIGH PRICE** — the preferred strategy changes. This is
   the core hypothesis: a change in assumptions can change the preferred decision.
7. Open the decision **history** timeline.
8. Open the **outcome**: recommended vs. executed strategy, expected vs. actual cost,
   variance, and a synthetic FAVOURABLE / NEUTRAL / UNFAVOURABLE verdict.

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
