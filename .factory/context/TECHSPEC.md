# Technical specification — MercFlow

> Aligns with PRD-fork-setup.md (M0), PRD.md (Batch 2), and PRD-api-hardening.md. Updated during `/align`.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js | Medusa v2 backend in `apps/backend` |
| Framework | **Forked Medusa v2.14.1** — local workspace packages | Not npm; see Fork structure below |
| Language | TypeScript (strict) | No `any` |
| Package manager | pnpm 9 | Workspace monorepo |
| Database | PostgreSQL (Neon) | Per-module migrations + core table migrations in fork |
| Multi-tenancy | RLS via `mercflow_app` role + `TenantIsolationSubscriber` | `SET LOCAL app.tenant_id` per transaction |
| Admin UI | React 18 + Vite + Radix | `packages/admin-ui` — replaces Medusa dashboard |
| Rich text | TipTap v2 | JSON in content-module |
| CI | GitHub Actions | `ci.yml`, `security.yml` |

---

## Fork structure (M0 — ADR-007)

Medusa v2.14.1 source lives as local pnpm workspace packages under `packages/medusa-fork/`.
All `@medusajs/*` entries in every `package.json` must point to `workspace:*`.

```
packages/medusa-fork/
├── framework/     → @medusajs/framework  (local, modifiable)
├── medusa/        → @medusajs/medusa     (local, modifiable)
├── utils/         → @medusajs/utils      (local, modifiable)
├── types/         → @medusajs/types      (local, modifiable)
├── cli/           → @medusajs/cli        (local, modifiable)
└── …              → other @medusajs/* as needed
```

`@medusajs/js-sdk` may remain on npm if no source modifications are needed (admin-ui HTTP client only).

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "packages/medusa-fork/*"
  - "apps/*"
```

**Adding a field to a Medusa core entity:** edit in `packages/medusa-fork/`, generate migration,
run locally. Never patch `node_modules`.

---

## Constraints

- **Fork is the source of truth for Medusa.** Do not pull `@medusajs/*` from npm for runtime code after M0. All modifications go into `packages/medusa-fork/`.
- Design values only from `packages/design-tokens`. No hardcoded hex/spacing/radii.
- Migrations: DML-generated, decision log in file, reversible `down()`; immutable once committed.
- Locale-aware content: `?locale=` on MercFlow content APIs matches Medusa Admin locale codes (BCP-47); do not hardcode production language lists.
- **Notion:** read-only intake for planning; Factory files are SSOT during `/to-prd`, `/to-backlog`, `/run-sprint` (see ADR-001).
- **SaaS multi-tenancy (ADR-004):** Shared Neon DB, one Medusa instance, `store_id` column on every table (MercFlow modules + Medusa core tables via fork). Service methods filter by `store_id`. Tenant resolved from JWT (admin) or `Host` header (public routes). Verify with `rg "store_id" packages/*/src/models/` — every model must match.
- **RLS (ADR-005):** Every new module table AND every Medusa core table in scope must have an RLS policy via `mercflow_app` role + `SET LOCAL app.tenant_id`. `TenantIsolationSubscriber` must be registered on all module EMs at startup.
- **No cross-package frontend→backend coupling.** Frontend packages (`admin-ui`, `design-tokens`) must not import from backend Medusa modules (`seo-module`, `content-module`, etc.). Shared utilities live in `@mercflow/shared`.
- **Zod: one version.** Resolved via `pnpm.overrides` in root `package.json`. No dual-zod in lockfile.
- Guapo-specific production config/credentials stay out of MercFlow packages.
- Batch 2 public routes must return correct status, `Content-Type`, and cache behavior; test XML/text as output.
- **List endpoints (PRD-api-hardening, T031):** Every `GET /admin/[resource]` handler must apply `limit = Math.min(query.limit ?? 50, 100)`. No unbounded queries.
- **Error shape (PRD-api-hardening, T031):** All MercFlow route error paths must use `MedusaError`. Shape: `{ message, type, code }`.
- **Store route versioning (PRD-api-hardening, T032):** All MercFlow store-facing routes must be mounted under `/v1/` before the first non-Guapo tenant is provisioned.

---

## Startup wiring (required after M0)

`apps/backend` must include an `onApplicationBootstrap` hook that:

1. Iterates over all registered Medusa modules.
2. Resolves each module service from the Medusa container.
3. Accesses `service.__container__["manager"]` (MikroORM root `EntityManager`).
4. Calls `registerTenantSubscriber(em)` from `apps/backend/src/lib/tenant-isolation/`.

`tenantIsolationMiddleware` must be wired in `apps/backend/src/api/middlewares.ts` for all routes
that carry a tenant context (admin JWT routes + store routes with `Host` resolution).

---

## Integrations

| Service | Purpose | Where |
|---------|---------|--------|
| Stripe | Payments config | `connector-module` |
| Shipmondo | Shipping rules config | `connector-module` |
| Plunk | Email | `connector-module` |
| GTM | Analytics tag | `connector-module` |

Storefront consumes SEO/feed/metadata via backend public routes.

---

## Repository layout (post-M0)

```
mercflow/
├── apps/
│   └── backend/            # App shell — module registration, startup hooks, route re-exports
├── packages/
│   ├── medusa-fork/        # M0 — Medusa v2.14.1 source as workspace packages
│   │   ├── framework/      #   @medusajs/framework
│   │   ├── medusa/         #   @medusajs/medusa
│   │   ├── utils/          #   @medusajs/utils
│   │   ├── types/          #   @medusajs/types
│   │   └── cli/            #   @medusajs/cli
│   ├── shared/             # M0 — @mercflow/shared: slug util, string helpers, type predicates
│   ├── admin-ui/           # MercFlow admin (replaces Medusa dashboard)
│   ├── design-tokens/      # CSS vars + Tailwind preset (no Medusa deps)
│   ├── content-module/     # CMS fields, articles, pages, media (Batch 1+)
│   ├── connector-module/   # Third-party credentials (Batch 1+)
│   ├── subscription-module/# Subscription records (Batch 1+)
│   ├── seo-module/         # Redirects, sitemap, robots, slug utility (Batch 2)
│   ├── feed-module/        # Google Shopping XML (Batch 2)
│   └── inventory-module/   # Suppliers, POs, inventory dashboard (Batch 2)
├── .factory/context/       # PRD, TECHSPEC, CONTEXT, ADR
├── .factory/planning/      # milestones, sprints, tasks (Factory harness)
└── infra/                  # Docker Compose, Traefik config (ADR-006)
```

---

## Branch model (MercFlow)

MercFlow uses **`development`** as the integration branch, not Factory kit default `dev`.

```
main
  └── staging
        └── development          ← all feature PRs target here
              └── feature/[sprint]/[task-id]-[slug]
