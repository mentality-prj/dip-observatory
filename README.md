# QDIP Platform

One Next.js application serving the QDIP product family:

| Host                  | Surface                          | Internal route                         |
| --------------------- | -------------------------------- | -------------------------------------- |
| `qdip.ai`             | Product and platform site        | `/`                                    |
| `studio.qdip.ai`      | Decision configuration           | `/studio`                              |
| `observatory.qdip.ai` | Demonstrators and decision audit | `/en`, `/pl`, `/observatory/decisions` |

Host-based rewrites live in `src/proxy.ts`. During local development, Studio remains available at `/studio` and Observatory at `/en`.
The marketing site is localized at `/en`, `/uk`, and `/pl`; these paths are rewritten to the internal `/platform/[locale]` route only on the main `qdip.ai` host.

## Local development

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Decision Studio is at `/studio`; the default Observatory is at `/en`.

## Environment

Platform URLs have production-safe defaults and can be overridden:

- `NEXT_PUBLIC_SITE_URL` — defaults to `https://qdip.ai`
- `NEXT_PUBLIC_STUDIO_URL` — defaults to `https://studio.qdip.ai` in production
- `NEXT_PUBLIC_OBSERVATORY_URL` — defaults to `https://observatory.qdip.ai` in production

Backend integration uses:

- `DIP_API_BASE_URL` — DIP backend base URL
- `DIP_API_KEY` — API key for Observatory and futures requests
- `DIP_GAS_FORECAST_CAPABILITY_PATH` — optional gas-provider capability path
- `DIP_GAS_FORECAST_EXPERIMENT_CAPABILITY_PATH` — optional forecasting-engine capability path

### Decision inquiry email delivery

The public Describe your decision form is delivered server-side through authenticated Zoho Mail SMTP. Configure these server-only variables in local `.env` and in the production secret store:

- `ZOHO_SMTP_USER` — Zoho mailbox used as both sender and recipient, e.g. `hello@qdip.ai`
- `ZOHO_SMTP_PASSWORD` — Zoho app password for that mailbox
- `ZOHO_SMTP_HOST` — optional; defaults to `smtp.zoho.com`. Override it if the Zoho Admin Console assigns a data-center-specific SMTP hostname.
- `ZOHO_SMTP_PORT` — optional; defaults to `465` using implicit TLS/SSL.

The SMTP connection is created only from the Node.js server route. Credentials are never exposed through `NEXT_PUBLIC_*` variables or sent to the browser. The visitor email is used only as the validated `Reply-To`; the authenticated Zoho mailbox remains both the `From` and delivery address.

Zoho supports authenticated SMTP over SSL on port 465. If the account uses a data-center-specific SMTP hostname, use the exact value shown in the Zoho Mail account/Admin Console rather than changing application code.

The public gas forecasting workspace is available at `/en/gas-forecast` and `/pl/gas-forecast`. See `docs/decision-studio.md` for its setup and tests.

## Deployment

Assign `qdip.ai`, `studio.qdip.ai`, and `observatory.qdip.ai` to the same deployment. The application selects the correct surface from the request host; no separate build is required. Configure the three DNS records according to the hosting provider and set the backend and Zoho SMTP environment variables above.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

New work must use a feature branch; see `CONTRIBUTING.md`.
