# Decision Studio

Open `/studio` to configure decision profiles, dimensions, plugin output bindings,
constraints, policies and compliance. `/observatory/decisions` provides read-only decision
inspection and replay verification. The existing scenario Observatory remains available at
its locale routes and `/observatory`.

Set server-only `DIP_STUDIO_API_KEY` to an organization-scoped key. Keep the existing
`DIP_API_KEY` for other Observatory features that use a platform key. Studio falls back
to `DIP_API_KEY` only when its dedicated key is unset.
Use `DIP_STUDIO_API_BASE_URL` to select a separate Studio backend, or the existing
`DIP_API_BASE_URL`. URLs may end in `/api` or `/api/v1`; the proxy normalizes this prefix.
The backend
requires `decision-profiles:read`, `decision-profiles:write`, `decisions:execute` and
`audit:read` according to the operation. Studio keeps the key on the server, limits proxy
resources and methods, and requires same-origin mutation requests. Deployment access control
is shared with the existing application.

To provision a Studio key, a platform administrator calls
`POST /api/v1/organizations/{org_id}/keys` with the existing platform key and body
`{"name":"Decision Studio","environment":"production","scopes":["decision-profiles:read","decision-profiles:write","decisions:execute","audit:read"]}`.
Store the returned `key` directly in the frontend deployment's secret variable
`DIP_STUDIO_API_KEY`; never put it in a `NEXT_PUBLIC_*` variable or a repository.
Use the intended organization's ID, then redeploy the frontend.

Deploy the backend containing the Decision Studio routes before the frontend.
A missing collection route (404) means the backend URL or deployed version needs checking.
A 502 means the backend or its gateway did not serve the request; inspect deployment logs
and health, including MongoDB connectivity. An organization-key error means the configured
key resolved to platform scope. Changing the key requires a frontend redeploy.

Profiles and bindings persist in DIP. Every profile change requires a new version; binding
changes require a new binding version. Validation errors appear on profile cards. Drafts may
be incomplete; active profiles must pass backend validation. JSON Schema generates dimension
forms and runtime-context forms; there is no executable plugin UI.

Import the backend's `docs/examples/gas-procurement-v1.json` for the complete gas example.
Plugin capability input is separate from runtime context and business configuration. The
backend's `docs/decision-dimensions.md` documents the APIs, scoring semantics, lifecycle,
storage and versioned evaluator retention needed for replay across deployments.

Run `npx playwright test --config playwright.studio.config.ts` for the Studio browser suite.
It uses mocked APIs and starts or reuses the dev server on port 3000. Standard repository typecheck,
lint, unit tests and production build still apply.
