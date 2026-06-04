# Stack — MercFlow

> Short mirror of `.factory/context/TECHSPEC.md`. Update when TECHSPEC changes.

---

## Runtime & language

- Node.js (Medusa v2 backend)
- TypeScript (strict) across monorepo
- pnpm 9.x workspaces

## Backend & data

- Medusa v2 (`apps/backend`)
- PostgreSQL via Medusa DML / MikroORM (module migrations)
- Module services extend `MedusaService`

## Admin UI

- React 18 + Vite (`packages/admin-ui`)
- Radix UI primitives + MercFlow `components/ui`
- Tailwind via `@mercflow/design-tokens` (no hardcoded visual values)
- TipTap v2 for rich text (JSON storage)

## Quality scripts

| Check | Command |
|-------|---------|
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| CI (local parity) | `pnpm ci` |
| Migrations | `pnpm migration:run` |

## MercFlow packages (current)

| Package | Role |
|---------|------|
| `content-module` | CMS, product/category content, pages, articles, redirects (Batch 1+) |
| `connector-module` | Encrypted third-party credentials |
| `subscription-module` | Subscription records (read-only admin v1) |
| `admin-ui` | Forked Medusa admin |
| `design-tokens` | Shared tokens |
| `seo-module` | **Planned Batch 2** — redirects, sitemap, robots, slug utility |
| `feed-module` | **Planned Batch 2** — Google Shopping XML |
| `inventory-module` | **Planned Batch 2** — POs, suppliers, inventory dashboard |

## Integrations (connector-module)

- Stripe, Shipmondo, Plunk, GTM — credentials in module; no Guapo production secrets in repo

---

<!-- Keep in sync with TECHSPEC.md -->
