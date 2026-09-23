# Feature architecture

`src/features` is the application feature boundary.

Each use case follows the same dependency direction:

```text
app -> feature public API -> container/hook -> model/services/utils
                              -> components -> design-system
```

## Feature contract

```text
features/<feature>/
  components/   Presentational JSX. No engine/API orchestration.
  containers/   Composition boundary. Connects view-models to views.
  hooks/        Client state, effects and interaction orchestration.
  model/        Domain/view-model types, selectors and state contracts.
  services/     DIP/API adapters and external I/O.
  utils/        Pure transformations and formatters.
  config/       Feature constants and declarative configuration.
  index.ts      Browser-safe public import surface.
  server.ts     Optional server-only public boundary for route handlers.\n  server-actions.ts Optional public Server Actions boundary when Client Components invoke server logic.
```

## Rules

- `app/**` contains routing, metadata and composition only.
- UI consumers import from `features/<feature>`. Server routes import from `features/<feature>/server` when server-only capabilities are required; Client Components may import explicit `server-actions.ts` exports. Neither may import feature internals.
- `components/**` are presentational: props in, JSX out. They do not call APIs or decision engines and do not own domain orchestration.
- Hooks own client-side orchestration and expose view-model shaped data/actions.
- Services isolate I/O and framework/external API adapters.
- Utils are deterministic and side-effect free.
- Shared visual primitives come only from `@/design-system`.
- Cross-feature domain logic must not be hidden in UI components. Promote genuinely shared logic to `src/shared`.
- A feature must not import another feature's internals. Cross-feature composition belongs in `app` or an explicit shared/application layer.

Legacy top-level feature directories are migrated incrementally. Do not add new code to the legacy structure.
