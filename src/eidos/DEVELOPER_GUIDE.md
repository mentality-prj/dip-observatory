# EIDOS Decision Observatory Developer Guide

Polish version: [`DEVELOPER_GUIDE.pl.md`](./DEVELOPER_GUIDE.pl.md)

This document is the technical reference for the EIDOS prototype implemented in
`dip-observatory`. Read it together with [`README.md`](./README.md) when you need
to change the feature, validate it, or plan a real integration path.

## 1. What this feature is

The EIDOS Decision Observatory is a standalone, decision-oriented interface that
lets an energy-procurement expert review many clients at once and focus only on
the decisions that changed.

Current implementation boundaries:

- It is a **frontend-only prototype** inside `dip-observatory`.
- It is **synthetic and deterministic**: no runtime randomness, no live API, no
  database, no EIDOS connection.
- It is **isolated from the main DIP Observatory data flow**. The root
  Observatory uses DIP bootstrap/run APIs; EIDOS does not.
- It is **safe to demo** because it cannot mutate external systems.

## 2. Current feature contract

The branch currently guarantees the following behaviour:

- `/eidos` redirects to a locale-prefixed route such as `/en/eidos`.
- Supported locales are the same as the rest of the app: `en`, `uk`, `pl`.
- The portfolio overview and client table are always evaluated in the
  `BASELINE` scenario.
- Per-client scenario switching is an exploration tool in the detail pane only.
- The default selected demo client is `eidos-03` (`Helios Ceramics`).
- The baseline portfolio distribution is deterministic:
  `12 STABLE / 4 STRATEGY_CHANGED / 2 HIGH_RISK / 2 ACTION_REQUIRED`.
- The demo client changes recommendation when the scenario changes from
  `BASELINE` to `HIGH_PRICE`.
- Each client detail view contains:
  current vs. recommended strategy, scenario selector, alternatives table,
  trade-off chart, explanation, replay, decision history, and outcome tracking.

If any of those guarantees changes, update both tests and documentation.

## 3. Source-of-truth file map

### Routing

- `src/app/eidos/page.tsx`
  Redirects `/eidos` to the active locale.
- `src/app/[locale]/eidos/page.tsx`
  Locale-aware page entry point that renders `EidosWorkspace`.

### Feature shell

- `src/eidos/components/eidos-workspace.tsx`
  Owns all UI state for the feature: filters, sorting, search, selected client,
  and currently explored scenario.
- `src/eidos/components/client-decision-detail.tsx`
  Composes the full right-hand detail area.

### Domain model and decision logic

- `src/eidos/types/eidos.ts`
  Canonical domain types and unions.
- `src/eidos/data/synthetic-eidos-data.ts`
  Authored client seeds plus deterministic history/outcome generation.
- `src/eidos/lib/eidos-decision.ts`
  Pure synthetic decision engine.
- `src/eidos/lib/eidos-format.ts`
  Labels, badge tones, and deterministic formatting helpers.

### Presentation components

- `src/eidos/components/eidos-overview.tsx`
  Exception-oriented summary metrics.
- `src/eidos/components/client-table.tsx`
  Search, filter, sorting, and selection surface.
- `src/eidos/components/scenario-selector.tsx`
  Scenario switcher for per-client exploration.
- `src/eidos/components/decision-alternatives.tsx`
  Ranked strategy comparison table.
- `src/eidos/components/decision-tradeoff-chart.tsx`
  D3 plot of expected cost vs. risk.
- `src/eidos/components/decision-explanation.tsx`
  Deterministic explanation factors.
- `src/eidos/components/decision-replay.tsx`
  UI-only replay of how the decision changed.
- `src/eidos/components/decision-history.tsx`
  Twelve-month synthetic history.
- `src/eidos/components/decision-outcome.tsx`
  Expected vs. actual outcome tracking.

### Test coverage

- `src/eidos/eidos-decision.test.ts`
  Deterministic data and decision-logic coverage.
- `e2e/eidos.spec.ts`
  End-to-end coverage of the EIDOS workspace.
- `e2e/demo-reveal.spec.ts`
  Global Observatory demo flow; relevant because the branch ships both the core
  Observatory surface and the EIDOS prototype in one app.

## 4. Runtime and data flow

The feature uses a simple, explicit data flow:

1. `EidosWorkspace` resolves all `EIDOS_CLIENT_SEEDS` into baseline clients via
   `resolveClient(seed, "BASELINE")`.
2. `summarizePortfolio()` derives the portfolio summary from those resolved
   clients.
3. Local React state controls search, risk filter, status filter, sorting,
   selected client, and explored scenario.
4. The selected client id is converted back to its seed with `getClientSeed()`.
5. `ClientDecisionDetail` calls `analyzeClient(seed, scenario)` to derive the
   active recommendation and the explanation factors.
6. History and outcomes are generated from the seed with
   `buildDecisionHistory()` and `buildDecisionOutcomes()`.
7. The chart and detail panels render pure derived data only.

There is no hidden store, server action, API route, or persistence layer in the
EIDOS flow.

## 5. Synthetic decision model

The prototype compares exactly three strategies:

- `BUY_20`
- `BUY_40`
- `WAIT`

Scenarios are defined centrally in `SCENARIOS` and ordered by
`SCENARIO_ORDER`:

- `BASELINE`
- `HIGH_PRICE`
- `LOW_PRICE`
- `HIGH_DEMAND`
- `LOW_DEMAND`
- `HIGH_VOLATILITY`

For each strategy and scenario the model derives:

- expected annual procurement cost
- continuous risk value in `[0, 1]`
- risk bucket (`LOW`, `MEDIUM`, `HIGH`)
- confidence
- downside exposure
- risk-adjusted cost
- rank

