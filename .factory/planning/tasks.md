# Tasks — MercFlow Batch 2

> Atomic tasks for harness execution. One task = one PR to `development`.
> Status: `todo` | `in-progress` | `blocked` | `done`
> Mode: `AFK` | `HITL`
> Updated: 2026-06-04

---

## M000 — Tenancy Foundation

---

## T001 — Backfill `store_id` + rebuild unique indexes on all Batch 1 + Guapo-custom tables

**Sprint:** S001
**Milestone:** M000
**Status:** todo
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S001/T001-tenancy-backfill-store-id
**PRD journey:** —
**ADRs:** ADR-004

### Slice objective

All MercFlow-owned and Guapo-custom tables in the `medusa` schema have `store_id NOT NULL` with Guapo's data backfilled, and all four broken unique indexes rebuilt to include `store_id`.

### Layers in scope

- DB: migrations for all 17 tables below
- Service: no changes (RLS in T002)
- API: no changes
- UI: no changes
- Tests: verify row counts unchanged post-backfill; verify unique constraint catches cross-tenant duplicate

### Tables — MercFlow Batch 1 (10)

| Table | Migration action |
|-------|-----------------|
| `article` | Add `store_id text`, backfill, NOT NULL, drop `(slug, locale)` unique, add `(slug, locale, store_id)` unique |
| `category_content` | Add `store_id text`, backfill, NOT NULL, drop `(category_id, locale)` unique, add `(category_id, locale, store_id)` unique |
| `product_content` | Add `store_id text`, backfill, NOT NULL, drop `(product_id, locale)` unique, add `(product_id, locale, store_id)` unique |
| `cms_redirect` | Add `store_id text`, backfill, NOT NULL, add `(from_path, store_id)` index |
| `cms_global` | Add `store_id text`, backfill, NOT NULL, add `(scope, store_id)` unique |
| `media_asset` | Add `store_id text`, backfill, NOT NULL, index on `store_id` |
| `page` | Add `store_id text`, backfill, NOT NULL, add `(slug, locale, store_id)` unique |
| `page_version` | Add `store_id text`, backfill, NOT NULL |
| `page_block` | Add `store_id text`, backfill, NOT NULL |
| `product_attribute` | Add `store_id text`, backfill, NOT NULL, add `(handle, store_id)` unique |
| `product_attr_link` | Add `store_id text`, backfill, NOT NULL |

### Tables — Guapo-custom (7)

| Table | Migration action |
|-------|-----------------|
| `brand` | Add `store_id text`, backfill, NOT NULL |
| `product_product_brand_brand` | Add `store_id text`, backfill, NOT NULL |
| `product_review` | Add `store_id text`, backfill, NOT NULL |
| `product_review_image` | Add `store_id text`, backfill, NOT NULL |
| `product_review_response` | Add `store_id text`, backfill, NOT NULL |
| `product_review_stats` | Add `store_id text`, backfill, NOT NULL |
| `guapo_free_shipping_setting` | Add `store_id text`, backfill, NOT NULL |

Backfill value: `store_01KG0VBTT0714XV2CCTEBRVC47`

### Acceptance criteria

- [ ] `SELECT count(*) FROM medusa.article WHERE store_id IS NULL` returns 0
- [ ] Same check passes for all 17 tables
- [ ] Inserting a duplicate (slug, locale) for a different `store_id` succeeds
- [ ] Inserting a duplicate (slug, locale) for the same `store_id` fails with constraint error
- [ ] `pnpm migration:run` clean on fresh local DB

### Out of scope

- `payload.*` tables (Guapo-specific, single-tenant PayloadCMS — never modified by MercFlow)
- `subscription` table (already in MercFlow codebase but add `store_id` here too if missing)
- RLS (T002)

### Context for implementing agent

- Guapo DB: Supabase project `tknxlzoejhauuzloezfi`, `medusa` schema
- Guapo `store_id`: `store_01KG0VBTT0714XV2CCTEBRVC47`
- Use Medusa DML migration tooling; add MIGRATION DECISION LOG to every migration file
- All migrations are reversible — implement `down()` that drops `store_id` column
- Verify each table's current column list before adding (some may differ from dev branch)

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] Migration files have MIGRATION DECISION LOG comments
- [ ] `down()` implemented in every migration
- [ ] PR description filled in

---

## T002 — Enable RLS + tenant isolation policies on all MercFlow tables

**Sprint:** S001
**Milestone:** M000
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T001
**Branch:** feature/S001/T002-rls-tenant-policies
**PRD journey:** —
**ADRs:** ADR-004, ADR-005

### Slice objective

Every MercFlow-owned table in `medusa` schema has Row Level Security enabled with a `tenant_isolation` policy — a DB-level defence that prevents cross-tenant data access even if application code has a missing `store_id` filter.

### Layers in scope

