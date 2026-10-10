# ADR: Observatory public sandbox + OAuth/OIDC protected workspace

**Status:** APPROVED PRODUCT DIRECTION / IMPLEMENTATION PENDING.
**Supersedes:** the shared-password `RR_OPERATOR_PASSWORD` reference-operator
authentication currently staged in this unmerged feature branch. Do not deploy
or qualify password-based operator access as the final Observatory model.

## Only two user-visible access modes

| Capability | Public anonymous | Authenticated with OAuth/OIDC |
|---|---|---|
| Browse Observatory and plugin capabilities | Yes | Yes |
| Execute approved sandbox plugins on synthetic fixtures | Yes, bounded | Yes |
| Import own normalized data for a temporary trial | **Yes, without login** | Yes |
| Tune demo parameters, compare candidate results | Yes, transient | Yes |
| Inspect tutorial explanations | Yes | Yes |
| Use personal/private workspace | No | Yes, per-subject/tenant policy |
| Store decisions, history, audit and replay | No | Yes, scoped to authorized owner/org |
| Import own data for **transient** bounded evaluation | **Yes** (client-controlled, authorized, no retention by default) | Yes |
| Persist own data, private models or durable Kernel executions | No | Yes, subject to consent and scoped safeguards |
| Learn an ephemeral model from submitted labeled outcomes | Optional, session-only | Optional, private per tenant |
| Contribute data to a QDIP-wide ML model | No, not automatically | Separate explicit opt-in (not part of login consent) |
| Export privately stored evidence | No | Yes, owner/org scoped |
| Register arbitrary plugins, org administration, billing | No | Only if separately granted inside authenticated mode |

The public mode does not create a QDIP tenant or durable Mongo execution. No
shared administrative credential may stand in for a public user. Guest execution
must use an explicit sandbox-only service boundary with dedicated quotas,
allowlisted plugins, bounded datasets, no external side effects and short-lived
results. The public demo can accept customer-provided **real** data only when the
uploader is authorized to use those data and the input meets explicit safety,
classification, size and purpose constraints. Default to local browser-side
parsing, redaction and schema mapping. If backend calculation is necessary,
transfer over TLS with explicit disclosure, keep raw bytes in ephemeral memory,
no persistent database/worker job/logs/object-store snapshots and short TTL;
return the result only to the caller. Never promise absolute zero retention
without verifying infrastructure error logs, telemetry, traces and backups.
Do not infer that the dataset is non-sensitive from an anonymous session.
Block sensitive regulated/confidential/identifiable data unless appropriate
processing terms and protected mode are configured. Do not persist uploaded
content or authenticate guests implicitly as the demo's owner.

## Customer-owned test data and optional ML improvement (revised 2026-10-10)

The public import and sandbox execution **must work without OAuth** for normal
customer-provided datasets after local redaction and strict type/size validation.
This revises the earlier "synthetic only" rule; synthetic fixtures remain the
safest initial defaults. A real customer dataset may contain protected IP,
confidential operational information or personal data. Anonymous access does
not create a legal right to process, store, share or train on that content.

### Two separate user permissions

1. **Analyze my file now.** Allows the bounded, disclosed data processing
   strictly required to produce a one-off response. By default: transient
   processing, no durable execution, no central dataset accumulation, no
   training of a cross-customer model.
2. **Improve models with my data.** A distinct, clearly worded, initially
   unchecked opt-in. Specify what is retained, whether only derived/aggregated
   statistics or raw training rows are retained, how long, how permissions
   are withdrawn and whether customer models remain tenant-only. Training
   use must respect the actual legal basis, data rights and contractual scope;
   checkbox permission is not a substitute for GDPR compliance.

Users who want to keep their training history and continue improving their own
model should authenticate via OIDC into an owner/org-scoped private workspace.
Guest users can try session-only ML on their own data, but neither persistent
identity nor cross-session training is implied.

### Train predictions and uncertainty, not the Kernel optimizer

Keep frozen Kernel v1 plus deterministic feasibility, CP-SAT/MILP and
decision authority. RR ML is a plugin/component predicting inputs and outcome
distributions, including:
- Job duration / time-to-recovery from comparable completed actions
- Repair success probability from actual outcomes and operating context
- Parts or technician availability/delay and failure risk
- Resource costs, outcome effects and calibration of uncertainty

Prediction models must distinguish **observed realized outcomes** from
uploaded forecasts, heuristic guesses, counterfactual plans and synthetic
fixtures. Repeated optimizer outputs are not ground-truth labels. Record
timestamp, input-schema/version, decision, predicted probabilities,
selected action, realized result, censoring/missing outcomes, provenance
and explicit training permissions where lawful. Without actual outcomes,
the model has no verified predictive learning signal; show `INSUFFICIENT_DATA`
and use a documented prior/baseline instead of claiming improvement.

A practical first ML candidate is a hierarchical Beta/Binomial success-rate
estimator with uncertainty intervals plus a regularized duration model;
move to gradient boosting or survival models only if sufficient reliable
labeled samples and an independent holdout justify greater complexity.
Evaluate with time/tenant-separated out-of-sample tests, probability
calibration (Brier score), duration MAE, decision regret and sensitivity to
data leakage. Improve solver decisions through calibrated parameters and
scenario samples; never let a predictor bypass hard constraints.

### Prevent customer-data contamination

