# Supply Network Resilience — decision contract

## Buyer question

How should inventory be distributed across available logistics nodes so that loss of any single node does not create unacceptable business interruption, while additional logistics and holding cost remain bounded?

## Scope

The public demo is intentionally generic. It models a multi-region specialty retailer/distributor with imported inventory, several domestic logistics nodes and regional demand. No customer, partner or personal names belong in source code, fixtures, UI copy, analytics or documentation.

## Decision

QDIP evaluates feasible inventory-distribution alternatives and recommends a resilient allocation under normal operation and single-node-unavailable scenarios.

### Inputs

- inventory value and demand by product class and region;
- node capacity and current concentration;
- replenishment lead time and transfer paths;
- service-level target;
- maximum acceptable exposure at one node;
- incremental logistics and holding cost.

### Alternatives

At minimum the experiment compares:

1. centralized baseline;
2. naive/equal decentralization;
3. QDIP recommended allocation.

### Constraints

- node capacity;
- minimum service level;
- product/storage compatibility;
- available transfer paths;
- working-capital/inventory limits;
- maximum concentration exposure.

### Outcomes

- inventory value exposed to one node;
- service level after a node becomes unavailable;
- affected demand/locations;
- recovery time;
- incremental logistics and holding cost.

## Architecture boundary

`src/features/supply-network-resilience/domain.ts` owns frontend domain contracts only. UI components depend on `SupplyResilienceDecisionPort`, not HTTP or a concrete solver. Optimization belongs to a QDIP capability/plugin. Presentation must reuse Observatory primitives and the existing decision workflow rather than create a parallel design system.

## Validation gate

Do not claim a global optimum unless the solver provides that guarantee. The demo must expose the trade-off against both baselines and show the assumptions used by the recommendation. Production integrations, customer-specific connectors and ML are out of scope until the experiment demonstrates a material Pareto improvement.