- DB: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY tenant_isolation` for each table
- Service: add `SET LOCAL app.store_id = ?` transaction wrapper to all module service base classes
- API: no changes
- UI: no changes
- Tests: verify query without `SET LOCAL` returns no rows; verify query with correct `store_id` returns own rows only

### RLS policy pattern

```sql
ALTER TABLE medusa.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE medusa.<table> FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON medusa.<table>
  USING (store_id = current_setting('app.store_id', true));
```

Service base class wrapper:
```ts
async withTenant<T>(storeId: string, fn: () => Promise<T>): Promise<T> {
  return this.manager_.transaction(async (em) => {
    await em.execute(`SET LOCAL app.store_id = '${storeId}'`);
    return fn();
  });
}
```

### Tables in scope

All 17 tables from T001 where MercFlow owns the service layer. Guapo-custom tables (brand, product_review, etc.) get RLS enabled but service wrapper is optional in M000 (they have no MercFlow service yet).

### Acceptance criteria

- [ ] `SELECT * FROM medusa.article` without `SET LOCAL` returns 0 rows
- [ ] `SET LOCAL app.store_id = 'store_01KG0VBTT0714XV2CCTEBRVC47'; SELECT * FROM medusa.article` returns correct rows
- [ ] Service method in content-module uses `withTenant` wrapper
- [ ] No `console.log` or debug artifacts

### Out of scope

- Medusa core tables (product, order, cart, etc.) — Medusa manages those
- `payload.*` tables

### Context for implementing agent

- See ADR-005 for full RLS enforcement strategy
- Service base class lives in `packages/content-module/src/services/`
- Use `FORCE ROW LEVEL SECURITY` to prevent bypass by superuser connections

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] No secrets or debug artifacts
- [ ] PR description filled in

---

## T003 — Rate limiting middleware + Neon IP allowlist

**Sprint:** S001
**Milestone:** M000
**Status:** done
**Mode:** HITL
**Parallel group:** C
**Blocked by:** T002
**Branch:** feature/S001/T003-rate-limiting
**PR:** #53
**PRD journey:** —
**ADRs:** ADR-005

**HITL reason:** Ops step required — human must add Railway egress IPs to Neon `allowed_ips` in Neon console (cannot be done via code). Agent implements rate limiting middleware; human completes the infrastructure step.

### Slice objective

Public routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`) return `429` after 60 req/min/IP. Store API returns `429` after 300 req/min/publishable_api_key. Neon project IP allowlist set to Railway egress IPs.

### Layers in scope

- DB: no changes
- Service: no changes
- API: Medusa middleware in `apps/backend/src/api/middlewares/` — rate-limit middleware
- UI: no changes
- Tests: smoke test — 61 requests to `/sitemap.xml` → last returns `429` with `Retry-After` header

### Rate limits

| Route pattern | Limit | Key |
|---------------|-------|-----|
| `GET /sitemap.xml` | 60/min | IP |
| `GET /robots.txt` | 60/min | IP |
| `GET /feed/*` | 60/min | IP |
| `GET /store/*` | 300/min | `publishable_api_key` |

### Acceptance criteria

- [x] `429 Too Many Requests` with `Retry-After: 60` header returned after threshold
- [x] Limits configurable via env vars (`RATE_LIMIT_PUBLIC_RPM`, `RATE_LIMIT_STORE_RPM`)
- [ ] Human confirms Neon `block_public_connections` discussion (note in PR if private link not yet available)

### HITL checkpoint

Before merging: human adds Railway static egress IPs to Neon project `allowed_ips` in [Neon console](https://console.neon.tech/app/projects/young-waterfall-54245022) → Settings → Allowed IPs.

### Out of scope

- Redis-backed rate limiting (use in-memory with TTL for M000; Redis is Phase 2)
- Admin route rate limiting (Medusa handles login throttling)

### Context for implementing agent

- Medusa middleware docs: middlewares registered in `apps/backend/src/api/middlewares.ts`
- Use `@medusajs/utils` request context for `publishable_api_key` extraction
- Env vars: `RATE_LIMIT_PUBLIC_RPM` (default 60), `RATE_LIMIT_STORE_RPM` (default 300)

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] No secrets or debug artifacts
- [x] PR description filled in
- [ ] HITL: Railway IPs added to Neon allowlist (human step, documented in PR)

---

## M001 — SEO Infrastructure / S002

---

## T004 — `seo-module` package scaffold + DB schema + service base

**Sprint:** S002
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** feature/S002/T004-seo-module-scaffold
**PRD journey:** J001, J002
**ADRs:** ADR-003, ADR-004, ADR-005

### Slice objective

`@mercflow/seo-module` package exists, is registered in `apps/backend`, has its initial DB tables (`mercflow_seo_config`, `mercflow_redirect`) with `store_id NOT NULL` + RLS from day one, and exposes a working service base.

### Layers in scope

