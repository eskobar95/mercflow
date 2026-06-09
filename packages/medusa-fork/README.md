# Medusa fork (`packages/medusa-fork`)

MercFlow-owned Medusa v2.14.1 source as local pnpm workspace packages. This directory replaces npm `@medusajs/*` runtime dependencies for the forked packages listed below.

## Packages

| Directory | npm name | Notes |
|-----------|----------|-------|
| `framework/` | `@medusajs/framework` | HTTP, MikroORM, module SDK entrypoints |
| `medusa/` | `@medusajs/medusa` | Core Medusa server package |
| `utils/` | `@medusajs/utils` | Shared utilities |
| `types/` | `@medusajs/types` | Type definitions |
| `cli/` | `@medusajs/cli` | `medusa` CLI (dev/build) |

`@medusajs/js-sdk` remains on npm (admin-ui HTTP client only). Other Medusa modules (`@medusajs/product`, etc.) remain on npm until individually forked.

## Build

From the monorepo root:

```bash
pnpm build:medusa-fork
```

Build order: `types` → `utils` → `framework` → `cli` → `medusa`.

## Conventions

- Runtime MercFlow deps on forked packages use `workspace:*` — never pinned npm versions.
- Do not modify Medusa behaviour in this milestone without an explicit task; fork setup is source placement + workspace wiring only.
- Subpath exports on `@medusajs/framework` and `@medusajs/medusa` must be preserved — see `.cursor/rules/medusa-fork.mdc`.

## What does not belong here

- MercFlow modules (`content-module`, `seo-module`, etc.)
- Admin UI (`packages/admin-ui`)
- Guapo-specific configuration
