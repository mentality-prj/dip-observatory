# Public-site improvement steps 6–8

## Step 6 — product-led editorial pass

Implemented:

- removed the generic `Without / With a Decision Engine` comparison block from the homepage;
- removed the second explanatory `Frame / Compare / Explain / Decide` sequence from the homepage;
- kept one product-specific hero visualization and one interactive `Change one thing` experience;
- preserved the buyer path: recurring problem → interactive decision → reusable patterns → reasons to use QDIP → scoped pilot → decision intake.

Rationale: the previous page repeated the same concept in several visual forms. The product behavior now carries the explanation instead of extra SaaS-style cards and diagrams.

## Step 7 — Resource Allocation review

Findings:

- the demo already exposes real scenario controls, multi-day planning, alternatives, evidence, manual override, capacity-gap analysis and human decision lifecycle;
- the public marketing link incorrectly forced Ukrainian visitors into the English Observatory locale even though Resource Allocation itself supports Ukrainian;
- the impact panel was titled as a current-vs-recommended comparison even when no evaluated current baseline was supplied.

Implemented:

- Resource Allocation now preserves EN/UA/PL locale from the marketing site;
- the impact panel now explicitly says `QDIP recommendation` when baseline data is absent and does not imply an unmeasured improvement;
- added localized Resource Allocation title, description, canonical URL and hreflang metadata.

Deferred deliberately:

- true current-vs-recommended delta should be added only after the current allocation is evaluated through the same scenario/engine path. Do not synthesize a baseline from raw current assignments.

## Step 8 — release QA

Added automated release-gate coverage for:

- EN/UA/PL mobile overflow at 375 px;
- localized decision-intake routing;
- Ukrainian Resource Allocation locale preservation;
- interactive playground state change;
- localized Resource Allocation canonical metadata.

Existing routing/SEO coverage continues to verify clean marketing canonicals, permanent legacy redirects and sitemap exclusion of `/platform`.

## Remaining external checks

These cannot be proven from repository code alone:

- production DNS / Vercel host mapping;
- Google Search Console indexing;
- real-browser visual review at 768, 1366 and wide desktop sizes;
- real funnel conversion data after traffic reaches the site.
