# PRD — MercFlow Fork Setup (M0)

> Version 1.0 — 2026-06-09
> Milestone: M0 — Fork infrastructure
> Prerequisite: POC confirmed (RLS + MikroORM EventSubscriber — June 2026); ADR-007 accepted
> Blocks: All future Batch 2 tasks that require `store_id` on core tables

---

## Problem

MercFlow is currently built as a thin extension layer on top of Medusa v2 packages pulled from npm.
This prevents three capabilities that are hard requirements for a multi-tenant platform:

1. **No `store_id` on Medusa core tables.** Products, orders, customers, line items, and other
   Medusa-owned entities have no tenant discriminator. A service bug or missing filter leaks all
   tenants' data. RLS cannot be added without modifying Medusa's source.

2. **No control over Medusa's internal workflows and notification delivery.** Medusa's event bus is
   single-instance and fire-and-forget. Reliable per-tenant order confirmation emails, retry logic,
   and BullMQ-based orchestration require modifying how Medusa emits and handles events internally.

3. **Medusa's admin UI is shipped inside the backend process.** `@medusajs/dashboard` bundles and
   serves Medusa's original admin at runtime. MercFlow's own admin UI
   (`packages/admin-ui`) must replace it fully — but cannot as long as the backend explicitly
   depends on and boots the upstream dashboard.

Secondary problems surfaced during codebase analysis:

4. **Zod version split.** MercFlow modules use `zod@3` while the Medusa framework graph includes
   `zod@4`, producing two copies of Zod in the lockfile. This creates runtime type-mismatch risks
   and bloated bundles.

5. **Frontend ↔ backend-module coupling.** `@mercflow/admin-ui` imports `slugifyForStrategy` from
   `@mercflow/seo-module` — a Medusa backend module with Neon-level dependencies. Frontend packages
   must not depend on backend Medusa modules; shared utilities belong in a purpose-built package.

6. **~80 thin route re-export files.** Every MercFlow API route requires a stub file under
   `apps/backend/src/api/` because Medusa only scans the app root. This is boilerplate that grows
   with each new module.

---

## Goals

1. Medusa v2.14.1 source available as local pnpm workspace packages (`packages/medusa-fork/*`).
2. All MercFlow packages resolve `@medusajs/*` from the local fork — not from npm.
3. `store_id TEXT NOT NULL` added to Medusa core tenant-scoped tables; database migrations generated
   and verified locally.
4. RLS policies enforced on all tenant-scoped core tables via `mercflow_app` role.
5. `TenantIsolationSubscriber` registered on startup for every module `EntityManager`.
6. `tenantIsolationMiddleware` wired on all relevant admin and store routes.
7. `@mercflow/shared` package created; `slugifyForStrategy` and other cross-boundary utilities
   moved there; `admin-ui → seo-module` coupling removed.
8. Medusa dashboard (`@medusajs/dashboard`) removed from the backend; `admin-ui` confirmed as
   the sole admin interface.
9. Zod harmonised to a single version across the monorepo via `pnpm.overrides`.
10. `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test` all pass on the forked
    configuration.

---

## Non-goals (this milestone)

- Any new user-facing feature (Batch 2 tasks: SEO, feeds, inventory start after M0 ships).
- Migrating existing Guapo row data to new `store_id` columns (that is a separate backfill
  task that depends on M0 migrations being in place first).
- Self-service tenant provisioning UI.
- Rebuilding notification flows or replacing the event bus (post-M0 milestone).
- BullMQ integration (post-M0).
- Subscription system expansion (post-M0).
- Discount system rebuild (post-M0).
- Implementing metafields (post-M0).
- Modifying Medusa's payment processing or product/variant logic.
- Eliminating the route re-export layer — acceptable tech-debt for M0; evaluate post-fork
  once module-level route discovery can be added to the fork.

---

## Users

**Platform developer (MercFlow team)** — sets up and iterates on the forked codebase. The M0
milestone is an internal infrastructure milestone; there are no merchant-facing changes.

**Future: any MercFlow module author** — writes new modules against local workspace packages
instead of npm packages, can add fields to core entities without npm dependency constraints.

---

## User journeys

### J001 — Developer runs the stack on the forked packages

**Problem:** Today, a developer runs `pnpm install` and pulls Medusa from npm. After M0, the same
workflow must work against local workspace packages — without any npm Medusa packages in the
dependency graph for runtime code.

**Steps:**

1. Developer clones `mercflow` repo and runs `pnpm install`.
2. `pnpm-workspace.yaml` includes `packages/medusa-fork/*`.
3. All `@medusajs/*` entries in every `package.json` resolve to `workspace:*`.
4. `pnpm dev` starts the backend; Medusa boots from the local fork.
5. `pnpm typecheck` passes — no module resolution errors.

