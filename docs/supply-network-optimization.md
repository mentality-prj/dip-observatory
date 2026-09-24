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
