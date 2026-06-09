# @mercflow/shared

Cross-boundary pure utilities shared between MercFlow packages — no Medusa runtime, no React, no database access.

Use this package when the same logic must run in **admin-ui** (ESM / Vite) and **backend modules** (CJS / Medusa) without coupling the frontend to a backend module.

---

## Responsibility

This package owns **stateless, side-effect-free utilities** that multiple MercFlow packages need. Today that is the Nordic slug transliteration helper; additional shared helpers are added here only when a real cross-package need appears.

**Does not belong here:**

- Design tokens (`@mercflow/design-tokens`)
- SEO config, redirects, or any Medusa module logic (`@mercflow/seo-module`)
- React components or hooks (`@mercflow/admin-ui`)

---

## Getting started

```bash
pnpm --filter @mercflow/shared build
pnpm --filter @mercflow/shared test
pnpm --filter @mercflow/shared typecheck
```

```ts
import { slugifyForStrategy, type SlugStrategy } from "@mercflow/shared/slug"

const strategy: SlugStrategy = "nordic"
slugifyForStrategy("Rødgrød med fløde", strategy) // "roedgroed-med-floede"
```

The package ships dual **CJS + ESM** output (`tsup`) so both `@mercflow/admin-ui` and `@mercflow/seo-module` can import it without format mismatches.

---

## Public API

| Export | Description |
|--------|-------------|
| `slugifyForStrategy(title, strategy)` | Kebab-case slug from a display title using Nordic or omit transliteration rules |
| `SlugStrategy` | `"nordic"` \| `"omit"` |

Subpath `@mercflow/shared/slug` is the canonical import for slug utilities. The root export re-exports the same symbols.

---

## Consumers

| Package | Import |
|---------|--------|
| `@mercflow/admin-ui` | `@mercflow/shared/slug` — slug preview and category handle generation |
| `@mercflow/seo-module` | `@mercflow/shared/slug` — re-exported at `@mercflow/seo-module/slug` for backward compatibility |

---

## Build output

```
dist/
  index.js / index.cjs / index.d.ts
  slug.js / slug.cjs / slug.d.ts
```

Run `pnpm build` after changing `src/` before publishing or before packages that consume compiled `dist/` (admin-ui prebuild).
