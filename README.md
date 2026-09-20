# QDIP Platform

One Next.js application serving the QDIP product family:

| Host | Surface | Internal route |
| --- | --- | --- |
| `qdip.ai` | Product and platform site | `/` |
| `studio.qdip.ai` | Decision configuration | `/studio` |
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

The public Describe your decision form is delivered server-side through the official Gmail API. Configure these server-only variables in local `.env` and in the production secret store:

- `GMAIL_CLIENT_ID` — Google OAuth client ID
- `GMAIL_CLIENT_SECRET` — Google OAuth client secret
- `GMAIL_REFRESH_TOKEN` — refresh token for the sending mailbox
- `GMAIL_FROM` — authorized Gmail sender address
- `QDIP_LEAD_MAILBOX` — mailbox that receives QDIP decision inquiries

Manual Google setup is required: enable Gmail API in the Google Cloud project, configure the OAuth consent/client, authorize the sending mailbox with the `https://www.googleapis.com/auth/gmail.send` scope, obtain a refresh token, and add the values above to the deployment environment. Never expose these values through `NEXT_PUBLIC_*` variables or commit them to the repository.

The public gas forecasting workspace is available at `/en/gas-forecast` and `/pl/gas-forecast`. See `docs/decision-studio.md` for its setup and tests.

## Deployment

Assign `qdip.ai`, `studio.qdip.ai`, and `observatory.qdip.ai` to the same deployment. The application selects the correct surface from the request host; no separate build is required. Configure the three DNS records according to the hosting provider and set the backend and Gmail environment variables above.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

New work must use a feature branch; see `CONTRIBUTING.md`.
