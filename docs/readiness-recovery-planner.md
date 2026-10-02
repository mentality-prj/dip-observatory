# Readiness Recovery Scenario Planner

## Scope

The planner is a QDIP decision-layer application. It consumes a normalized fleet state, capability demand, candidate recovery actions, resource pools and uncertainty models. It returns nondominated recovery scenarios for human comparison. It does not manage work orders, dispatch technicians, own inventory or execute the selected scenario.

External systems (SAP, CMMS, CSV feeds or other APIs) terminate at the normalized `ReadinessRecoveryInput` boundary. The core planner has no dependency on SAP, Next.js, React or a storage implementation.

## Capability model

Operational value is represented by `CapabilityDemand` and `AssetCapabilityContribution`, not by an arbitrary asset-importance score. Contributions support quantity, quality, validity windows, capability dependencies and substitution declarations. A degraded asset contributes according to its current reliability; a recovered asset contributes according to the sampled resulting reliability when the action completes before the relevant demand deadline.

## Optimization pipeline

1. Candidate recovery actions are grouped per impaired asset.
2. `OptimizationBackend` generates a bounded structurally feasible candidate set.
3. `BoundedFeasibilityBackend` enforces one action per asset, parts, produced parts from cannibalization, technician-hour capacity, workshop-hour capacity, replacement compatibility, action dependencies and nominal deadline feasibility.
4. Candidate retention uses several search views (readiness gain, time, parts and risk), so one arbitrary weighted score does not define the output.
5. Monte Carlo evaluation uses a deterministic seed and supports deterministic, triangular, log-normal and empirical numeric distributions plus Bernoulli repair success/repeat failure.
6. Scenarios are filtered by multi-objective epsilon dominance.
7. Human-readable scenario labels are assigned only after optimization.

`OptimizationBackend` is the solver boundary. The normalized domain contract and hard-constraint validation are independent of the candidate generator, so an exact CP-SAT/MILP temporal scheduler can replace the bounded backend without changing the domain, API or Observatory UI. The demo intentionally uses bounded search rather than adding a heavyweight solver dependency; technician/workshop resources are planning-horizon capacity budgets, not an execution schedule.

## Compute bounds and fairness

Planner settings explicitly bound `maxCandidates`, `maxSearchNodes`, `maxSolveTimeMs`, `beamWidth`, `simulationSamples`, deterministic `seed` and Pareto `epsilon`. Expensive uncertainty simulation runs only on retained feasible candidates.

Benchmark methods receive the same normalized `ReadinessRecoveryInput`, candidate action space, hard constraints, uncertainty assumptions, stochastic seed and simulation-sample budget. A baseline cannot receive extra parts, technician capacity, donor actions or relaxed deadlines. Benchmark evidence is computed from measured outputs; there is no hardcoded QDIP-win branch.

## Baselines

The standard planner evaluates:

- `FIFO` — fault/id order;
- `CRITICALITY` — expected capability gain;
- `GREEDY_READINESS` — expected gain per estimated resource cost.

The cascading benchmark suite additionally evaluates:

- `RISK_AWARE_GREEDY` — constrained gain adjusted for success, repeat-failure risk, resource cost and dependencies;
- `LOOKAHEAD_2` — constrained two-action look-ahead with dependency and capability-diversification effects.

All five are evaluated with the same uncertainty seed and sample count. The strongest feasible baseline is selected for the displayed comparison; weaker heuristics are never used merely to manufacture an advantage.

## Cascading Resource Conflict benchmark

`CASCADING_RESOURCE_CONFLICT` is the adversarial Readiness Recovery demo intended to expose portfolio effects that local ordering heuristics can miss. Its contract is regression-tested:

- 100 assets with 25–35 failed/degraded assets;
- four demanded capabilities and at least two operational deadlines;
- 20–30 shared candidate actions;
- scarce parts plus technician/workshop bottlenecks;
- donor/cannibalization dependencies available to every method;
- genuinely multi-capability assets;
- stochastic repair success, duration and repeat-failure trade-offs.

The primary metric is probability that all demanded capabilities are satisfied by their deadlines. Secondary evidence includes expected capability shortfall/readiness, recovery time, technician-hours, scarce-parts consumption and failure risk.

The benchmark runs the preregistered robustness sweep: base, deadline −10%, deadline +10%, technician capacity −20%, parts −20%, repair success −10% and repair success +10%. Each variant is recomputed; retention reports how many variants preserve a measured QDIP advantage and never assumes that an advantage must exist.

The UI exposes the strongest baseline, measured advantage kind, robustness retention/variant verdicts and generated explanation of portfolio actions the strongest heuristic omitted. Evidence can therefore classify capability advantage, efficiency advantage, parity, heuristic advantage or insufficient evidence instead of forcing a positive QDIP label.

## QDIP advantage evidence

The Observatory surfaces a `QDIP Advantage` result only when the strongest retained Pareto scenario materially improves on the strongest feasible baseline. The comparison reports demand-satisfaction probability, expected readiness, capability shortfall and efficiency deltas. When the strongest heuristic is materially better, that result is surfaced instead of suppressed.

`CAPABILITY_RESCUE` remains a smaller deterministic stress case. `CASCADING_RESOURCE_CONFLICT` is the broader combinatorial benchmark with stronger baselines and robustness testing.

## Observatory API

The demo exposes:

- `POST /readiness/scenarios`
- `GET /readiness/scenarios/:id`
- `POST /readiness/scenarios/:id/recalculate`
- `GET /readiness/scenarios/:id/frontier`

The route is independent of SAP contracts. The current `ReadinessScenarioRepository` adapter is intentionally process-local because Observatory has no durable scenario database. It is suitable for the interactive demo only; a durable repository must replace it before these GET endpoints are used as a production persistence contract.

## Synthetic evaluation data

`demo-data.ts` generates 100 assets across eight asset types, five capabilities, 25 standard part types and six technician skill groups, with 30 failed/degraded assets in the base data set. Presets exercise balanced trade-offs, scarce parts, low-success critical repairs, cannibalization, deadline pressure, demand shifts, capability rescue and cascading resource conflict.

## Non-goals

This demo deliberately excludes SAP integration, work-order management, warehouse management, predictive-maintenance ML, automatic fault diagnosis, technician dispatch, automatic plan execution, reinforcement learning and a production CP-SAT/MILP dependency. The solver boundary is compatible with a future exact backend; claiming exact temporal optimization before that backend exists would be misleading.
