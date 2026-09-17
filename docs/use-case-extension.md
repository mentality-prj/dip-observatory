# QDIP use-case extension contract

`src/use-cases/registry.ts` is the frontend manifest for applications built on DIP plugins. Observatory discovery and Studio presentation must resolve through this manifest rather than checking plugin IDs in page components.

## Add a new application

1. Implement the DIP plugin and expose its capability through the plugin registry.
2. Add the application frontend route under `src/app/[locale]/<route>` (the application can keep its own components and API adapter).
3. Add one `DipUseCase` entry to `DIP_USE_CASES` with localized catalog copy and route.
4. If the application is backed by a DIP plugin, declare `plugin.id` and `plugin.capability`. Studio then recognizes the application while continuing to use the generic Decision Profile / dimensions / bindings configuration flow.
5. Do **not** add plugin-ID conditionals to `DecisionAuditView`. Generic decision rendering is the default. If a domain genuinely needs a richer audit presentation, add a renderer to `StudioUseCasePanel` and opt into it through `plugin.studioRenderer`.

## Responsibility boundaries

- **DIP plugin:** execution, schemas, capabilities, outputs, domain rules and versioning.
- **Decision Studio:** generic plugin discovery, Decision Profiles, dimensions, bindings, policies/constraints and evaluation configuration.
- **Use-case registry:** frontend discovery metadata and optional presentation extension key.
- **Observatory application:** interactive demonstrator for the use case.

This keeps a new plugin usable in Studio without adding a bespoke Studio page. A specialized Observatory frontend remains optional: plugins can still be configured and audited generically.

## Current migration

The Observatory home catalog now reads from the manifest. Gas Forecast remains the first specialized Studio renderer, but the audit view no longer knows about `gas-forecast`; it resolves the renderer through the manifest. All other plugins use the generic audit panel automatically.

## Rule

A use case should require changes in at most three places: DIP plugin, its Observatory route, and one manifest entry. A fourth change is allowed only for an optional specialized Studio renderer.
