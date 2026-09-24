# QDIP application extension contract

`src/use-cases/registry.ts` is the single frontend application manifest. Routing metadata, Observatory discovery/navigation, visual theme and DIP plugin/capability association belong here. Infrastructure must not branch on concrete plugin IDs.

## Application boundary

Each domain-specific frontend belongs under `src/use-cases/<id>/`. Domain presentation must not live in `src/studio` or generic Observatory components.

## Add an application

1. Implement/register the DIP plugin and capability when the application has domain execution.
2. Implement the use-case frontend under `src/use-cases/<id>/` and expose it from its Next.js route.
3. Add one `DipUseCase` manifest entry: route, navigation order/visibility, localized catalog metadata, theme, icon and plugin/capability binding.
4. Generic Studio configuration and audit work automatically for plugin-backed applications.

## Responsibility boundaries

- **DIP plugin:** execution, schemas, capabilities, outputs, domain rules, versioning.
- **Application manifest:** routing/discovery/navigation metadata, theme and plugin/capability association.
- **Use-case package:** domain-specific Observatory frontend.
- **Observatory infrastructure:** renders manifest-driven discovery and navigation.
- **Decision Studio:** generic plugin discovery, profiles, dimensions, bindings, constraints and audit.

## Invariants

- No plugin-ID conditionals in `DecisionAuditView` or generic Observatory infrastructure.
- No duplicated use-case lists for homepage/navigation/theme resolution.
- Domain-specific components stay isolated from generic Studio infrastructure.
- A normal new application changes the DIP plugin, its isolated frontend package/route, and one manifest entry. Generic infrastructure stays unchanged.