**Success:** No npm fetch for any `@medusajs/*` package at runtime.

---

### J002 — Every database transaction carries the tenant context

**Problem:** Without `SET LOCAL app.tenant_id`, RLS policies cannot enforce tenant isolation.

**Steps:**

1. HTTP request arrives with a valid JWT or `Host` header identifying a store.
2. `tenantIsolationMiddleware` sets `TenantContext.run(storeId, …)` via `AsyncLocalStorage`.
3. Any Medusa module that starts a MikroORM transaction triggers `afterTransactionStart`.
4. `TenantIsolationSubscriber` calls `set_config('app.tenant_id', storeId, true)` on the
   active transaction connection.
5. All SQL within that transaction is filtered by the RLS policy on `app.tenant_id`.
6. A request with no store context skips step 2–4; queries run without tenant filter (admin
   platform ops only).

**Success:** Integration test (`test-rls-medusa.ts`) passes; `current_setting('app.tenant_id')`
returns the expected store ID inside a tenant-scoped transaction.

---

### J003 — Platform developer adds `store_id` to a Medusa core table

**Problem:** Today, adding `store_id` to `product` would require a patch to an npm package.
After M0, the fork is the source of truth.

**Steps:**

1. Developer opens `packages/medusa-fork/medusa/src/models/product.ts` (or DML equivalent).
2. Adds `store_id` field.
3. Runs `pnpm migration:generate` in the module — migration file created.
4. Runs `pnpm migration:run` locally — column exists in Neon dev DB.
5. RLS policy is added or extended in the migration to cover the new column.
6. `pnpm typecheck` passes.

**Success:** `rg "store_id" packages/medusa-fork/*/src/models/` returns the expected fields;
migration is reversible via `down()`.

---

### J004 — Admin UI loads without Medusa dashboard

**Problem:** Today, `apps/backend` depends on `@medusajs/dashboard` which serves Medusa's
original admin. After M0, only MercFlow admin UI runs.

**Steps:**

1. `@medusajs/dashboard` and related deps removed from `apps/backend/package.json`.
2. Backend build produces no admin-bundle artefact from the Medusa dashboard.
3. `pnpm dev` boots; navigating to `/app` routes to MercFlow admin UI (via Vite proxy or
   separate port).
4. No Medusa admin UI routes are registered or served.

**Success:** `pnpm build` completes without dashboard dependency; `packages/admin-ui` is the
sole admin interface.

---

### J005 — Frontend package uses shared utilities without importing backend modules

**Problem:** `@mercflow/admin-ui` imports slug utilities from `@mercflow/seo-module`, which
depends on Medusa's ORM layer. Frontend packages must not pull in backend ORM.

**Steps:**

1. `@mercflow/shared` package created at `packages/shared/`.
2. `slugifyForStrategy` (and other cross-boundary utilities) moved to `shared/src/`.
3. `@mercflow/seo-module` imports from `@mercflow/shared` instead of owning the utility.
4. `@mercflow/admin-ui` imports from `@mercflow/shared` instead of from `seo-module`.
5. `pnpm typecheck` and `pnpm build` pass; no `admin-ui → seo-module` edge in dependency
   graph.

**Success:** `pnpm why @mercflow/seo-module --filter @mercflow/admin-ui` shows no dependency.

---

## Package restructuring decisions

### New packages

| Package | Location | Role |
|---------|----------|------|
| Medusa fork packages | `packages/medusa-fork/` | Medusa v2.14.1 source, one sub-directory per upstream `@medusajs/*` package |
| `@mercflow/shared` | `packages/shared/` | Pure utilities shared between frontend and backend packages: slug, string helpers, type predicates |

### Existing packages — required changes

| Package | Change |
|---------|--------|
| `packages/admin-ui` | Remove `@mercflow/seo-module` dependency; import from `@mercflow/shared` |
| `packages/seo-module` | Remove slug utility; import from `@mercflow/shared`; update `@medusajs/*` to `workspace:*` |
| `packages/content-module` | Update `@medusajs/*` to `workspace:*` |
| `packages/feed-module` | Update `@medusajs/*` to `workspace:*` |
| `packages/inventory-module` | Update `@medusajs/*` to `workspace:*` |
| `packages/connector-module` | Update `@medusajs/*` to `workspace:*` |
| `packages/subscription-module` | Update `@medusajs/*` to `workspace:*`; add `@medusajs/types` (currently missing) |
| `apps/backend` | Remove `@medusajs/dashboard`, `admin-sdk`, `admin-shared`, `admin-bundler`, `admin-vite-plugin`; add startup hook for `TenantIsolationSubscriber`; wire `tenantIsolationMiddleware` on all routes |

### Existing packages — no structural change required

