# RR Observatory ↔ Kernel: preliminary authority and semantic mapping (UX-01)

Issue: https://github.com/mentality-prj/dip-observatory/issues/223
Parent product stage: https://github.com/mentality-prj/dzvin-intelligence-platform/issues/274
Status: **INCOMPATIBLE / MAPPING NOT PROVEN / NO PRODUCTION ACTION**.
This document is an inventory of the _existing_ implementations, not a claim of interoperability or a new contract.

## Execution boundaries

| Surface       | Observatory                                                               | Kernel RR production                                                                                             | Interoperability                                   |
| ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Endpoint      | `POST /readiness/scenarios[/id/recalculate]`                              | `POST /api/v1/readiness-recovery/executions` (Kernel-backed)                                                     | Independent routes; no proven equivalent execution |
| Input version | `readiness-recovery.v1` (asset/capability data package)                   | `readiness-recovery-runtime.v1` (job scheduling contract); normalized importer is yet another preflight contract | No canonical bidirectional mapping                 |
| State         | Process-local `scenario-repository`                                       | Kernel run/execution provenance, versioned semantics and persistence requirements                                | Not equivalent or shared                           |
| Solver        | TypeScript bounded feasibility + Monte Carlo + Pareto                     | Python Kernel v1 scheduling optimization/CP-SAT/MILP                                                             | Different decision mathematics; no equivalence     |
| Result        | Multiple simulated `RecoveryScenario` alternatives + exploratory baseline | Status, objective, scheduled job slots and selected donors                                                       | No equivalent result status/action semantics       |

## Field-level semantic gaps — fail closed

| Observatory field                                                  | Potential production concept                                             | Current verdict                                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `scenarioId`, `asOf`                                               | `decision_id`, horizon version/revision                                  | IDs can be correlated only with explicit mapping; timestamp and revision semantics differ             |
| `capabilityDemand[]` quantities, reliability and deadlines         | `readiness_gain_units`, `deadline_slot`                                  | **UNSUPPORTED**: capability satisfaction / reliability distributions are not fixed job utility scores |
| `assets[]` state, capabilities, substitutions                      | `jobs[]`                                                                 | **UNSUPPORTED**: an asset is not a job, and substitutions lack matching constraints                   |
| `recoveryActions[]` stochastic durations, failure / repeat failure | `jobs[].duration_slots`, `success_probability_bps`                       | **LOSSY**: cannot silently replace time distributions and repeat failure with fixed durations         |
| `resources.technicianHours` aggregate per skill                    | `technicians[]` specific identities, skills and available discrete slots | **UNSUPPORTED** without actual individual availability and slot mapping                               |
| `resources.workshopHours` total                                    | `workshop_capacity` per slot                                             | **UNSUPPORTED** as equivalent constraint                                                              |
| `resources.spareParts`, `producedParts` / cannibalization          | `inventory[]`, `donors[]` with cost/readiness penalties                  | **PARTIAL** concept similarity, not verified semantics                                                |
| Monte Carlo `probabilityDemandSatisfied`, risk and percentiles     | Kernel `objective_value`, normalized solve status                        | **UNSUPPORTED**; probability is not solver optimality                                                 |
| `frontier` + `scenario.labels`                                     | `scheduled_jobs`, donor selection                                        | **UNSUPPORTED**: relative labels are not a user-declared utility or kernel policy                     |

## Trust policy implemented in first increment

- `/readiness/scenarios` responses are classified by the **client call site** as `OBSERVATORY_SIMULATION`; imported data does not change computation authority.
- The UI displays three independent evidence dimensions plus source: origin, computation, validation and comparative evidence. The UI cannot promote a response with fabricated fields to `KERNEL_VERIFIED`.
- Even if candidate scenarios are returned, `productionApplyEligible=false`; only review/export is possible. Production application requires a new server-owned authorization, current revision/CAS, idempotency and audit boundary, not a toggle in the UI.
- Empty frontier means `NO_COMPARABLE_CANDIDATES`, **not** formal `INFEASIBLE`. Search truncation means partial exploration, **not** proof of optimality. Any imported result is untrusted.
- The existing `QdipAdvantage` comparisons remain exploratory **Observatory vs its local heuristics**; they are not independent proof of Kernel superiority. Comparative statistical confirmation is not a product release gate (#315 optional).

## Still open before UX-01 PASS

1. Real server-side execution authority and versioned contract translation, or a domain-specific alternative with an explicit unsupported verdict. No silent guessing.
2. Negative-status taxonomy mapped to actual authoritative backend signals (INFEASIBLE, UNSUPPORTED, TIME_LIMIT, stale/partial), not guessed from a missing frontier.
3. Server authenticated tenant and permission gates, current snapshot/revision checks, idempotent operator actions, replay/audit and private-data redaction.
4. Browser/e2e tests and operator acceptance on pinned revisions; no asserted product qualification from local UI tests alone.

No Docker requirement or private-repo CI quota requirement is introduced by this work.
