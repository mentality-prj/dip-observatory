# Supply Network Resilience — decision contract

**Question:** how should inventory be distributed across logistics nodes so losing any single node does not create unacceptable interruption while service level, working capital and logistics cost stay within policy?

Generic multi-region specialty retailer/distributor; fixtures are synthetic and contain no customer/personal identifiers. Model **node unavailability**, not cause/probability.

## Model
Recommend `product class × node` allocation plus executable node-to-node transfers. Objective: **minimize worst-case business loss across node-unavailable scenarios**, constrained by service level, node/route capacity, storage compatibility, inventory/working-capital envelope, concentration exposure and incremental logistics cost. Loss decomposes into explicit unserved demand, inventory-at-risk, logistics/holding cost and recovery assumptions.

Inputs: product classes (value/holding/storage), regional demand, nodes (capacity/storage/inventory), delivery routes and transfer routes (lead time/throughput/cost), normal + single-node-unavailable scenarios.

## Validation
Compare `centralized-baseline`, `equal-decentralization`, `recommended`. Each exposes actual allocation/transfers and per-scenario service level, unserved demand, inventory-at-risk, recovery time and logistics cost, plus worst-case loss and incremental cost. Before UI expansion, recommended must show material Pareto improvement over **both** baselines without constraint violations. Never claim global optimum unless solver guarantees it.

## Boundary
`SupplyResilienceDecisionPort` isolates UI from transport/solver; optimization belongs to QDIP and Observatory reuses existing decision patterns. Repository placement conventions conflict (`src/use-cases` docs vs existing `src/features`), so keep this package behind its public API and normalize placement separately. Production connectors, customer-specific integrations and ML remain out of scope until validation passes.
