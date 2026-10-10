# RR Observatory ↔ Kernel: preliminary authority and semantic mapping (UX-01)

Issue: https://github.com/mentality-prj/dip-observatory/issues/223
Parent product stage: https://github.com/mentality-prj/dzvin-intelligence-platform/issues/274
Status: **SINGLE CANONICAL KERNEL AUTHORITY IN MAIN RR UI / REFERENCE OPERATOR ONLY / PRODUCT NOT QUALIFIED**.

## 2026-10-10 — single-solver execution policy

- The canonical `/readiness-recovery` workspace now mounts only the authenticated RR Kernel reference operator. It never imports or executes the local TypeScript candidate generator, Monte Carlo sampler or Pareto comparator.
- The incompatible former public route `POST /readiness/scenarios` (and all subpaths, including recalculate) is retired with HTTP `410` and a structured code `RR_LEGACY_SOLVER_RETIRED`. It has no fallback to the local solver.
- Old TypeScript scenario-research source files remain in the codebase for audit/regression work only; they are **not accessible as product RR calculations**. Never present a Monte Carlo probability as a CP-SAT optimization result or translate unsupported asset/capability variables into job scheduling silently.
- The reference operator requires `RR_REFERENCE_OPERATOR_ENABLED=true`, strong server-only credentials and a scoped DIP API key. Without explicit configuration, the UI shows `Kernel RR operator unavailable` and provides **no alternative solver**.
- This is a restricted, single-organization reference access path (shared password), **not production OIDC or general commercial acceptance**. Operator execution/replan/history/replay are server-backed; there is no browser-side production `Apply` action.
- Future feature parity (asset/capability semantics, stochastic uncertainty, Pareto) requires new explicitly versioned Kernel-owned domain contracts; it must not revive an incompatible second scheduler in the user-facing RR UI.

---

Historical incompatibility audit retained below for context. Earlier statements that the public Monte Carlo solver is available are superseded by the policy above.
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