| Package | Reason |
|---------|--------|
| `packages/design-tokens` | Zero Medusa dependencies — no changes |
| `packages/admin-ui` (structure) | Already a standalone Vite app; only dependency change needed |

### `pnpm-workspace.yaml` target

```yaml
packages:
  - "packages/*"
  - "packages/medusa-fork/*"
  - "apps/*"
```

### `pnpm.overrides` additions (root `package.json`)

```json
{
  "pnpm": {
    "overrides": {
      "zod": "^3.25.0"
    }
  }
}
```

*Evaluate whether zod@3 is sufficient for all MercFlow uses; if zod@4 features are needed,
override to `^4.x` instead — but one version only.*

---

## Core table `store_id` scope

Medusa core tables that must receive `store_id NOT NULL` before any Batch 2 feature ships:

| Table | Medusa entity | Priority |
|-------|---------------|----------|
| `product` | `Product` | M0 — blocks feed, SEO, inventory |
| `product_variant` | `ProductVariant` | M0 — blocks inventory |
| `product_category` | `ProductCategory` | M0 — blocks SEO, feed |
| `order` | `Order` | M0 — blocks order admin improvements |
| `customer` | `Customer` | M0 — blocks member subscriptions |
| `line_item` | `LineItem` | M0 — follows order |
| `cart` | `Cart` | M1 — defer until checkout multi-tenancy needed |
| `fulfillment` | `Fulfillment` | M1 — defer until fulfillment scope defined |

*M0 tables: add `store_id` + RLS. M1 tables: defer to milestone after M0 ships.*

---

## Startup wiring (TenantIsolationSubscriber)

After the fork, a Medusa `onApplicationBootstrap` lifecycle hook must:

1. Resolve each module service from the Medusa container.
2. Access `service.__container__["manager"]` (the module's root `EntityManager`).
3. Call `registerTenantSubscriber(em)` from `apps/backend/src/lib/tenant-isolation/`.
4. This registers the singleton `TenantIsolationSubscriber` with that EM's `EventManager`.

This hook must be verified to run before the first HTTP request is served.

---

## Success metrics

| Metric | Target |
|--------|--------|
| `pnpm install` — zero npm fetches for `@medusajs/*` | 100 % |
| `pnpm typecheck` pass (no new errors) | 100 % |
| `pnpm build` pass | 100 % |
| `pnpm test` pass (including `test-rls-medusa.ts`) | 100 % |
| `pnpm audit --audit-level=high` — no new HIGH/CRITICAL | 0 new CVEs |
| `admin-ui → seo-module` edge in dependency graph | Removed |
| Zod copies in lockfile | 1 |
| `store_id` on M0 core tables | All 6 tables |
| Dashboard removed from backend | Confirmed |

---

## Deliverables

1. `packages/medusa-fork/` — Medusa v2.14.1 as local workspace packages.
2. `pnpm-workspace.yaml` — extended with `packages/medusa-fork/*`.
3. All `package.json` files updated — `@medusajs/*` → `workspace:*`.
4. `packages/shared/` — new package with slug utility and initial shared helpers.
5. `admin-ui`, `seo-module` updated to import slug from `@mercflow/shared`.
6. `apps/backend` — dashboard removed, `TenantIsolationSubscriber` startup wiring added,
   `tenantIsolationMiddleware` registered.
7. Migrations — `store_id` on M0 core tables (6 tables) with RLS policies; all reversible via
   `down()`.
8. CI green — all checks pass on the forked configuration.
9. README update in `apps/backend` documenting the fork structure and developer setup.

---

## Open questions

- **Which Medusa packages to include in the fork?** At minimum: `@medusajs/framework`,
  `@medusajs/medusa`, `@medusajs/utils`, `@medusajs/types`, `@medusajs/cli`. Optionally:
  `@medusajs/js-sdk` (admin-ui uses it; may stay on npm if no source changes needed).
  Decision: include only packages where MercFlow needs to modify source.

- **Subpath exports compatibility.** The fork must preserve subpath exports used in config
  strings (`@medusajs/medusa/fulfillment`, `@medusajs/medusa/fulfillment-manual`) and in code
  (`@medusajs/framework/mikro-orm/core`, `@medusajs/framework/http`).

- **Route re-export layer.** The ~80 thin files under `apps/backend/src/api/` remain for M0.
  A follow-up task can evaluate whether the Medusa fork's route discovery can be extended to
  support module-level routes, eliminating this layer.

- **Zod override direction.** Force `zod@3` (current MercFlow modules use it) or `zod@4`
  (Medusa framework graph uses it)? Resolve by checking which features each side uses — prefer
  the version that avoids rewriting validation schemas.

- **`@medusajs/js-sdk` in fork or npm?** `admin-ui` uses it only for HTTP client calls — no
  source modifications expected. Keep on npm unless a fork-side change is needed.
