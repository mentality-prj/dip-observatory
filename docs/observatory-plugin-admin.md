# Observatory plugin administration — catalog registration

**Admin:** `https://observatory.qdip.ai/uk/admin/plugins` (EN/PL supported).

**Public directory:** `https://observatory.qdip.ai/uk/plugins`.
Each explicitly published installed runtime plugin has a generic
`/uk/plugins/<plugin-name>` information page without requiring a new React
workspace in `DIP_USE_CASES`.

## What the two registries mean

- **QDIP Core runtime registry:** installed Python plugins with verified
  capability IDs and versions. This cannot be modified by typing arbitrary
  data in a web form. Installation/remote Worker registration is a separate,
  trusted backend deployment and SDK/Gateway lifecycle.
- **Observatory catalog:** title, description, category, selected installed
  capability and publish/hide flag. Admins register these through a form and
  QDIP Core persists them, with revision checks and audit in MongoDB.
- **Existing Web demos:** application routes compiled in
  `src/use-cases/registry.ts`; they remain specialized UI experiences.
  An ordinary plugin no longer requires one of these routes for a discoverable
  public information page. A generic information page is **not** an executable
  invocation UI.

The admin `Refresh list` action performs a GET against the installed Core
registry; it never installs or updates plugin code.

## Security and release order

Zitadel `observatory_admin` project role + signed same-origin session ->
server-side Web API -> existing Core `/api/v1/plugin-publications` protected
by a platform-admin API key -> MongoDB publication state and audit. The browser
never obtains this key or selects Core organizations. Admin input is limited to
presentation metadata and a capability from the installed server-verified
manifest. An uninstalled plugin or stale capability/version is rejected;
unpublished, disabled, stale or unavailable entries do not appear in the
public directory.

**Release Core PR #385 first**, followed by Web PR #261; merging Web first
would cause attempts to save catalog metadata to receive a validation error.
Core's transactional writes require a MongoDB replica set. Test publication
and unpublication against a real installed plugin after Core deployment, not
just mocked HTTP tests. Maintain the existing Vercel build-cost limit.

## User workflow

1. Open Admin and select an **installed Core plugin**.
2. Enter a readable name, description and category; select an installed
   capability from its manifest.
3. Choose **Save and publish**. Its public catalog information page appears
   under `/plugins/<plugin-name>`.
4. Use **Unpublish** on a card to remove it from public discovery.
5. Open **Plugins** in the Observatory navigation to browse the directory.

Adding a new Python implementation or SDK-02 remote Worker is deliberately
*not* a web metadata form. No new service, Gateway, SDK or marketplace is needed.
