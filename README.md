# QDIP Platform

One Next.js application serving the QDIP product family:

| Host                  | Surface                          | Internal route                         |
| --------------------- | -------------------------------- | -------------------------------------- |
| `qdip.ai`             | Product and platform site        | `/`                                    |
| `studio.qdip.ai`      | Decision configuration           | `/studio`                              |
| `observatory.qdip.ai` | Demonstrators and decision audit | `/en`, `/pl`, `/observatory/decisions` |

Host ownership lives in `src/routing-config.ts`. `next.config.ts` uses Next.js built-in host-conditioned `rewrites()` and `redirects()`; there is no application Proxy/middleware router.
Canonical public paths use the same `/[locale]/...` shape on every product surface. Local development mirrors production hosts through `qdip.localhost`, `studio.localhost`, and `observatory.localhost`.
Generated `*.vercel.app` preview hosts are matched only by the marketing rewrite.

## Local development

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Use the product-local hosts so local routing exercises the same host contracts as production:

- marketing: `http://qdip.localhost:3000/en`
- Studio: `http://studio.localhost:3000/en`
- Observatory: `http://observatory.localhost:3000/en`

The internal `/studio` and `/platform` paths are rewrite destinations only. Direct requests are permanently redirected to canonical public URLs by Next.js `redirects()`.

## Environment

Platform URLs have production-safe defaults and can be overridden:

- `NEXT_PUBLIC_SITE_URL` — defaults to `https://qdip.ai`
- `NEXT_PUBLIC_STUDIO_URL` — defaults to `https://studio.qdip.ai`
- `NEXT_PUBLIC_OBSERVATORY_URL` — defaults to `https://observatory.qdip.ai`

The hostname of each configured origin is automatically registered as the owner of that surface. Staging/custom domains therefore do not require a second routing configuration. A host cannot belong to more than one surface; startup fails fast if the configured origins collide.

Backend integration uses:

- `DIP_API_BASE_URL` — DIP backend base URL
- `DIP_API_KEY` — API key for server-side QDIP requests

### Decision inquiry email delivery

The public Describe your decision form is delivered server-side through authenticated Zoho Mail SMTP. Configure these server-only variables in local `.env` and in the production secret store:

- `ZOHO_SMTP_USER` — Zoho mailbox used as both sender and recipient, e.g. `hello@qdip.ai`
- `ZOHO_SMTP_PASSWORD` — Zoho app password for that mailbox
- `ZOHO_SMTP_HOST` — optional; defaults to `smtp.zoho.com`. Override it if the Zoho Admin Console assigns a data-center-specific SMTP hostname.
- `ZOHO_SMTP_PORT` — optional; defaults to `465` using implicit TLS/SSL.

The SMTP connection is created only from the Node.js server route. Credentials are never exposed through `NEXT_PUBLIC_*` variables or sent to the browser. The visitor email is used only as the validated `Reply-To`; the authenticated Zoho mailbox remains both the `From` and delivery address.

Zoho supports authenticated SMTP over SSL on port 465. If the account uses a data-center-specific SMTP hostname, use the exact value shown in the Zoho Mail account/Admin Console rather than changing application code.

## Zitadel OIDC access control

QDIP reuses the existing Zitadel instance with a separate Web Application. Use
**Authorization Code + PKCE**, client authentication `none`, issuer `ZITADEL_ISSUER`,
and client ID `ZITADEL_CLIENT_ID`. There is no client secret.

Configure the application's **exact** login redirect URI:
`https://qdip.ai/api/auth/callback/zitadel`. A single callback on the main
domain is sufficient: login sets a secure, HttpOnly session cookie scoped to
`qdip.ai` and available to `studio.qdip.ai` and `observatory.qdip.ai`.
Identity is verified from Zitadel's signed ID token (JWKS, issuer, audience,
expiry and nonce); PKCE and signed state bind the login exchange.
No Zitadel token or QDIP API key is sent to the browser.

Set `QDIP_AUTH_COOKIE_SECRET` (random 32+ chars), `QDIP_AUTH_ALLOWED_SUBJECTS`
(comma-separated exact Zitadel `sub` values), and
`QDIP_AUTH_OPERATOR_SUBJECTS` (authorized subset for RR). Access is **fail-closed**:
no allowlist, no session. Logout clears the shared session cookie; sessions
expire after 60 minutes, and removing a subject from the allowlist immediately
blocks server-side access. Legacy RR shared-password login is retired (HTTP 410).
Studio pages and its BFF API require a valid Zitadel session; RR additionally
requires the operator allowlist. Public marketing, inquiries and demonstrator
routes are intentionally kept public. An authenticated session does not grant
a new QDIP Core tenant: the existing server-only organization-scoped API key
continues to authorize Core operations.

**Security boundary:** This is a single-organization hosted BFF integration, not
yet production multi-tenant OIDC-to-Core authorization, per-user decision audit,
role binding from Zitadel project grants, or a replacement for Core API keys.
Only deploy with trusted `*.qdip.ai` subdomains and strict TLS. A shared domain
cookie is intentionally visible (as an HttpOnly cookie) to the QDIP subdomains.
Development on unrelated `*.localhost` hosts does not have cross-host SSO;
use a same-origin local callback for a single surface or test on a TLS staging
domain under `qdip.ai` after updating allowed Redirect URIs.

## Deployment

Assign `qdip.ai`, `studio.qdip.ai`, and `observatory.qdip.ai` to the same deployment. Next.js selects the surface declaratively in `next.config.ts` using host conditions; no runtime middleware/proxy or separate build is required. Configure the three DNS records according to the hosting provider and set the backend and Zoho SMTP environment variables above.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

New work must use a feature branch; see `CONTRIBUTING.md`.
