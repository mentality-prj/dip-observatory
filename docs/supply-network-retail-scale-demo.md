# Retail-scale Supply Network demo contract

## Commercial objective

Demonstrate that QDIP can turn a disruption in a realistically sized retail network into an auditable recovery decision. The demo must sell the decision layer, not a forecasting replacement and not a decorative map.

## Synthetic benchmark target

The benchmark is explicitly synthetic and only mirrors a prospect-scale order of magnitude:

- 37 stores
- 15 regions
- 8,000 SKUs
- 7-day planning horizon
- multiple distribution nodes and inbound suppliers
- storage, receiving, dispatch, route, service-level, inventory and economic constraints

Do not present generated demand, inventory, costs, topology, constraints, SKU mix or solver performance as customer data.

## Required proof before UI claims

A scale claim is publishable only from a completed backend benchmark run. Capture:

- input dimensions: stores, SKUs, regions, warehouses, suppliers, horizon
- active SKU-store positions
- decision-variable / constraint counts when the solver exposes them
- solver status and optimality flag
- solve time and end-to-end request time
- MIP gap when applicable
- peak memory when measurable
- service level, unserved demand and modeled economic impact
- number of SKU-store positions actually reallocated

Never hard-code solve time, number of alternatives, constraints checked, economic value or reallocations into sales copy.

## Demo story

1. Initial screen shows the existing operational plan. No QDIP recommendation has been calculated yet.
2. User selects a distribution node and creates a disruption.
3. QDIP computes a recovery plan for the same frozen network state and disruption.
4. UI compares:
   - current plan before disruption;
   - consequence/recovery baseline defined by the backend contract;
   - QDIP recovery recommendation.
5. Lead with service protected, remaining stockout exposure, modeled economic impact and measured solve time.
6. Map explains the recommendation; it is not the primary proof.
7. SKU detail is drill-down. Never render 8,000 rows by default.
8. CTA: run the same decision layer on the prospect's ERP/WMS/forecast inputs.

## UX invariants

- Remove the misleading "Show current network plan" optimization step. Current plan is visible immediately.
- Never label an optimized result as "current plan".
- Current and QDIP flows must be visually separable; prefer a Before / Disruption / QDIP view selector over permanent overlays.
- Supplier marker and inbound-flow legend entries are distinct concepts.
- Aggregate 8,000 SKUs into operational outcomes, with search/filter drill-down for affected SKUs.
- Every performance/economic number shown as QDIP output must come from the response metadata/result.

## Acceptance gate

Do not switch the public demo to the 37-store / 8,000-SKU claim until the backend benchmark passes an agreed runtime/resource budget and the result remains auditable. If exact SKU-level optimization is not tractable, change the mathematical formulation (decomposition, aggregation with SKU-level repair, rolling horizon, etc.) before changing the marketing claim.
