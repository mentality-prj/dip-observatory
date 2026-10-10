# RR reference operator mode — separate from the public Observatory demo

**Status:** implementation branch only, **not product-accepted**. No second PR is
opened while QDIP backend PR #325 is active. Kernel v1 stays frozen.

## Semantic boundary

- Public `/uk/readiness-recovery` (and other locales) retains the existing
  asset/capability/stochastic Pareto demonstrator, the
  `readiness-recovery.v1` contract and the process-local demo planner.
- The **Production RR — Kernel-backed operator** section on that same page is a
  separate, opt-in, single-organization reference workflow. It only accepts
  the backend's **exact** `ReadinessRecoveryInitialExecutionRequest` and
  `ReadinessRecoveryReplanRequest` JSON. **There is no inferred mapping** from
  assets/capabilities to jobs/technicians/slots, and no Pareto result is
  presented as a Kernel result.
- Kernel results, persisted Mongo lineage, head, audit, replay and exports are
  obtained only via the authenticated RR backend. No browser-side `Map` is
  used for production runs. API-key secrets stay server-side.

## Configuration

Set **server-side** environment values:

```dotenv
DIP_API_BASE_URL=http://127.0.0.1:8000
DIP_API_KEY=<org-scoped-key-with-decisions-execute-decisions-read-audit-read>
RR_OPERATOR_PASSWORD=<unique-random-secret-at-least-16-characters>
RR_OPERATOR_SESSION_SECRET=<independent-random-secret-at-least-32-characters>
```

Never use a platform-admin key for the reference operator; backend RR endpoints
require an org-scoped key. In actual public deployment use HTTPS for both
frontend and backend, an upstream brute-force/rate limit, protected secrets and
a separately reviewed identity layer. This password-session boundary is a
**single-organization reference**, not multi-tenant SSO, session revocation
per user or enterprise RBAC. It does not authorize real customer data.

Auth is opt-in and fails closed if any required environment value is missing.
Mutations require the exact same origin. Session is HMAC-signed, expires in
eight hours, uses an HttpOnly SameSite=Strict cookie and is not stored in local
storage. HTTP is rejected except on the localhost development namespace.
The operator password is never written to the browser's storage and the
privileged QDIP API key is never returned in a response.

## Exact civil reference request

From the backend checkout, generate the synthetic fixture and local validated
API request using `reference_fixture` and `source_import` as documented in
`docs/plugins/rr-reference-product.md`. Paste the generated request JSON
into the authenticated operator panel. For replanning, supply a *new*
execution ID, explicit change ID/kind/reason/requested_at and changed payload.
History/export/replay use durable backend records, not the public demo's
in-memory state. API errors are surfaced without fallback to demo computation.

## Local regression and independent acceptance

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`e2e/rr-production-operator.spec.ts` always checks unauthorized access (or
configured-off status). A live positive production journey is **skipped**
unless both `RR_E2E_OPERATOR_PASSWORD` and
`RR_E2E_API_REQUEST_PATH` are provided and an isolated, authorized RR
backend/MongoDB is running:

```bash
RR_E2E_OPERATOR_PASSWORD="<operator-password>" \
RR_E2E_API_REQUEST_PATH="/absolute/path/to/civil-api-request.json" \
pnpm test:e2e
```

The test creates a unique invented civil decision, overrides an invented
service job, checks complete durable history/integrity and replay, and
denies access after logout. An operator must also review exported pages
with pinned head semantics. Do not claim a PASS from a skipped test.

### Outstanding before production qualification

- Run pinned backend+frontend builds and local full-regression suites.
- Run isolated real Mongo RR dump/drop/restore plus drift/recovery drills.
- Measure workload latency/resource ceilings, reject over-budget cases.
- Prove 401/403/404 permission and cross-tenant behavior at live HTTP.
- Review upstream auth/rate-limit, HTTPS, logs, backup policy, RTO/RPO and
  sign off #274 with actual evidence. Customer acceptance is not required.
