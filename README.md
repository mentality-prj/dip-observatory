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
