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
  from a locked forward that sits a fixed hedge discount below spot, so the three
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
