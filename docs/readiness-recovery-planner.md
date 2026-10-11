# Readiness Recovery — Kernel-only frontend

**Current architecture:** The `qdip-web` application does not run any RR solver, stochastic simulation, Pareto search, benchmark, score calculation or Test A ledger mutation.

- Canonical RR workspace: `src/use-cases/readiness-recovery/kernel-workspace.tsx`.
- Authenticated UI and display-only state: `production-operator-panel.tsx`.
- Strict server proxy: `/api/rr-operator/kernel/[...path]` with an allowlisted, org-scoped `qdip-core` API key.
- Authoritative source of scheduling/optimization: `qdip-core/app/plugins/readiness_recovery`.
- Plugin computes preflight domain counts and payload digest, domain schema/admission, execution results, provenance/evidence presentation, semantic replay, and complete-history verification.
- The obsolete `readiness-recovery.v1` asset/capability TypeScript solver is **retired**, not silently treated as equivalent to `readiness-recovery-runtime.v1`. Every `/readiness/scenarios` endpoint returns HTTP 410.
- Deprecated TS Monte Carlo/Pareto/heuristic research source is retained in Git history of PRs prior to this migration, not as deployable web code. A separate unexposed Python research-math module in the RR plugin carries bounded distribution/Monte Carlo/Pareto primitives. This research module is **not** a production scheduler or parity-certified port of the historical planner.

## Operational request sequence

1. User supplies the unchanged normalized Kernel RR JSON request.
2. UI passes JSON to `POST /api/rr-operator/kernel/preflight`; **only the plugin** validates the RR domain and computes counts. If this server endpoint is absent or rejects the request, submission is disabled.
3. UI submits the unchanged JSON to `POST /api/rr-operator/kernel/executions` (or replan). Frozen RR Kernel computes the decision; web does not calculate risk, readiness, optimization objective or estimated utility.
4. After execution, UI requests `GET /api/rr-operator/kernel/executions/:id/presentation`. The typed server projection determines outcome kind, authority, provenance and scheduled jobs; browser renders only that projection.
5. Full history export requests `GET /api/rr-operator/kernel/decisions/:id/history/verified-export-page` and follows its server-issued cursor. Every page is independently chain-verified, head-bound and bound to a digest of **every serialized execution record**, with an upstream size limit below the proxy's 4 MiB ceiling. The browser only assembles and downloads transport pages; it never certifies the chain itself. Oversized snapshots (24 MB admission ceiling) fail closed with HTTP 413. Failures are not converted to successful exports.

Deployment sequence: **core plugin routes must be deployed before enabling the web UI changes**. Until then, the preflight fails closed; this is not a fallback to browser calculations. Shared-password reference access still requires separate full production identity and tenant qualification.

See `docs/architecture/rr-reverse-audit-remediation.md` for reverse audit and qualifications.