- DB: `mercflow_seo_config` (store_id, storefront_url, slug_strategy, org_name, org_logo_url, org_social_urls jsonb), `mercflow_redirect` (store_id, from_path, to_path, type, created_at)
- Service: `SeoConfigService`, `RedirectService` — both scoped by `store_id`
- API: no public routes yet (T006, T009-T011 add them)
- UI: no changes
- Tests: unit tests for service CRUD, verify `store_id` filter

### Acceptance criteria

- [ ] `pnpm typecheck` passes across monorepo with new package
- [ ] `pnpm migration:run` creates `mercflow_seo_config` and `mercflow_redirect` tables with `store_id NOT NULL`
- [ ] RLS enabled on both tables (same pattern as T002)
- [ ] `SeoConfigService.get(storeId)` returns correct config
- [ ] Package README created

### Out of scope

- Admin UI (T005, T007)
- Public routes (T006, T009, T011)
- Sitemap, robots, JSON-LD tables (later tasks)

### Context for implementing agent

- Follow `packages/content-module` as pattern for module scaffold
- Use Medusa DML `model.define` — no raw MikroORM entities
- Extend `MedusaService` for service classes
- `seo-module` registered in `apps/backend/medusa-config.ts`
- ADR-003: seo-module owns redirect, sitemap-config, robots-config, slug utility

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] Migration has DECISION LOG comment
- [ ] Package README with responsibility, run/test, field definitions
- [ ] PR description filled in

---

## T005 — Nordic slug utility — Settings UI + service

**Sprint:** S002
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T004
**Branch:** feature/S002/T005-nordic-slug-utility
**PRD journey:** J001
**ADRs:** ADR-003, ADR-004

### Slice objective

Admin can choose a slug strategy (Nordic: ø→oe, or Omit: ø→o) in Settings. The strategy is stored per tenant in `mercflow_seo_config`. All new product/category slug generation runs through the seo-module slug utility.

### Layers in scope

- DB: `slug_strategy` field on `mercflow_seo_config` (already in T004 table)
- Service: `SlugUtility` — pure function + service method; replaces Medusa default slug generation
- API: `GET /admin/seo-config` (read), `PUT /admin/seo-config` (update strategy)
- UI: Settings → SEO → Slug strategy selector + live preview input
- Tests: unit tests for ø→oe, æ→ae, å→aa, spaces→hyphen, special char removal

### Transliteration rules

| Input | Nordic output | Omit output |
|-------|--------------|-------------|
| ø / Ø | oe | o |
| æ / Æ | ae | a |
| å / Å | aa | a |
| é, è, ê | e | e |
| ü, ö, ä | ue, oe, ae | u, o, a |
| space | - | - |
| special chars | removed | removed |

### Acceptance criteria

- [ ] Slug utility correctly transforms all Nordic characters per strategy
- [ ] Admin saves strategy → subsequent product saves use new strategy
- [ ] Live preview works (type a name, see slug)
- [ ] Utility is pure and importable by content-module (no circular dep)

### Out of scope

- Bulk re-slug of existing products (T005 only handles new slugs; bulk is a follow-up)
- Auto-redirect on re-slug (T006)

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] No secrets or debug artifacts
- [ ] PR description filled in

---

## T006 — 301 Redirect backend — service + middleware + subscriber

**Sprint:** S002
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T004
**Branch:** feature/S002/T006-redirect-backend
**PRD journey:** J002
**ADRs:** ADR-003, ADR-004

### Slice objective

When a product or category slug changes, a 301 redirect is automatically created from the old path to the new. Incoming requests matching a redirect are intercepted by Medusa middleware and returned as 301 responses. Redirect records are scoped by `store_id`.

### Layers in scope

- DB: `mercflow_redirect` (already in T004)
- Service: `RedirectService.create`, `findByFromPath(storeId, path)`, chain detection
- API: Medusa middleware — intercepts all requests, checks redirect table, returns 301
- Subscriber: listens on `product.updated` and `product_category.updated` events → creates redirect if slug changed
- Tests: slug change → redirect created; incoming request → 301 response; chain detection warning

### Acceptance criteria

- [ ] Product slug change → `mercflow_redirect` row created automatically
- [ ] `GET /old-slug` → `301 Location: /new-slug`
- [ ] Redirect scoped to tenant (no cross-tenant redirect leakage)
- [ ] Chain detection: redirect pointing to another redirect logs warning
- [ ] Redirect middleware runs before Medusa route resolution

### Out of scope

- Admin UI (T007)
- Bulk CSV import (backlog)
- Wildcard/regex redirects (non-goal)

### Context for implementing agent

- Medusa subscriber pattern: `packages/content-module/src/subscribers/` for reference
- Middleware registered in `apps/backend/src/api/middlewares.ts`
- Tenant resolved from `Host` header in middleware (use seo-module tenant resolution — T008 HITL pending, implement stub for now that reads `X-Store-Id` header as fallback for local testing)

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] No secrets or debug artifacts
- [ ] PR description filled in

---

## T007 — 301 Redirect admin UI — list, create, delete, chain warning

