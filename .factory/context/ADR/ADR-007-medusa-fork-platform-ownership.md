# ADR-007: Fork Medusa v2 — Full Platform Ownership

**Status:** Accepted  
**Date:** 2026-06-09  
**Supersedes:** Parts of ADR-004 (shared-instance multi-tenancy)

---

## Context

MercFlow has been operating as a Medusa v2 **distribution**: our modules extend Medusa's functionality without touching its core. This gave us fast iteration early on but created a ceiling on what we can control:

- Medusa core tables (`product`, `order`, `customer`, `store`, etc.) cannot have `store_id` added via a distribution model — only via a migration on the core schema, which requires owning the codebase.
- Tenant isolation via RLS requires `store_id` (or equivalent) on every row in every Medusa table we want to isolate. Without it, RLS policies have nothing to filter on.
- Medusa's default notification model, workflow orchestration, and admin provisioning flows are opinionated in ways that conflict with MercFlow's multi-tenant platform goals.
- Upstream auto-upgrades, which the distribution model relies on, become a liability once we diverge meaningfully from Medusa's assumptions.

A two-week POC (June 2026) validated the technical underpinning:

1. `mercflow_app` PostgreSQL role (NOBYPASSRLS) correctly enforces RLS — zero rows visible without `app.tenant_id` set.
2. MikroORM `EventSubscriber.afterTransactionStart` fires within Medusa module transactions when registered on the module's forked EM.
3. `set_config('app.tenant_id', store_id, true)` injected on the correct Knex transaction connection via `args.transaction` propagates correctly to all subsequent queries in that transaction.
4. `AsyncLocalStorage` (TenantContext) survives through MikroORM's `TransactionContext.run()` — the tenant identity does not leak between requests.

The missing piece the POC could not solve without forking: there is no `store_id` column on Medusa's `product` (or any core) table to write an RLS policy against.

---

## Decision

**Fork Medusa v2 at version 2.14.1 and take full ownership of the codebase.**

MercFlow becomes a platform built *on Medusa's foundation* rather than *on top of Medusa as a dependency*.

---

## Consequences

### What we gain

- Full control over every database table — can add `store_id` to `product`, `order`, `customer`, `cart`, `line_item`, and any other table that needs tenant isolation.
- RLS policies on all core tables — the subscriber + `app.tenant_id` approach (proven by POC) will work end-to-end.
- Ability to replace or extend Medusa's workflow orchestration, notification model, and admin provisioning without workarounds.
- No dependency on Medusa upstream release cadence. Breaking changes on their timeline no longer block us.

### What we accept

- **No automatic upstream upgrades.** Security patches and new Medusa features must be cherry-picked manually. We evaluate upstream changes and selectively apply them.
- **Maintenance cost.** We own the full stack. Any bug in Medusa's core that we build on is our problem to fix.
- **Migration from distribution to fork.** Existing MercFlow modules (`content-module`, `seo-module`, etc.) continue to work as separate packages and register against the forked backend. The fork adds what the distribution model could not provide.

---

## Implementation Plan (ordered)

### Phase 1 — Fork setup
1. Create `mercflow-core` repository (or a `core/` workspace in the monorepo) from Medusa v2.14.1 source.
2. Remove Medusa-specific branding and CI from the fork; set up MercFlow CI.
3. Point `apps/backend` at the forked packages instead of upstream `@medusajs/medusa`.

### Phase 2 — Multi-tenant schema
4. Add `store_id TEXT NOT NULL` to all tenant-scoped tables: `product`, `product_variant`, `product_option`, `product_category`, `order`, `line_item`, `customer`, `address`, `cart`, `cart_line_item`, `payment`, `payment_session`, `fulfillment`, `shipping_method`.
5. Generate migration. Add RLS policies:
   ```sql
   ALTER TABLE product ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON product
     USING (store_id = current_setting('app.tenant_id', true))
     WITH CHECK (store_id = current_setting('app.tenant_id', true));
   ```
6. Repeat for each table in scope.

### Phase 3 — Subscriber wiring at startup
7. Register `TenantIsolationSubscriber` on every module's EM during `onApplicationBootstrap` — one call per module key in `Modules.*`.
8. Wire `tenantIsolationMiddleware` to all store-facing and admin routes that should be tenant-scoped.
9. Add `store_id` extraction from JWT/API key to the middleware.

### Phase 4 — Validation
10. Integration tests: product created under tenant A is invisible to tenant B.
11. Load test: concurrent requests across two tenants do not leak data.
12. Verify `mercflow_app` role has NOBYPASSRLS in production Neon config.

---

## What stays the same

- MercFlow module packages (`content-module`, `seo-module`, etc.) remain in `packages/` and register normally.
- `apps/backend` remains the integration point.
- Design tokens, admin-ui fork, and all other MercFlow work is unaffected.
- ADR-005 (RLS + rate limiting) security requirements are now fully implementable.

---

## Alternatives Considered

**Sidecar-only (rejected):** Keep Medusa as an upstream dependency and only add `store_id` to MercFlow-owned tables. This leaves Medusa's `product`, `order`, and `customer` tables without isolation — unacceptable for a platform that serves multiple merchants on one instance.

**Schema extensions via Medusa DML (rejected):** Medusa's DML does not support adding columns to core entities without modifying the entity definitions, which requires source access. Even if possible, RLS policies on Medusa's tables would need to be managed outside the ORM, creating a fragile split.

**Full rewrite (rejected):** Too slow. Medusa's commerce primitives (product catalog, checkout, fulfillment) are solid. We take the foundation and add platform-layer control on top.
