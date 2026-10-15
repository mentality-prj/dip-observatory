# Observatory plugin administration — P0 (#254)

**Route:** `https://observatory.qdip.ai/uk/admin/plugins` (also en/pl).
Existing Design System and Observatory shell; no Marketplace, new SDK/Gateway,
organization selection, end-user API keys, code upload or Worker auto-deployment.

## Architecture

Verified Zitadel `observatory_admin` project role -> signed QDIP session ->
same-origin Observatory Web API -> existing QDIP Core `/api/v1/plugin-publications`
(platform-admin key, server-only) -> installed PluginRegistry + MongoDB
publication metadata/audit. The browser never receives an infrastructure key.
The Core endpoint **cannot install or execute code**.

Only already compiled `src/use-cases/registry.ts` application routes with an
installed, enabled and matching Core capability can be published. Existing
public demos retain their old visibility until explicitly unpublished; new
applications must be approved/published. Public catalog only receives visible
use-case IDs. Missing Core publication API fails closed for use-case listings;
system challenges/intake remain available. Merely showing a card never grants
execution rights.

## Deployment order (not yet performed)

1. Deploy/review the **Core dependency PR #382** first, using the existing
   MongoDB and Core service. Production routes remain unchanged until then.
2. Configure Zitadel's existing QDIP project to issue the dedicated
   `observatory_admin` role to the actual owner; a normal `studio` or
   `rr_operator` role is **not** enough. Default role key can be overridden
   with `QDIP_OBSERVATORY_ADMIN_ZITADEL_ROLE_KEY`. No VHV organization.
3. Ensure the QDIP Web server has `DIP_API_BASE_URL` and a server-only
   platform-admin `DIP_ADMIN_API_KEY` (or the existing `DIP_API_KEY` if it
   actually has platform-admin rights). Do not expose it as `NEXT_PUBLIC_*`.
4. Deploy/review the Web PR against the deployed Core endpoint. Verify real
   Zitadel owner access, published/disabled catalog changes and negative
   unauthenticated/non-admin/cross-origin requests before promotion.
5. Backend `plugin_publications` and `plugin_publication_audit` need a
   MongoDB deployment supporting transactions (replica set); failed storage
   writes return 503, not an optimistic success.

P0 **does not** provision a Python Worker or issue register/execute credentials.
Workers still connect through the existing SDK-02 Gateway. The admin web UI
manages publication only, not runtime deployment.
