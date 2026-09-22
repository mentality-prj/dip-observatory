# Public-site release gates

Before merge/deploy:

- CI, lint, type checks, production build and Playwright E2E are green.
- EN/UA/PL buyer copy renders without overflow at phone, tablet and desktop widths.
- Studio brand lockup geometry passes the responsive Playwright gate at 390 / 430 / 768 / 1024 / 1440 px: fixed optical wordmark width, stable left alignment and 0–2 px status gap.
- Resource Allocation, Gas Decision and GTM Lab CTAs resolve to working Observatory applications.
- Canonical public demo names remain unchanged across locales: `Resource Allocation`, `Gas Decision`, `GTM Lab`.
- UA/PL UI copy follows `docs/localization-glossary.md`; ordinary English UI terminology fails the automated localization policy test.
- The primary `See QDIP in action` CTA resolves directly to localized Observatory.
- All decision-intake CTAs resolve to the localized clean `/decision` route.
- No public link or canonical URL contains `/platform`.
- No unsupported business-performance claims are introduced.
- Human decision authority remains explicit.