`tenant-only` is the default for private learning. Pooling signals across
clients for a general QDIP model is a **separate optional program**: explicit
legal/contractual entitlement, ownership checks, minimum group sizes,
de-identification assessment, retention/deletion controls, contribution
accounting, and defenses against memorization or reconstruction. Metadata
and trained weights are not automatically anonymous. No raw cross-customer
training based solely on importing a file or signing in via OAuth.

### Feature gates before exposing real customer uploads

- Allowlisted safe RR schema and supported civilian/business use cases;
  refuse unauthorized sensitive/confidential/identifiable or high-risk exports
  where the public environment lacks adequate protections
- In-browser preview, schema validation and explicit disclosure if raw data
  leave the browser; bounded sandbox job limits, no external actions
- Independent tests for no shared cache/log/bucket retention, anonymous
  isolation, request abuse, cancellation, deletion and capacity limits
- Optional learning only from reliable realized outcomes with provenance,
  separate permissions, per-tenant isolation and uncertainty-aware baselines
- Signed-off data-use terms and real processing/retention policy
- Separate comparison of learned RR predictions and **held-out decisions**
  against simple heuristics; claim an advantage only on reproducible evidence

This section defines new product requirements. **Anonymous private-input
sandboxing, per-client ML learning, cross-client pooling and related consent
flows are not implemented or qualified by this ADR.**

## OAuth only: identity delegated, authorization stays with QDIP

Use **ZITADEL OIDC** as the single issuer / federation broker; social providers
Google, GitHub and optionally Microsoft are configured there. Disable local
password, password reset and account registration forms for Observatory.
Implementation should use a supported/auth-maintained Next.js integration for
**Authorization Code + PKCE**, state, nonce, issuer/audience/JWKS checks, secure
HTTP-only sessions and exact registered redirect URIs. No hand-written OAuth
callback, unsigned identity header or secret in the browser.

OIDC identifies a user by a stable `(issuer, sub)` pair. Do not use display
names or email domains as tenant authority. Logged-in users begin with their
own isolated private workspace; membership and `decisions:execute`,
`decisions:read`, `audit:read`, export and admin rights remain separate
per-resource authorization checks. Organization membership must be granted,
verified and revoked explicitly. Never infer a third-party org grant simply
from a valid ID token.

**Backend transition is required.** Current RR API authorization resolves
`x-api-key` through `app/core/tenant/resolver.py`; a static shared
`DIP_API_KEY` grants the same server-side organization identity to all requests.
OAuth login at the UI alone does **not** fix cross-user isolation. Add either:
- validated per-user/per-org OIDC access-token verification at backend boundary,
  mapping only verified claims + current entitlements into tenant-scoped
  `TenantContext`, **or**
- a reviewed token-exchange/delegation service which issues short-lived,
  owner/org-scoped capabilities and verifies user membership for each call.

A generic server-wide `DIP_ADMIN_API_KEY` or `DIP_API_KEY` must never be reused
for all signed-in users. Kernel v1 remains frozen; auth integration belongs in
API/tenant middleware and Observatory server routes.

## Minimize the data you collect

Avoid local passwords and password hashes, and avoid storing email/profile
details unless a defined feature requires them. Use the provider's pseudonymous
subject identifier for access binding. Log only synthetic/opaque execution IDs,
bounded status and non-sensitive telemetry. Support retention/deletion,
non-sensitive public demos, encryption at rest/in transit, strict tenant filters,
and redaction. Revoke access on org membership changes; token validity does
not override revoked grants.

OAuth transfers password management/MFA to the identity provider; it **does
not transfer** responsibility for protecting content, user identifiers, cloud
execution logs, data in QDIP MongoDB, access control, or applicable GDPR duties.
If the requirement is *zero user-data hosting*, put private input/output in
user-owned infrastructure and keep the platform stateless instead of promising
a waiver via OAuth.

## Acceptance (no false PASS)

1. Public browser accesses catalog, runs approved synthetic plugins, imports
   permitted own normalized data and changes parameters without login or
   server-side saved state. Verify transient-data boundaries and zero cross-user
   disclosure; sensitive uploads must be rejected when protections are absent.
   Attempts to read/export/modify private RR executions return 401/403.
2. Login requires an actual ZITADEL-issued OIDC authentication response;
   invalid state/nonce/issuer/audience/signature, expired or replayed tokens,
   and unapproved providers fail closed; no password login remains available.
3. Two distinct social accounts cannot see each other's workspaces or histories.
   Joining an org requires a verified grant and revocation immediately denies
   subsequent requests. A valid login is *not* admin permission.
4. Anonymous rate limit, allowlist and resource budget block adversarial
   queries and arbitrary plugins. No privileged key or raw subject token leaks
   to the browser/response/log.
5. A real browser→OIDC→server→Kernel→Mongo create/replan/history/export/replay
   journey passes under separate, explicitly authorized tenants; both success
   and denial branches are run (not skipped).
6. Provide actual pinned backend/frontend test, security and recovery evidence
   before closing RR-PROD-03/05 or marking #274 qualified.

**Implementation sequence:** public bounded own-data import with privacy/trust controls; add explicit tenant-only ML feedback and training contracts; delete shared-password operator scheme and its
process-local throttle; wire ZITADEL OIDC session through an audited Next.js
library; add per-user backend tenant delegation (not global API key); expose
anonymous sandbox endpoints separately; enforce the capability matrix server
side; replace password-E2E with OAuth-controlled end-to-end acceptance.

External IdP application/client credentials, redirect URIs, organization policy
and test accounts must be configured in the chosen identity provider before a
real OAuth flow can be exercised. Until then this is a specification, not
implemented/qualified OAuth.
