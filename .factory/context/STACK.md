# Stack — MercFlow

> Short mirror of `.factory/context/TECHSPEC.md`. Update when TECHSPEC changes.

---

## Runtime & language

- Node.js (Medusa v2 backend)
- TypeScript (strict) across monorepo
- pnpm 9.x workspaces

## Backend & data

- **Forked Medusa v2.14.1** (`apps/backend`) — MercFlow owns the codebase (ADR-007)
- PostgreSQL via Medusa DML / MikroORM (module migrations)
- Module services extend `MedusaService`
- RLS via `mercflow_app` role (NOBYPASSRLS) + `set_config('app.tenant_id', …, true)` injected by `TenantIsolationSubscriber` on every MikroORM transaction start
- `AsyncLocalStorage` (TenantContext) propagates `store_id` per request without manual threading

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
| `medusa-fork/*` | **M0** — Medusa v2.14.1 source as workspace packages (replaces npm) |
| `shared` | **M0** — Cross-package utilities: slug, string helpers, type predicates |
| `content-module` | CMS, product/category content, pages, articles, redirects (Batch 1+) |
| `connector-module` | Encrypted third-party credentials |
| `subscription-module` | Subscription records (read-only admin v1) |
| `admin-ui` | MercFlow admin (replaces Medusa dashboard) |
| `design-tokens` | Shared tokens |
| `seo-module` | **Planned Batch 2** — redirects, sitemap, robots (slug → shared) |
| `feed-module` | **Planned Batch 2** — Google Shopping XML |
| `inventory-module` | **Planned Batch 2** — POs, suppliers, inventory dashboard |

## Hosting & infrastructure

| Component | Choice | Notes |
|-----------|--------|-------|
| Compute | Hetzner VPS | All backend services run here |
| Deployment unit | Docker Compose | Single `docker-compose.yml` per environment |
| Reverse proxy | Traefik | SSL (Let's Encrypt), per-tenant domain routing |
| Cache / queue state | Redis | Medusa event bus + rate-limiting counters |
| Database | Neon (managed PostgreSQL) | Shared across tenants, row-level isolated — ADR-004 |
| Error tracking | Sentry | Tagged by `store_id` |
| Observability | BetterStack | Logs + uptime checks per tenant domain |
| Object storage | Hetzner Object Storage (S3-compatible) | Media assets + daily pg_dump backups |
| Container management | Portainer CE | Self-hosted, free, no SSH required |

**Not in infra MVP:** CI/CD auto-deploy pipeline, Kubernetes, Railway, self-hosted PostgreSQL, per-tenant VMs.

## Integrations (connector-module)

- Stripe, Shipmondo, Plunk, GTM — credentials in module; no Guapo production secrets in repo

---

<!-- Keep in sync with TECHSPEC.md -->
