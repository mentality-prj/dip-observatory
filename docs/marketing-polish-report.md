# QDIP public-site polish

## Audit findings

- Public clean URLs already exist through a host-aware rewrite; `/platform` is an internal route namespace, not the intended public URL.
- The namespace prevents collisions with existing locale/use-case Observatory routes, so removing it physically would increase routing risk without changing public URLs.
- Legacy `/platform/...` redirect was temporary by default and is now permanent (308).
- Canonical and hreflang metadata already point to clean qdip.ai URLs.
- A generated marketing sitemap and robots policy were missing.
- Product copy already positions QDIP as a Decision Engine and the EN/UA/PL homepage copy is localized rather than mechanically duplicated.
- The hero decision flow was semantically correct but visually static and generic.

## Changes

- Kept `/platform` only as an internal server rewrite boundary; documented why.
- Added direct permanent redirects from legacy `/platform/{locale}/...` URLs.
- Added sitemap and robots metadata using clean canonical URLs only.
- Added Decision Engine web-app metadata.
- Replaced the static hero flow with a lightweight QDIP-specific staged decision-flow visual using CSS only; no animation dependency or fake metrics.
- Added intentional mobile vertical flow and reduced-motion behavior.
- Added routing/SEO regression coverage.

## Scope intentionally unchanged

Observatory, Studio, demos, Decision Engine behavior and backend logic are untouched. Existing homepage information architecture, palette, typography and conversion funnel are preserved.