**Sprint:** S002
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T006
**Branch:** feature/S002/T007-redirect-admin-ui
**PRD journey:** J002
**ADRs:** ADR-004

### Slice objective

Admin can view all redirects for their tenant, create manual redirects, delete stale ones, and see a warning badge on redirects with chain issues.

### Layers in scope

- DB: no changes
- Service: no changes
- API: `GET /admin/redirects`, `POST /admin/redirects`, `DELETE /admin/redirects/:id`
- UI: SEO → Redirects page — table with source, destination, date, type (auto/manual), chain warning; create form; delete
- Tests: happy path create + delete; chain warning visible for chained redirect

### Acceptance criteria

- [ ] Redirect list shows all tenant redirects (no other tenant data)
- [ ] Manual redirect created via form → appears in list + works as 301
- [ ] Delete removes redirect; subsequent request returns 404 (or passes through)
- [ ] Chain warning badge visible when destination is itself a redirect

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] No secrets or debug artifacts
- [ ] PR description filled in

---

## M001 — SEO Infrastructure / S003

---

## T008 — Tenant resolution middleware — Host → store_id mapping

**Sprint:** S003
**Milestone:** M001
**Status:** todo
**Mode:** HITL
**Parallel group:** A
**Blocked by:** T004
**Branch:** feature/S003/T008-tenant-resolution-middleware
**PRD journey:** —
**ADRs:** ADR-004

**HITL reason:** Architecture decision required — how is the `Host → store_id` mapping stored and managed? Options: (A) `mercflow_seo_config.storefront_url` column used as lookup, (B) dedicated `mercflow_tenant_host` table, (C) env var mapping for single-tenant mode. Decision affects all subsequent public routes (T009, T011, T017, T018).

### Slice objective

