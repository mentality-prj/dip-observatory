# Decision Studio

Open `/studio/profiles` to create or import profiles. Open a profile to access Overview,
Alternatives, Dimensions, Constraints, Policies and Compliance at
`/studio/profiles/{id}` and its named subroutes. Each section saves a new version of the
same profile; rule sections preserve other dimensions and alternatives. Old global rule
routes redirect to the profile list so the user can choose a profile.

Plugin Registry groups `/studio/plugins` and `/studio/bindings`. Bindings show semantic
capability outputs; internal source paths and field mappings are under Advanced details.
`/studio/dimensions` is the global registry of dimension definitions and schemas, without
profile configuration. The profile dimension table distinguishes plugin supplied, DIP
calculated, business configured and runtime supplied inputs.

`/observatory/decisions` provides read-only decision
inspection and replay verification. The existing scenario Observatory remains available at
its locale routes and `/observatory`.

Use the existing `DIP_API_BASE_URL` and `DIP_API_KEY`, as Observatory does (with
`DIP_ADMIN_API_KEY` as the same legacy fallback). No Studio-specific key is needed or read.
Platform keys use the backend's existing `PLUGIN_RUNTIME_DEFAULT_ORGANIZATION_ID`
workspace, exactly like the plugin API; organization keys retain their own organization.
The backend
requires `decision-profiles:read`, `decision-profiles:write`, `decisions:execute` and
`audit:read` according to the operation. Studio keeps the key on the server, limits proxy
resources and methods, and requires same-origin mutation requests. Deployment access control
is shared with the existing application.

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
