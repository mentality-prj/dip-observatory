# Supply Network Optimization — Observatory contract

Supply Network Optimization is the canonical supply application in Observatory.
The previous Supply Network Resilience capability is retained as a disruption scenario
inside the broader optimization workflow; it is not exposed as a second application.

## Business questions

The application answers four questions with backend optimization results:

1. where each product should be stored;
2. which warehouse should serve each demand point;
3. how incoming supply should be split between warehouses;
4. how the plan changes when a warehouse is unavailable or a candidate warehouse is introduced.

## Geographic UX

The primary visualization is a MapLibre GL JS map. The basemap provider configuration is
isolated in `map-provider.ts`; application overlays are GeoJSON/markers.

Existing transport costs come from the network input. Coordinates do not replace explicit
route costs. Coordinates are used for visualization and, only for newly introduced candidate
warehouses, by the backend's documented deterministic demo-connectivity rule.

## Scenarios

The UX presents the progression:

- current network;
- baseline optimized network;
- warehouse unavailable;
- reallocated network;
- new warehouse candidate.

Warehouse unavailability is a business state. The UI does not model a physical cause.

A candidate warehouse is optional to the optimizer. Creating one on the map does not imply a
recommendation; the returned result explicitly indicates whether the optimizer uses it.

## Source of truth

Inventory placement, fulfillment flows, inbound allocation, transfers, KPIs, candidate use,
constraint evidence and infeasibility causes come from the QDIP backend. The browser performs
no optimization.

The synthetic demo represents a generic multi-region specialty retailer. It contains no customer
names, customer locations, customer identifiers or customer branding.

## Compatibility

The canonical route is `/supply-network-optimization`.
The old `/supply-network-resilience` route permanently redirects to it.

## Model semantics used by the demo

The current-flow layer is quantitative input evidence, not a hand-drawn connectivity diagram.
`baseline_fulfillment` records warehouse, demand region, product and units per day. QDIP can
therefore price assignment changes through the backend reallocation-cost policy and the map can
render baseline flow magnitude.

Candidate warehouses expose opening/setup cost, opening-cost amortization period, fixed daily
operating cost and per-unit handling cost separately. The demo does not label a location as economically preferable unless the backend
includes those costs in the returned business-impact comparison.

The nominal network uses a stricter warehouse-fulfillment concentration limit than an emergency
warehouse-loss scenario. The active limit shown by the UI follows the active scenario.

Supplier allocation may contain multiple transport modes for the same destination. The selected
mode in the evidence panel is the mode returned by QDIP, not a browser-side choice.

Local warehouse-to-demand flows whose coordinates coincide are rendered as rings around the
location instead of being silently dropped or displaced to fake coordinates. The map fits all
visible warehouses, demand regions, suppliers and candidate locations.

## Reverse-analysis corrections

The baseline flow layer is now decision evidence, not only a visual overlay. Every positive
demand/product pair has a complete quantitative baseline allocation. Backend reallocation cost is
therefore based on volume moved above the historical warehouse share, including shifts between two
warehouses that were both already used historically.

Warehouse utilization uses peak pre-dispatch storage load. A warehouse that receives and ships
inventory within the same day can no longer appear to require zero storage capacity. Candidate
cards label this value as required peak storage capacity and show the economic effect against the
disrupted plan.

The evidence panel exposes logistics, stockout, reallocation, new-facility fixed and handling cost
components. This prevents a lower transport-cost candidate from being presented as economically
better when setup, handling or transition costs make its total impact worse.

The candidate frontier is described as a multi-criteria trade-off across economic impact, service
and deterministic resilience stress metrics. It is not presented as a continuous geographic
global optimum.
