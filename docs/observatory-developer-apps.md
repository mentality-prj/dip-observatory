# QDIP Developer Applications — VHV connection

## Admin workflow

Visit `https://observatory.qdip.ai/uk/admin/apps` after the Observatory
release. Sign in with the existing Zitadel `observatory_admin` role.

Select **Create VHV keys**. This is a privileged QDIP bootstrap, not a
public unauthenticated API. The server uses the existing server-only Core
administrator connection, never exposes that platform credential, and
creates/reuses a QDIP-internal application isolation record. VHV does not
have its own organizations.

The one-time response contains **two** identities with an explicit
`allowed_capabilities: ["secretary.plan"]` policy, verified by Core
create-response and persisted readback:

| Role              | Scopes                            | Railway target                   | Variable              |
| ----------------- | --------------------------------- | -------------------------------- | --------------------- |
| VHV application   | `plugins:read`, `plugins:execute` | `@secretary/api`                 | `QDIP_API_KEY`        |
| Python SDK Worker | `plugins:register`                | `vhv-qdip-secretary-plan-worker` | `QDIP_REMOTE_API_KEY` |

The existing `QDIP_API_URL` and `QDIP_REMOTE_URL` remain as the HTTPS and
WSS endpoints respectively. The application credential is only consumed by
the **server-side** `@qdip/client@0.1.2` within NestJS; the Worker uses the
independent Python SDK-02. No `QDIP_READ_API_KEY`, root admin key, new
Gateway, or frontend key is needed.

The admin must save both secret values when displayed. This flow intentionally
does not pass browser-held secrets to an untrusted Railway URL, store them in
Web cookies, localStorage, server logs, GitHub, or source control. Never use
the QDIP platform root key in VHV.

## Register and publish

1. Deploy Core #384 capability-scoped authentication **before** creating
   credentials. On an older Core, this UI refuses to release unrestricted
   credentials and attempts to revoke them.
2. Save the two generated values into the specified Railway services.
   Apply the prepared exact-SHA VHV Nest + Worker build once, with the Worker
   using a real `wss://.../api/v1/remote-plugins/connect` endpoint.
3. Verify the Python SDK Worker registered `secretary.plan` in the same
   internal tenant as the VHV application credential.
4. Open `/uk/admin/plugins`. Choose the automatically SDK-registered
   `secretary` entry. Fill title, description, category and publish. The
   Observatory admin screen **does not create fake registry entries** and
   never registers a plugin without its SDK Worker.
5. Confirm the public `/uk/plugins/secretary` catalog page is accessible.
   Publication is separate from runtime execution authorization.
6. Complete the authenticated Zitadel → NestJS → QDIP SDK → Gateway → Python
   Worker → Kernel → PostgreSQL proposal + approval scenario. Verify
   tenant denial and absence of Google Calendar side effects before
   merging the remaining VHV release PR.

## Failure and recovery

- Missing Core admin credential: Core errors return generic 502/503.
- Missing policy support: credentials fail strict readback and are not
  displayed; new IDs are revoked when possible.
- Partial issuance: attempt revocation of every newly issued key. If
  revocation cannot be confirmed, return a blocking error and reconcile
  active key IDs before retrying.
- A second issuance creates new keys but does not revoke existing deployed
  credentials automatically. Rotate old credentials only after verified E2E.
- No production status should be claimed based only on a green unit test,
  successful creation response, or a published metadata record.

The admin page is currently an internal bootstrap interface; broader
developer self-service registration and app ownership remain future work.
