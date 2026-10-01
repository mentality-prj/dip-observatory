# Readiness Recovery Scenario Planner

## Scope

The planner is a QDIP decision-layer application. It consumes a normalized fleet state, capability demand, candidate recovery actions, resource pools and uncertainty models. It returns nondominated recovery scenarios for human comparison. It does not manage work orders, dispatch technicians, own inventory or execute the selected scenario.

External systems (SAP, CMMS, CSV feeds or other APIs) are expected to terminate at a future `FleetStateAdapter` boundary and map into the domain types in `src/use-cases/readiness-recovery/domain.ts`. The core planner has no dependency on SAP, Next.js, React or a storage implementation.

## Capability model

Operational value is represented by `CapabilityDemand` and `AssetCapabilityContribution`, not by an arbitrary asset-importance score. Contributions support quantity, quality, validity windows, capability dependencies and substitution declarations. A degraded asset contributes according to its current reliability; a recovered asset contributes according to the sampled resulting reliability when the action completes before the relevant demand deadline.

## Optimization pipeline

1. Candidate recovery actions are grouped per impaired asset.
2. `OptimizationBackend` generates a bounded structurally feasible candidate set.
3. The current `BoundedFeasibilityBackend` enforces one action per asset, parts, produced parts from cannibalization, technician-hour capacity, workshop-hour capacity, replacement compatibility, action dependencies and nominal deadline feasibility.
4. Candidate retention uses several search views (readiness gain, time, parts and risk) so one arbitrary weighted score does not define the output.
5. Monte Carlo evaluation uses a deterministic seed and supports deterministic, triangular, log-normal and empirical numeric distributions plus Bernoulli repair success/repeat failure.
6. Scenarios are filtered by multi-objective epsilon dominance.
7. Human-readable scenario labels are assigned only after optimization.

The backend interface is intentional. Exact temporal scheduling can replace the bounded backend with CP-SAT/MILP without changing the domain, API or Observatory UI. The current Observatory implementation treats technician/workshop resources as planning-horizon capacity budgets rather than an execution schedule.

## Compute bounds

Planner settings explicitly bound `maxCandidates`, `maxSearchNodes`, `maxSolveTimeMs`, `beamWidth`, `simulationSamples`, deterministic `seed` and Pareto `epsilon`. The expensive uncertainty simulation therefore runs only on the retained feasible candidate set, not on the raw combinatorial action space.

## Baselines

Every run also evaluates three independent heuristics under the same uncertainty model:

- FIFO by fault arrival/id order;
- capability-criticality by expected capability gain;
- greedy readiness by expected gain per estimated resource cost.

Baselines are comparison evidence and do not influence the Pareto optimizer.

## QDIP advantage evidence

The Observatory surfaces a `QDIP Advantage` block only when the strongest retained Pareto scenario materially improves on the strongest heuristic baseline. It reports the delta in demand-satisfaction probability, expected readiness and capability shortfall. This keeps the demo focused on measurable decision value rather than optimizer complexity.

The `CAPABILITY_RESCUE` stress case is the explicit non-obvious-path demonstration. A critical capability cannot be restored by FIFO, capability-criticality or greedy repair ordering because the two required repairs depend on a part with zero stock. QDIP can retain a donor-cannibalization branch, produce two units of the missing part and unlock both capability-critical repairs before the deadline. The scenario is covered by a test that requires a material probability advantage over all three baselines.

## Observatory API

The demo exposes:

- `POST /readiness/scenarios`
- `GET /readiness/scenarios/:id`
- `POST /readiness/scenarios/:id/recalculate`
- `GET /readiness/scenarios/:id/frontier`

The route is independent of SAP contracts. The current `ReadinessScenarioRepository` adapter is intentionally process-local because Observatory has no durable scenario database. It is suitable for the interactive demo only; a durable repository must replace it before these GET endpoints are used as a production persistence contract.

## Synthetic evaluation data

`demo-data.ts` generates 100 assets across eight asset types, five capabilities, 25 standard part types and six technician skill groups, with 30 failed/degraded assets in the base data set. Seven presets exercise balanced trade-offs, a scarce spare part, a low-success critical repair, cannibalization, deadline pressure, a capability-demand shift and the capability-rescue QDIP-advantage case.

## Non-goals

This implementation deliberately excludes SAP integration, work-order management, warehouse management, predictive-maintenance ML, automatic fault diagnosis, technician dispatch, automatic plan execution and reinforcement learning.
