# ADR-004 — Shared-instance multi-tenancy (SaaS model)

**Date:** 2026-06-04
**Status:** accepted
**Supersedes:** ADR-004-distribution-multi-tenancy.md (previous draft, now invalid)

---

## Context

MercFlow is a SaaS platform: **one Medusa instance + one Neon database** shared by all tenants (shops). Each tenant gets their own admin access and their own storefront frontend. The frontend is the tenant's own repo, built against a MercFlow starter template.

The existing Neon database (currently holding Guapo's data as the first tenant) must be updated to support multiple isolated tenants.

Batch 1 shipped content-module tables **without** tenant isolation. Batch 2 must not do the same. An upfront tenancy migration task is required.

---

## Decision

**SaaS multi-tenancy via `store_id` column isolation** on all MercFlow module tables.

### Tenant discriminator

Use Medusa's built-in `store` entity as the tenant discriminator. Each tenant registers as a Medusa store. `store_id` (Medusa store ID, `text`) is added to every MercFlow-owned table.

### Service layer

All MercFlow service methods **must** accept and filter by `store_id`. Queries without a `store_id` filter are a bug.

### Tenant resolution (request lifecycle)

| Route type | Resolution strategy |
|-----------|---------------------|
| Admin routes (`/admin/*`) | Resolved from JWT / Medusa session → `user.store_id` |
| Public routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`) | Resolved from `Host` header (subdomain mapping) OR `X-Store-Id` header as fallback |
| Storefront API (`/store/*`) | Resolved from `publishable_api_key` (Medusa's existing mechanism) |

Exact resolution strategy for public routes is a Batch 2 task (T-tenancy-routing) — but every public route must be scoped before shipping.

### Public routes with tenant scope

```
GET /sitemap.xml         — tenant scoped by Host header
GET /robots.txt          — tenant scoped by Host header
GET /feed/google-shopping.xml — tenant scoped by Host header
```

If `Host`-based resolution is not configured for a tenant, return `404` (not global data).

### Starter template

MercFlow provides a frontend starter template (separate repo / package). The starter consumes MercFlow public APIs scoped to the tenant's domain. No admin credentials in the starter.

### Neon

Neon is the shared PostgreSQL provider. No per-tenant Neon branching — single DB, row-level isolation via `store_id`. Neon's connection pooler (PgBouncer) sits in front.

---

## Migration impact on Batch 1 tables (verified from Neon `development` branch)

The following tables exist **without `store_id`** and require migration before any Batch 2 task ships:

| Table | Module | Unique index to rebuild | Notes |
|-------|--------|------------------------|-------|
| `article` | content-module | `(slug, locale)` → `(slug, locale, store_id)` | |
| `category_content` | content-module | `(category_id, locale)` → `(category_id, locale, store_id)` | |
| `product_content` | content-module | `(product_id, locale)` → `(product_id, locale, store_id)` | |
| `cms_redirect` | content-module | `from_path` index → `(from_path, store_id)` | |
| `page` | content-module | none exists — add `(slug, locale, store_id)` | |
| `page_block` / `page_version` | content-module | none — inherits scope from `page` | add `store_id` to `page_version` |
| `cms_global` | content-module | `scope` column is global — add `store_id` | |
| `media_asset` | content-module | none — add `store_id` + index | |
| `product_attribute` | content-module | `handle` is global — add `store_id` | |
| `product_attr_link` | content-module | none — add `store_id` | |
| `subscription` | subscription-module | not yet in DB — create with `store_id` | |
| `connector_config` | connector-module | not yet in DB — create with `store_id` | |

### Backfill strategy

**Guapo's `store_id` is known** (verified from Supabase production DB):

```
store_id = store_01KG0VBTT0714XV2CCTEBRVC47   (store name: "Guapo", created 2026-01-27)
```

Backfill procedure:
1. For each MercFlow-owned table: `UPDATE medusa.<table> SET store_id = 'store_01KG0VBTT0714XV2CCTEBRVC47' WHERE store_id IS NULL`
2. `ALTER TABLE medusa.<table> ALTER COLUMN store_id SET NOT NULL`
3. Enable RLS + policy (see ADR-005)

All Batch 2 tables created from day one with `store_id NOT NULL` + RLS enabled.

### Additional Guapo-specific tables requiring store_id

The following Guapo-custom tables exist in the production `medusa` schema and also lack `store_id`:

| Table | Purpose |
|-------|---------|
| `brand` | Brand entity (Guapo-specific) |
| `product_product_brand_brand` | Product–brand link |
| `product_review` | Customer reviews |
| `product_review_image`, `product_review_response`, `product_review_stats` | Review sub-tables |
| `guapo_free_shipping_setting` | Free shipping config |
| `shipmondo_enabled_products` | Shipmondo product-level config |

These tables are Guapo's own — not MercFlow standard modules. They follow the same `store_id` rule when MercFlow is multi-tenanted. Include in M0 backfill migration.

### PayloadCMS schema (Guapo storefront layer)

Guapo's production Supabase DB contains a `payload` schema with ~150 PayloadCMS tables (articles, pages, homepage blocks, navigation, brands, categories, products, media, etc.). This is Guapo's current storefront CMS.

**This is Guapo-specific infrastructure, not MercFlow standard.** The `payload` schema:
- Lives alongside Medusa in the same Supabase DB
- Is not managed by MercFlow content-module
- Represents the migration target: Payload → MercFlow content-module (future, not Batch 2)
- Does NOT need `store_id` migration in M0 (Payload is already single-tenant Guapo-only)

Note for `/to-backlog`: M0 only touches `medusa.*` tables. Payload migration is out of scope for all Batches until explicitly tasked.

---

## Scope

| Kind | Path / pattern |
|------|----------------|
| All module tables | `packages/*/src/**/*.ts` model definitions |
| All module services | `packages/*/src/services/*.ts` |
| Public routes | `apps/backend/src/api/*` + module route handlers |
| Admin UI | Tenant context injected from auth session — no hardcoded store |

---

## Enforcement

| Mechanism | Tool / hook | What it checks |
|-----------|-------------|----------------|
| Migration decision log | Required in every migration file | `store_id` presence documented |
| Code review gate | Harness `harness/review` | Every new table has `store_id`; every service query filters by it |
| Lint / arch rule | Add `eslint` rule when feasible | Service layer cannot call DB without `store_id` arg |

**Local command:** `rg "store_id" packages/*/src/models/` — every model file must match.
**CI command:** same (add to `ci.yml` when tenancy migration ships).

---

## How to fix

1. Missing `store_id` on a new table: add column in migration (DML + decision log), update service method signature.
2. Service method missing filter: add `{ store_id }` to every query in that method; update tests.
3. Public route returning cross-tenant data: add host-resolution middleware before route handler.

**Related ADRs:** ADR-003 (module split), ADR-002 (branch model)
**Related PRD section:** "Multi-tenant deployment model", "Tenancy foundation milestone"

---

## Consequences

**Good:**
- One infrastructure to manage; tenants onboarded without new deployments
- Neon + Medusa stay as single source of truth
- Single infrastructure; tenants onboarded without new deployments

**Bad / trade-offs:**
- Batch 1 tables need migration before Batch 2 ships (blocking task, ~1 sprint)
- All service methods must carry `store_id` — extra discipline required in code review
- Medusa core tables (product, category, order, inventory) are NOT tenant-isolated by MercFlow — they use Medusa's own sales-channel/region model; MercFlow only isolates its own module tables
- Medusa admin itself may show cross-tenant data if MercFlow does not gate admin routes properly — requires explicit admin middleware per module

---

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Distribution (one instance per shop) | User confirmed SaaS model with shared Neon DB |
| Neon branching per tenant | Increases connection overhead; user confirmed single DB row-level isolation |
| Schema-per-tenant (Postgres schemas) | Complex migrations; Medusa DML doesn't support schema switching |