The recommendation is simply rank `#1` after sorting by risk-adjusted cost.

Status derivation is intentionally transparent:

- `HIGH` risk + recommendation changed => `ACTION_REQUIRED`
- `HIGH` risk only => `HIGH_RISK`
- recommendation changed only => `STRATEGY_CHANGED`
- otherwise => `STABLE`

This is a compact heuristic, not a financial optimization engine. Treat it as a
product-hypothesis simulator, not a reusable pricing model.

## 6. Determinism rules

Determinism is a hard requirement for this prototype because the branch is used
for demos, screenshots, and repeatable validation.

Rules to preserve:

- Do not introduce `Math.random()` into rendered EIDOS state.
- Do not generate dates dynamically in the browser.
- Do not rely on locale-dependent compact formatting that can differ between
  server and client renders.
- Keep derivation functions pure and side-effect free.
- If you add new synthetic data, derive it from the existing stable per-client
  seed pattern.

Practical example: the compact euro formatter is implemented manually in
`eidos-format.ts` so server-side render and hydrated client output stay byte-for-byte
stable.

## 7. UI state and interaction rules

The behaviour below is intentional and should remain stable unless the product
contract changes.

### Overview cards

- Cards act as status filters.
- Clicking the active card toggles back to `ALL`.
- Cards summarize the baseline portfolio only.

### Client table

- Search matches the client name only.
- Search, status filter, and risk filter combine.
- Sorting is applied after filtering.
- Default sort is `status` descending, then client name.
- Re-clicking the active column toggles ascending/descending.
- Selecting a row opens the detail pane for that client.

### Detail pane

- The scenario selector affects only the selected client analysis.
- The overview cards and table do not change when a scenario is switched.
- The scenario state is stored at workspace level, so switching to another
  client keeps the currently explored scenario.
- Closing the detail pane clears the selected client only.

### Replay/history/outcomes

- Replay is UI simulation only.
- History is a deterministic 12-month sequence.
- Outcome tracking is a deterministic set of 4 synthetic observations.

## 8. Validation workflow

Use the following commands from the repository root `dip-observatory`:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm exec playwright install chromium
pnpm test:e2e
```

What each command proves:

- `pnpm build`
  Next.js production build and type correctness.
- `pnpm test`
  Deterministic decision/data contracts and generic Observatory adapter tests.
- `pnpm lint`
  ESLint cleanliness for the touched code.
- `pnpm test:e2e`
  Browser-level verification of the end-user flows.

Recommended validation order after EIDOS changes:

1. `pnpm test`
2. `pnpm lint`
3. `pnpm build`
4. `pnpm test:e2e` for UI-affecting changes

## 9. What the automated tests currently cover

### Unit and contract tests

- the dataset contains 20 valid unique clients
- recommendations stay within the supported strategy set
- scenario evaluation is deterministic
- history and outcomes are deterministic
- reference-client expectations for multiple scenarios stay stable
- scenario switching can change the recommendation
- risk bucketing and status derivation follow the intended rules
- the baseline portfolio summary stays at `12 / 4 / 2 / 2`
- formatter outputs stay human-readable

### E2E tests

- route render and synthetic-data disclaimer
- summary metric visibility
- client search
- status filtering
- client selection and detail-pane rendering
- scenario switching and recommendation updates
- decision history rendering
- outcome tracking rendering

## 10. Safe extension points

### Add or change a client archetype

Edit `EIDOS_CLIENT_SEEDS` in `synthetic-eidos-data.ts`.

Checklist:

- preserve deterministic seed generation
- re-run `pnpm test`
- if portfolio counts change, update tests and documentation intentionally

### Add a new scenario

Update all of the following:

- `EidosScenario` union in `types/eidos.ts`
- `SCENARIOS` in `eidos-decision.ts`
- `SCENARIO_ORDER` in `eidos-decision.ts`
- any scenario labels and tests that assume the current set

### Change recommendation logic

Edit only `eidos-decision.ts` first.

Checklist:

- keep the functions pure
- keep the ranking deterministic
- re-run unit tests first
- then re-run `pnpm test:e2e` because the UI makes assertions about the demo
  client and portfolio distribution

### Replace synthetic data with a real integration

Expected migration path:

1. replace `synthetic-eidos-data.ts` with a typed Observatory API adapter
2. replace local heuristic decisions with real decision/risk engine outputs
3. persist historical decisions and executed outcomes
4. add auth/tenant-aware data access
5. keep the UI contract stable while changing data sources underneath

## 11. Anti-patterns to avoid

Avoid the following changes unless there is an explicit product decision:

- mixing EIDOS logic into generic Observatory adapters
- adding live network calls directly inside EIDOS presentation components
- hardcoding summary numbers in UI components
- making the overview scenario-sensitive while the table remains baseline-only
- removing prototype disclaimers
- introducing hidden mutable global state for derived decisions

## 12. Real integration checklist

Before calling this feature an MVP rather than a prototype, the implementation
would need at least:

- real client portfolio feed
- real market/scenario source
- real recommendation source from decision/risk engines
- persisted decision audit trail
- persisted executed-strategy outcomes
- authentication and tenant isolation review
- product/legal review of any displayed recommendation language

## 13. Working agreement for future contributors

When you touch EIDOS, assume these are the minimum expectations:

- keep it deterministic
- keep it isolated until there is an approved integration design
- preserve the exception-oriented workflow
- update tests with any intentional behavioural change
- update this guide and [`MANAGEMENT_BRIEF.md`](./MANAGEMENT_BRIEF.md) when the
  audience-facing story changes
