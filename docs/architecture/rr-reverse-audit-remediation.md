# RR Observatory reverse audit: corrective implementation

This document concerns PR #228 in the renamed canonical repo `qdip-ai/qdip-web` (previously `mentality-prj/dip-observatory`). Target branch: `dev`.

## Critical change since the first UX reverse audit

The canonical `/readiness-recovery` application now uses `ReadinessRecoveryKernelWorkspace`, which mounts only the authenticated Kernel reference operator. The incompatible asset/capability Monte Carlo route `/readiness/scenarios` is HTTP 410 (both GET and POST). This is a **different current architecture** from the one audited immediately after PR #226.

The former React `ReadinessRecoveryWorkspace` was still present as an unused, broken legacy module even after the public HTTP route was retired. This PR makes the historical export a **Kernel-only compatibility alias**; it does not restore the separate solver or convert incompatible stochastic inputs.

## Reverse findings mapped to corrective code

| Finding                                                 | Corrective treatment                                                                                                                                                                                                                                          | Verification                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| B1: simulated result exported with original constraints | Retire stale Monte Carlo workspace entirely; Kernel operator uses typed normalized execution requests and only server-produced execution IDs. Kernel history export pins the decision head across pagination.                                                 | Kernel preflight and history E2E; no public legacy route |
| B2: stale HTTP response across scenario/import switches | Generation-guarded async Kernel operations, AbortController cancellation on input/ID edits, logout/unmount, epoch checks before committing state. Async file import also uses a monotonically increasing generation.                                          | New race-unit and browser tests                          |
| B3: public process-local scenario map                   | HTTP 410 for all anonymous legacy RR scenario reads/writes. Canonical Kernel route requires operator session, origin and server-side scoped DIP API key; no public result cache.                                                                              | Kernel auth negative E2E; public GET/POST 410            |
| B4: non-equivalent solver in product RR                 | Explicit **single Kernel solver**; no mapping or fallback to stochastic asset/capability algorithms. No change to frozen Kernel v1.                                                                                                                           | Routing contract and Kernel-only browser check           |
| H1: unclear decision workflow                           | Preflight display of explicit input IDs and record counts; restricted execute → replan → durable evidence/history/replay. No client-side execution of work orders.                                                                                            | Preflight and browser checks                             |
| H2: incomplete negative states                          | Distinct HTTP status taxonomy (authorization, access, invalid input, conflict/stale, unsupported, backend unavailable) and fail-closed session expiry. **Kernel does not expose a supported general INFEASIBLE status in the browser here**; do not infer it. | Negative classification tests                            |
| H3: missing evidence lineage                            | Bounded Kernel response renderer shows backend execution/decision IDs, snapshot when available, status and schedule; unknown values explicitly unrecorded. Head-pinned history export produces a full JSON file only after `export_complete=true`.            | Evidence parser tests                                    |
| H4: overclaimed QDIP benchmark edge                     | Legacy local `QdipAdvantage` component no longer mounted in canonical RR path; product shows Kernel-native authoritative outputs only. Research files retained for audit; no false superiority claim.                                                         | Kernel-only route test                                   |
| H5: inert personalization                               | Kernel-specific density and panel ordering now alter the live interface and persist only a fixed presentation schema (no user data or credentials).                                                                                                           | Settings unit and reload E2E                             |
| H6: inadequate regression targets                       | Add Vitest and Playwright checks for retired endpoints, localization, isolated requests, invalid normalized JSON, evidence, and safe preferences.                                                                                                             | Canonical CI per PR SHA                                  |

## Security and qualification limits

1. The reference operator is **single-organization with shared operator password**, not OIDC or multiple independent tenants. A full production tenant model remains a separate backend release gate; do not mark it qualified here.
2. The browser does not attest Kernel algorithmic optimality, statistical superiority or field performance. A backend `actionable` flag is displayed as Kernel-reported evidence, **not** permission to issue real-world orders.
3. Input preflight checks **structure and identity**, not semantic feasibility. Backend Kernel is the decision authority.
4. No independent external integration or full authenticated database E2E is certified by public CI without the isolated backend and credentials. Credential-free browser tests assert denial/fail-closed behavior.
5. Existing QDIP product roadmap #270 and RR #274 stay unchanged. Never use local Docker or assume private-core GitHub Actions minutes are available.

## Merge acceptance

Only consider this PR code-qualified after the current SHA has passed lint, formatting, typecheck, full unit/component suite, production build and browser E2E; full backend product qualification is a separate gate.