```

See ADR-002. Protected branches for agents: `main`, `staging`, `development` (`.cursor/hooks/guard-branches.sh`).

---

## Commands (project scripts)

| Script | Command | When |
|--------|---------|------|
| Typecheck | `pnpm typecheck` | Every task |
| Lint | `pnpm lint` | Every task |
| Test | `pnpm test` | Every task |
| Build | `pnpm build` | Before milestone / large UI change |
| CI parity | `pnpm ci` | Pre-PR |
| Migrations | `pnpm migration:run` | After schema change (local only unless instructed) |
| Audit | `pnpm audit --audit-level=high` | PR checklist |

---

## Testing

| Script | Command | Notes |
|--------|---------|-------|
| Unit/integration | `pnpm test` | Vitest monorepo root |
| Module-focused | `pnpm test <path>` | Narrowest scope first |

BDD: optional under `.factory/specs/` — link to PRD journeys when used.

---

## Batch 2 — technical additions (planned)

| Module | Responsibility |
|--------|----------------|
| `seo-module` | Redirects, sitemap/robots config, slug utility, public `GET /sitemap.xml`, `GET /robots.txt` |
| `feed-module` | `GET /feed/google-shopping.xml`, feed config, validation report |
| `inventory-module` | Suppliers, POs, receipts, inventory dashboard aggregates, low-stock config |

**Suggested implementation order** (from PRD-batch2 §5): slug utility → seo foundation → redirects → sitemap → robots → structured data / OG / canonical → feed → suppliers → POs → inventory dashboard → order flow improvements.

**Out of scope Batch 2:** wildcard/regex redirects, Amazon/Pricerunner feeds, EDI, auto low-stock ordering, GLS labels (Batch 3).

---

## ADR log

| ID | Date | Decision | Status |
|----|------|----------|--------|
| [ADR-001](ADR/ADR-001-notion-read-only-factory-execution.md) | 2026-06-04 | Notion read-only intake; Factory owns execution | accepted |
| [ADR-002](ADR/ADR-002-development-integration-branch.md) | 2026-06-04 | Integration branch is `development` (not `dev`) | accepted |
| [ADR-003](ADR/ADR-003-batch2-module-split.md) | 2026-06-04 | Batch 2: separate seo / feed / inventory modules | accepted |
| [ADR-004](ADR/ADR-004-shared-instance-multi-tenancy.md) | 2026-06-04 | SaaS multi-tenancy — shared Neon DB, `store_id` row isolation | accepted |
| [ADR-005](ADR/ADR-005-security-rls-rate-limiting.md) | 2026-06-04 | Security: RLS on MercFlow tables + rate limiting + Neon IP policy | accepted |
| [ADR-006](ADR/ADR-006-hetzner-infra-stack.md) | 2026-06-08 | Production infra: Hetzner + Docker Compose + Traefik + Redis + Portainer | accepted |
| [ADR-007](ADR/ADR-007-medusa-fork-platform-ownership.md) | 2026-06-09 | Fork Medusa v2.14.1 — full platform ownership, local workspace packages | accepted |
| PRD-api-hardening | 2026-06-08 | API hardening: pagination max, error shape, /v1/ store route versioning — see PRD-api-hardening.md | accepted |

---

## Security notes

- Secrets in env only; validate admin APIs with Zod.
- Webhook HMAC where applicable.
- No secrets in logs; `guard-secrets.sh` on shell commands.