All public MercFlow routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`) resolve the correct `store_id` from the `Host` request header before the route handler runs. Returns `404` if no tenant is found for that host.

### HITL checkpoint

Before implementing: human approves the host-mapping strategy (A, B, or C above). Default recommendation: (A) — `mercflow_seo_config.storefront_url` stripped to hostname, indexed. Confirm before T008 goes AFK.

### Layers in scope

- DB: `storefront_url` index on `mercflow_seo_config` (already in T004 if recommendation A is approved)
- Service: `TenantResolver.resolveFromHost(host): Promise<string | null>`
- API: Medusa middleware applied to `/sitemap.xml`, `/robots.txt`, `/feed/*` routes
- UI: no changes
- Tests: known host → correct store_id; unknown host → 404

### Acceptance criteria

- [ ] `GET /sitemap.xml` with `Host: guapo.dk` resolves to `store_01KG0VBTT0714XV2CCTEBRVC47`
- [ ] `GET /sitemap.xml` with unknown host → `404`
- [ ] Resolution is cached (TTL 60s) to avoid DB hit per request

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests written and passing
- [ ] No secrets or debug artifacts
- [ ] PR description filled in
- [ ] HITL: host mapping strategy confirmed by human before PR opens

---

## T009 — Sitemap service + `GET /sitemap.xml` + config table

**Sprint:** S003
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T008
**Branch:** feature/S003/T009-sitemap-service
**PRD journey:** J003
**ADRs:** ADR-003, ADR-004, ADR-005

### Slice objective

`GET /sitemap.xml` returns a valid, tenant-scoped XML sitemap based on Medusa's product and category catalogue plus MercFlow pages. Config (priority, changefreq, exclusions) stored per tenant in `mercflow_sitemap_config`.

### Layers in scope

- DB: `mercflow_sitemap_config` (store_id NOT NULL, RLS, priority/changefreq per page type, exclusion lists jsonb)
- Service: `SitemapService.generate(storeId)` — pulls products, categories, pages from Medusa + content-module; applies config; returns XML string
- API: `GET /sitemap.xml` — tenant-scoped via T008 middleware; cached with invalidation on catalogue events
- UI: no changes (admin UI in T010)
- Tests: valid XML output; excluded product absent; correct `<loc>` uses `storefront_url` from `mercflow_seo_config`

### Acceptance criteria

- [ ] Valid XML sitemap returned for Guapo tenant
- [ ] `<loc>` tags use tenant's `storefront_url` (no hardcoded `guapo.dk`)
- [ ] Excluded product/category absent from sitemap
- [ ] Cache invalidated within 30s of product create/update/delete
- [ ] Different tenant gets different sitemap

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Tests: XML validity + cross-tenant isolation
- [ ] Migration DECISION LOG + `down()` implemented
- [ ] PR description filled in

---

## T010 — Sitemap admin UI — config, priority, exclusions, preview, regenerate

**Sprint:** S003
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T009
**Branch:** feature/S003/T010-sitemap-admin-ui
**PRD journey:** J003

### Slice objective

Admin can configure sitemap priority/changefreq per page type, exclude specific products or categories, preview the generated XML, and manually trigger regeneration.

### Layers in scope

- DB: no changes
- Service: no changes
- API: `GET /admin/sitemap-config`, `PUT /admin/sitemap-config`, `POST /admin/sitemap/regenerate`
- UI: SEO → Sitemap — config form, exclusion multi-select, XML preview panel, "Regenerate" button, last-updated timestamp
- Tests: config save → subsequent sitemap reflects changes

### Acceptance criteria

- [ ] Priority and changefreq configurable per page type
- [ ] Excluded product absent after next regeneration
- [ ] XML preview matches `GET /sitemap.xml` output
- [ ] "Regenerate" button triggers cache invalidation

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T011 — Robots.txt service + `GET /robots.txt` + config table

**Sprint:** S003
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T008
**Branch:** feature/S003/T011-robots-service
**PRD journey:** J004
**ADRs:** ADR-003, ADR-004, ADR-005

### Slice objective

`GET /robots.txt` returns tenant-scoped robots.txt generated from `mercflow_robots_config`. Config stored per tenant with change history.

### Layers in scope

- DB: `mercflow_robots_config` (store_id NOT NULL, RLS, rules jsonb, freetext_override text, history jsonb)
- Service: `RobotsService.render(storeId)` — generates robots.txt from config; auto-inserts sitemap reference
- API: `GET /robots.txt` — tenant-scoped; served with `Content-Type: text/plain`
- UI: no changes (T012)
- Tests: correct output for allow/block rules; sitemap line auto-inserted; cross-tenant isolation

### Acceptance criteria

- [ ] Valid `robots.txt` returned for Guapo tenant
- [ ] Different tenant returns different robots.txt (or 404 if unconfigured)
- [ ] Sitemap URL auto-inserted using tenant's `storefront_url`

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] Migration DECISION LOG + `down()` implemented
- [ ] PR description filled in

---

## T012 — Robots.txt admin UI — structured editor + preview + history

**Sprint:** S003
**Milestone:** M001
**Status:** todo
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T011
**Branch:** feature/S003/T012-robots-admin-ui
**PRD journey:** J004

### Slice objective

Admin can manage robots.txt rules via a structured UI (allow/block per path and bot), toggle to freetext mode, preview the output, and view change history.

### Layers in scope

- API: `GET /admin/robots-config`, `PUT /admin/robots-config`
- UI: SEO → Robots.txt — structured editor, freetext toggle, preview panel, history list
- Tests: save structured rule → correct robots.txt output

### Acceptance criteria

- [ ] Structured rule (allow Googlebot to `/`) renders correctly in preview + live endpoint
- [ ] Freetext override replaces structured output
- [ ] Change history shows last 10 changes with timestamp

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## M002 — SEO Metadata / S004

---

## T013 — Global per-tenant config — storefront_url, org name, logo, socials

**Sprint:** S004
**Milestone:** M002
**Status:** todo
**Mode:** HITL
**Parallel group:** A
**Blocked by:** T004
**Branch:** feature/S004/T013-global-tenant-config
**PRD journey:** J005, J006
**ADRs:** ADR-003, ADR-004

**HITL reason:** Architecture decision — `storefront_url` and org identity already exist on `mercflow_seo_config` (from T004). Confirm whether this is sufficient or a separate `mercflow_global_config` table is needed. Open question from PRD. Decision affects JSON-LD (T014), OG (T015), feed (T017).

### Slice objective

Admin can set their store's `storefront_url`, organisation name, logo URL, and social profile URLs in Settings. These values are available to JSON-LD generation and feed module.

### HITL checkpoint

Before implementing: confirm `mercflow_seo_config` carries these fields (already in T004 schema) or a separate `mercflow_global_config` table is needed. If separate table, define in this task. Human approves before PR.

### Layers in scope

- DB: confirm or extend `mercflow_seo_config` fields
- API: `PUT /admin/seo-config` (extend with org fields if not already)
- UI: Settings → SEO → Organisation section (name, logo URL, social URLs)
- Tests: save org config → JSON-LD generation uses correct values

### Acceptance criteria

- [ ] Org name/logo/socials saved and returned per tenant
- [ ] No cross-tenant org data in any API response
- [ ] Fields empty-state safe (JSON-LD `Organization` block skipped if name not set)

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] HITL: table ownership confirmed by human before PR opens
- [ ] PR description filled in

---

## T014 — JSON-LD structured data — Product, Category, Organization, WebSite

**Sprint:** S004
**Milestone:** M002
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T013
**Branch:** feature/S004/T014-json-ld-generation
**PRD journey:** J005
**ADRs:** ADR-003, ADR-004

### Slice objective

Storefront can request JSON-LD blocks from the MercFlow API. Product pages get `Product` + `Offer` schema. Category pages get `BreadcrumbList`. All pages get `Organization` + `WebSite` schema. All values are tenant-scoped.

### Layers in scope

- DB: no new tables
- Service: `JsonLdService.forProduct(storeId, productId)`, `forCategory(storeId, categoryId)`, `global(storeId)`
- API: `GET /store/seo/json-ld/product/:id`, `GET /store/seo/json-ld/category/:id`, `GET /store/seo/json-ld/global`
- UI: toggle in admin SEO settings to enable/disable JSON-LD per page type
- Tests: correct schema output; cross-tenant isolation; empty-state (missing org name → Organization block absent)

### Acceptance criteria

- [ ] `Product` schema includes name, description, image, sku, price, currency, availability
- [ ] `BreadcrumbList` reflects full category path
- [ ] `Organization` absent if org name not configured
- [ ] All `url` fields use tenant's `storefront_url` — never hardcoded

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T015 — Open Graph & Social Meta

**Sprint:** S004
**Milestone:** M002
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T013
**Branch:** feature/S004/T015-og-social-meta
**PRD journey:** J006

### Slice objective

Storefront can request OG and Twitter Card meta values from MercFlow API. All values tenant-scoped, with fallback logic if SEO fields are empty.

### Layers in scope

- Service: `OgMetaService.forProduct(storeId, productId)`, `forCategory`
- API: `GET /store/seo/og/product/:id`, `GET /store/seo/og/category/:id`
- UI: social share preview in product Content tab
- Tests: OG values correct; fallback to product title when `seo_title` empty

### Acceptance criteria

- [ ] `og:title`, `og:description`, `og:image` correct for product
- [ ] Fallback: if `seo_title` empty → product title used
- [ ] Twitter Card tags included
- [ ] No cross-tenant data

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T016 — Canonical URL handling

**Sprint:** S004
**Milestone:** M002
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T013
**Branch:** feature/S004/T016-canonical-url
**PRD journey:** J007

### Slice objective

Storefront can request the canonical URL for any product or category. Auto-calculated from slug + tenant `storefront_url`. Manual override stored in `product_content` / `category_content`.

### Layers in scope

- DB: `canonical_url_override text nullable` on `product_content` and `category_content` (migration)
- Service: `CanonicalService.forProduct(storeId, productId)` — returns override or auto-calculated URL
- API: `GET /store/seo/canonical/product/:id`, `GET /store/seo/canonical/category/:id`
- UI: canonical URL field in product/category Content tab
- Tests: auto-calculation correct; override takes precedence; conflict detection warning

### Acceptance criteria

- [ ] Canonical URL uses tenant `storefront_url` as base — never hardcoded
- [ ] Manual override saved and returned
- [ ] Admin warned if potential canonical conflict detected

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] Migration DECISION LOG + `down()`
- [ ] PR description filled in

---

## M003 — Shopping Feed / S005

---

## T017 — `feed-module` scaffold + DB schema + feed-config table

**Sprint:** S005
**Milestone:** M003
**Status:** todo
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** feature/S005/T017-feed-module-scaffold
**PRD journey:** J008
**ADRs:** ADR-003, ADR-004, ADR-005

### Slice objective

`@mercflow/feed-module` package exists, registered in `apps/backend`, `mercflow_feed_config` table with `store_id NOT NULL` + RLS, and a `FeedConfigService`.

### Layers in scope

- DB: `mercflow_feed_config` (store_id NOT NULL, RLS, storefront_url, excluded_product_ids jsonb, excluded_category_ids jsonb, default_condition text)
- Service: `FeedConfigService.get(storeId)`, `FeedConfigService.update(storeId, config)`
- Tests: service CRUD, `store_id` filter

### Acceptance criteria

- [ ] Package scaffolded, typechecks, migrations run clean
- [ ] `store_id NOT NULL` + RLS on `mercflow_feed_config`
- [ ] Package README created

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] Migration DECISION LOG + `down()`
- [ ] Package README
- [ ] PR description filled in

---

## T018 — Google Shopping XML feed + `GET /feed/google-shopping.xml`

**Sprint:** S005
**Milestone:** M003
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T017
**Branch:** feature/S005/T018-feed-xml-generation
**PRD journey:** J008
**ADRs:** ADR-004

### Slice objective

`GET /feed/google-shopping.xml` returns a valid, tenant-scoped Google Shopping XML feed. Auto-cached, invalidated on catalogue changes.

### Layers in scope

- DB: no new tables
- Service: `FeedGeneratorService.generate(storeId)` — maps Medusa variants + content-module fields to feed items
- API: `GET /feed/google-shopping.xml` — tenant-scoped via T008 middleware; `Content-Type: application/xml`
- Tests: valid XML; excluded product absent; `link` field uses tenant `storefront_url`; cross-tenant isolation

### Feed field mapping

| Feed field | Source |
|-----------|--------|
| `id` | `variant.sku` |
| `title` | `product.title` (locale-aware) |
| `description` | `product.seo_description` → fallback `product.description` |
| `link` | `storefront_url + product.handle` |
| `image_link` | First media_gallery image |
| `price` | `variant.price` + region currency |
| `availability` | Derived from inventory |
| `brand` | `brand.name` via product_product_brand_brand |

### Acceptance criteria

- [ ] Valid Google Shopping XML output
- [ ] `link` and `image_link` use tenant's `storefront_url`
- [ ] Excluded products absent
- [ ] Cache invalidated within 30s of product change
- [ ] No cross-tenant products in response

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T019 — Feed admin UI — overview, exclusions, feed URL, validation report

**Sprint:** S005
**Milestone:** M003
**Status:** todo
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T018
**Branch:** feature/S005/T019-feed-admin-ui
**PRD journey:** J008

### Slice objective

Admin can view feed status (product count, last updated, validation errors), exclude products/categories, and copy the feed URL.

### Layers in scope

- API: `GET /admin/feed-config`, `PUT /admin/feed-config`, `GET /admin/feed/validate`
- UI: Feed → Overview page — stats, feed URL copy button, exclusion config, validation report table
- Tests: exclusion saved → excluded from feed; validation report shows missing fields

### Acceptance criteria

- [ ] Feed URL correct and copyable
- [ ] Validation report lists products with missing required fields
- [ ] Excluded product absent from next feed generation

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## M004 — Inventory & Purchase Orders / S006

---

## T020 — `inventory-module` scaffold + DB schema (suppliers, POs, receipts, inventory config)

**Sprint:** S006
**Milestone:** M004
**Status:** todo
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** feature/S006/T020-inventory-module-scaffold
**PRD journey:** J009, J010, J011
**ADRs:** ADR-003, ADR-004, ADR-005

### Slice objective

`@mercflow/inventory-module` package exists with all DB tables (`store_id NOT NULL` + RLS) and service skeletons.

### Tables

| Table | Columns |
|-------|---------|
| `mercflow_supplier` | id, store_id, name, contact_person, email, country, currency, created_at, updated_at, deleted_at |
| `mercflow_purchase_order` | id, store_id, supplier_id, status (draft/ordered/partially_received/received/cancelled), expected_date, reference, notes, created_at, updated_at, deleted_at |
| `mercflow_purchase_order_line` | id, store_id, po_id, variant_id, ordered_qty, unit_cost, created_at, updated_at |
| `mercflow_purchase_order_receipt` | id, store_id, line_id, received_qty, received_at, notes |
| `mercflow_inventory_config` | id, store_id, low_stock_threshold (default 5), email_alerts_enabled |

### Acceptance criteria

- [ ] All tables with `store_id NOT NULL` + RLS
- [ ] `pnpm migration:run` clean
- [ ] Package README

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] All migrations have DECISION LOG + `down()`
- [ ] Package README
- [ ] PR description filled in

---

## T021 — Supplier register CRUD — admin UI + API

**Sprint:** S006
**Milestone:** M004
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T020
**Branch:** feature/S006/T021-supplier-register
**PRD journey:** J009

### Slice objective

Admin can create, edit, and delete suppliers. Supplier list available as dropdown in PO creation form.

### Layers in scope

- Service: `SupplierService` CRUD
- API: `GET /admin/suppliers`, `POST /admin/suppliers`, `PATCH /admin/suppliers/:id`, `DELETE /admin/suppliers/:id`
- UI: Inventory → Suppliers — list, create/edit form, delete
- Tests: CRUD happy path; `store_id` isolation (no other tenant's suppliers visible)

### Acceptance criteria

- [ ] Supplier CRUD works end-to-end
- [ ] Supplier list is tenant-scoped

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T022 — Purchase Order create + list + status management

**Sprint:** S006
**Milestone:** M004
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T020
**Branch:** feature/S006/T022-purchase-order-create
**PRD journey:** J010

### Slice objective

Admin can create a PO (select supplier, add lines, set expected date, reference, notes), view PO list with status, and move PO from `draft` to `ordered`.

### Layers in scope

- Service: `PurchaseOrderService.create`, `list`, `updateStatus`
- API: `GET /admin/purchase-orders`, `POST /admin/purchase-orders`, `PATCH /admin/purchase-orders/:id/status`
- UI: Inventory → Purchase Orders — list with status badges, create form (supplier dropdown, variant lines, date, reference, notes)
- Tests: create PO → appears in list; status transition draft→ordered

### Acceptance criteria

- [ ] PO created with supplier, lines, date, reference
- [ ] PO list tenant-scoped
- [ ] Status transition draft → ordered works

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## M004 — Inventory & Purchase Orders / S007

---

## T023 — PO receive flow + inventory boundary decision

**Sprint:** S007
**Milestone:** M004
**Status:** todo
**Mode:** HITL
**Parallel group:** A
**Blocked by:** T022
**Branch:** feature/S007/T023-po-receive-flow
**PRD journey:** J010
**ADRs:** ADR-004

**HITL reason:** Must confirm whether PO receipt auto-updates Medusa `inventory_item` quantity (requires Medusa stock mutation) or only creates a MercFlow receipt record (UI shows incoming vs stocked separately). This is the open question from PRD. The API and UI boundary must be explicit before implementation. Human approves approach.

### Slice objective

Admin can record receipt for a PO (actual qty per line, notes). Partial receipt leaves PO in `partially_received`. Full receipt marks `received`. Receipt creates `mercflow_purchase_order_receipt` records. Boundary between MercFlow records and Medusa stock is explicit.

### HITL checkpoint

Before implementing: decide — does `receive` also call Medusa `createReservationItem` / adjust `inventory_item`? Or does it only record in MercFlow tables? Recommendation: create MercFlow receipt record only in M000; Medusa stock adjustment as explicit separate step in UI (operator clicks "Apply to stock" separately). Human confirms.

### Acceptance criteria

- [ ] Admin opens PO → enters received qty per line → submits
- [ ] Discrepancy clearly shown (ordered 100, received 94 → -6 flagged)
- [ ] Partial receipt leaves PO `partially_received`
- [ ] UI explicitly labels whether stock has been applied or not
- [ ] `store_id` isolation on all receipt records

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] HITL: stock mutation decision confirmed and documented in PR
- [ ] PR description filled in

---

## T024 — Inventory Dashboard — stocked / reserved / available / incoming + low-stock

**Sprint:** S007
**Milestone:** M004
**Status:** todo
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T023
**Branch:** feature/S007/T024-inventory-dashboard
**PRD journey:** J011

### Slice objective

Admin sees a unified inventory table: stocked (Medusa), reserved (Medusa), available (live calculation), incoming (open PO sum per variant). Low-stock variants highlighted. Movement history per variant.

### Layers in scope

- Service: `InventoryDashboardService.overview(storeId)` — joins Medusa inventory + PO data; live available calc
- API: `GET /admin/inventory-overview?page=&search=&filter=low_stock`
- UI: Inventory → Overview — table, sort/filter/search, low-stock config, movement history drawer
- Tests: available = stocked - reserved; incoming = sum of open PO lines for variant

### Acceptance criteria

- [ ] `available = stocked - reserved` is always live (never cached)
- [ ] `incoming` reflects open POs for that variant
- [ ] Low-stock threshold configurable; variants below threshold highlighted
- [ ] Movement history shows correct source label (sale, PO receipt, manual)

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## M005 — Improved Order Flow / S008

---

## T025 — Improved order list — badges, filters, bulk actions, search

**Sprint:** S008
**Milestone:** M005
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** cursor/s008-order-flow-b792
**PR:** https://github.com/eskobar95/mercflow/pull/56
**PRD journey:** J012

### Slice objective

Orders list shows status badges, customer, amount, date, fulfillment status. Filters by status, date range, payment status. Bulk-select to mark as fulfillment-ready. Fast search by order number, email, customer name.

### Layers in scope

- DB: no changes (reads Medusa core `order` table)
- API: no new routes (uses existing Medusa admin order API)
- UI: Admin → Orders — replace existing list view with improved layout
- Tests: filter by status returns correct subset; bulk action updates fulfillment status

### Acceptance criteria

- [ ] Status badges visible (pending, processing, shipped, etc.)
- [ ] Date range filter works
- [ ] Bulk select + mark fulfillment-ready works
- [ ] Search by order number returns correct result

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] PR description filled in

---

## T026 — Order detail + internal notes + timeline + pick list

**Sprint:** S008
**Milestone:** M005
**Status:** in-progress
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** cursor/s008-order-flow-b792
**PRD journey:** J012

### Slice objective

Order detail page shows all info without modal navigation. Internal notes section (not sent to customer). Timeline of key events. Pick list generator for today's ready-to-ship orders.

### Layers in scope

- DB: `mercflow_order_note` (store_id, order_id, content, created_by, created_at) — new table with `store_id NOT NULL` + RLS
- Service: `OrderNoteService` CRUD
- API: `GET /admin/orders/:id/notes`, `POST /admin/orders/:id/notes`, `DELETE /admin/orders/:id/notes/:noteId`; `GET /admin/orders/pick-list?date=today`
- UI: Order detail — no modal navigation, notes panel, timeline section; Orders → "Pick List" button
- Tests: note created → visible on order; pick list includes only ready-to-ship orders for current tenant

### Acceptance criteria

- [ ] Internal note saved and visible (not exposed to customer)
- [ ] Timeline shows: placed, paid, fulfillment created, shipped
- [ ] Pick list generated for today's fulfillment-ready orders; printable layout
- [ ] All notes tenant-scoped via `store_id`

### Definition of done

- [ ] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [ ] Migration DECISION LOG + `down()` for `mercflow_order_note`
- [ ] PR description filled in

---

<!-- Total: T001–T026 | AFK: 22 | HITL: 4 (T003, T008, T013, T023) -->
<!-- Sprints: S001–S008 | Milestones: M000–M005 -->
