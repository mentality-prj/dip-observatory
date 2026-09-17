# QDIP Design System

## Goal

QDIP Site, Studio, Observatory, and plugin applications use one visual language and one component library. Product surfaces differ through semantic theme tokens only, not through duplicated layouts or component-specific color rules.

## Typography baseline

The scale follows the proportions used by ConverSight's current public site: large display headlines, clearly readable 18–20px body copy, 16px application copy, and compact 12–14px metadata only where hierarchy requires it.

| Token | Desktop | Mobile | Usage |
| --- | --- | --- | --- |
| `display` | `clamp(3.5rem, 6vw, 5.5rem)` | fluid | marketing hero |
| `h1` | `clamp(2.5rem, 4vw, 4rem)` | fluid | page title |
| `h2` | `clamp(2rem, 3vw, 3rem)` | fluid | section title |
| `h3` | `1.5rem` | `1.375rem` | cards / panels |
| `body-lg` | `1.25rem` | `1.125rem` | lead text |
| `body` | `1.125rem` | `1rem` | primary web copy |
| `app` | `1rem` | `1rem` | Studio / Observatory / plugins |
| `label` | `0.875rem` | `0.875rem` | labels / controls |
| `meta` | `0.75rem` | `0.75rem` | metadata only |

No primary explanatory text may use `meta` sizing.

## Architecture

```text
src/design-system/
  tokens.css              semantic typography, spacing, radius, elevation
  themes.css              theme token values only
  components/
    app-shell.tsx          common application frame
    product-header.tsx     common Site/Studio/Observatory/plugin header
    page.tsx               Page, PageHeader, Section
    card.tsx               Card primitives
    button.tsx             Button / LinkButton variants
    badge.tsx              status/tag primitive
    form.tsx               fields, labels, inputs, selects
    table.tsx              common data-table shell
    index.ts
```

Product code must compose these primitives. It must not recreate shell/header/card/button/form/table styling locally.

## Semantic theme contract

Components consume only semantic variables:

```css
--ds-accent
--ds-accent-strong
--ds-accent-soft
--ds-focus
--ds-surface
--ds-surface-raised
--ds-border
--ds-text
--ds-text-muted
```

Themes set those variables:

- Site: green
- Studio: green
- Observatory: cyan
- Plugin applications: manifest-selected theme (`cyan`, `emerald`, `amber`, `rose`, `violet`)

A component must never branch on a product name such as `studio`, `observatory`, or a plugin id to choose its visual styling.

## Layout contract

All surfaces share:

- the same header height, horizontal padding and content width;
- the same typography tokens;
- the same button heights and radii;
- the same cards, borders and elevation;
- the same focus, hover and disabled behavior;
- the same responsive breakpoints.

Only semantic theme colors and domain content change.

## Migration order

1. Extract tokens and theme provider without visual changes.
2. Replace Site, Studio and Observatory headers with `ProductHeader`.
3. Replace local page/card/button/form/table primitives.
4. Migrate every plugin frontend to the shared application shell.
5. Delete superseded product CSS and duplicated primitives.
6. Add visual/layout tests enforcing header geometry, minimum body size, focus visibility and mobile overflow.

## Enforcement

- No new local design primitive if an equivalent exists in `src/design-system`.
- Plugin manifests select a theme; plugin React code does not own a palette.
- `font-size < 14px` is allowed only for metadata and technical annotations.
- Main application copy is at least 16px; public-site body copy is 18px by default.
- Shared components are keyboard accessible and use visible `:focus-visible` states.
