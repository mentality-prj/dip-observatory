# ADR: Observatory public sandbox + OAuth/OIDC protected workspace

**Status:** APPROVED PRODUCT DIRECTION / IMPLEMENTATION PENDING.
**Supersedes:** the shared-password `RR_OPERATOR_PASSWORD` reference-operator
authentication currently staged in this unmerged feature branch. Do not deploy
or qualify password-based operator access as the final Observatory model.

## Only two user-visible access modes

| Capability | Public anonymous | Authenticated with OAuth/OIDC |
|---|---|---|
| Browse Observatory and plugin capabilities | Yes | Yes |
| Execute approved sandbox plugins on **synthetic** fixtures | Yes, bounded | Yes |
| Tune demo parameters, compare candidate results | Yes, transient | Yes |
| Inspect tutorial explanations | Yes | Yes |
| Use personal/private workspace | No | Yes, per-subject/tenant policy |
| Store decisions, history, audit and replay | No | Yes, scoped to authorized owner/org |
| Import operational data or use durable execution | No | Yes, subject to separate input safeguards |
| Export privately stored evidence | No | Yes, owner/org scoped |
| Register arbitrary plugins, org administration, billing | No | Only if separately granted inside authenticated mode |

The public mode does not create a QDIP tenant or durable Mongo execution. No
shared administrative credential may stand in for a public user. Guest execution
must use an explicit sandbox-only service boundary with dedicated quotas,
allowlisted plugins, bounded datasets, no external side effects and short-lived
results. Public demo is not a confidential processing environment. Rate limit by
provider edge and compute budget; public input should use synthetic fixtures,
not real operational exports. Do not persist visitor-supplied content or
authenticate guests implicitly as the demo's owner.

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

1. Public browser accesses catalog, runs approved synthetic plugins and
   changes demo parameters without cookies, account or server-side saved state.
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

**Implementation sequence:** delete shared-password operator scheme and its
process-local throttle; wire ZITADEL OIDC session through an audited Next.js
library; add per-user backend tenant delegation (not global API key); expose
anonymous sandbox endpoints separately; enforce the capability matrix server
side; replace password-E2E with OAuth-controlled end-to-end acceptance.

External IdP application/client credentials, redirect URIs, organization policy
and test accounts must be configured in the chosen identity provider before a
real OAuth flow can be exercised. Until then this is a specification, not
implemented/qualified OAuth.
