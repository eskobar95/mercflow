# Tasks — MercFlow Batch 2

> Atomic tasks for harness execution. One task = one PR to `development`.
> Status: `todo` | `in-progress` | `blocked` | `done`
> Mode: `AFK` | `HITL`
> Updated: 2026-06-04 (S003 merged — T008–T012; PR #60; closeout `.factory/logs/sprints/S003-closeout-2026-06-04.md`)
> Updated: 2026-06-04 (M000 review + acceptance sync; S003 active)
> Updated: 2026-06-08 (all M000–M005 tasks done; PR #63 unified list pages merged outside Factory — logged for traceability)
> Updated: 2026-06-11 (T064 done — Clerk auth + AppShell; branch feature/S027/T064-clerk-auth-appshell-sidebar)
> Updated: 2026-06-11 (S025 done — T059 PR #108, T061 PR #109; T060 unblocked)
> Updated: 2026-06-13 (T079–T088 added — M017 Payment Module, M018 Discount System, M019 Tenant Onboarding)

---

## M000 — Tenancy Foundation

---

## T001 — Backfill `store_id` + rebuild unique indexes on all Batch 1 + Guapo-custom tables

**Sprint:** S001
**Milestone:** M000
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S001/T001-tenancy-backfill-store-id
**PR:** https://github.com/eskobar95/mercflow/pull/50
**Merge:** `3997fb5`
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

- [x] `SELECT count(*) FROM medusa.article WHERE store_id IS NULL` returns 0
- [x] Same check passes for all 17 tables (6 Guapo-custom conditional; `shipmondo_enabled_products` not in migration — prod follow-up)
- [x] Inserting a duplicate (slug, locale) for a different `store_id` succeeds
- [x] Inserting a duplicate (slug, locale) for the same `store_id` fails with constraint error
- [x] `pnpm migration:run` clean on fresh local DB

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

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] Migration files have MIGRATION DECISION LOG comments
- [x] `down()` implemented in every migration
- [x] PR description filled in

---

## T002 — Enable RLS + tenant isolation policies on all MercFlow tables

**Sprint:** S001
**Milestone:** M000
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T001
**Branch:** feature/S001/T002-rls-tenant-policies
**PR:** https://github.com/eskobar95/mercflow/pull/52
**Merge:** `a8436ea`
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

- [x] `SELECT * FROM medusa.article` without `SET LOCAL` returns 0 rows
- [x] `SET LOCAL app.store_id = 'store_01KG0VBTT0714XV2CCTEBRVC47'; SELECT * FROM medusa.article` returns correct rows
- [x] Service method in content-module uses `withTenant` wrapper
- [x] No `console.log` or debug artifacts

### Out of scope

- Medusa core tables (product, order, cart, etc.) — Medusa manages those
- `payload.*` tables

### Context for implementing agent

- See ADR-005 for full RLS enforcement strategy
- Service base class lives in `packages/content-module/src/services/`
- Use `FORCE ROW LEVEL SECURITY` to prevent bypass by superuser connections

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] No secrets or debug artifacts
- [x] PR description filled in

---

## T003 — Rate limiting middleware + Neon IP allowlist

**Sprint:** S001
**Milestone:** M000
**Status:** done
**Mode:** HITL
**Parallel group:** C
**Blocked by:** T002
**Branch:** feature/S001/T003-rate-limiting
**PR:** https://github.com/eskobar95/mercflow/pull/53
**Merge:** `3f64f0c`
**PRD journey:** —
**ADRs:** ADR-005
**HITL follow-up:** [.factory/logs/hitl/M000-neon-allowlist.md](../logs/hitl/M000-neon-allowlist.md) (open)

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

Before merging: human adds Railway static egress IPs to Neon project `allowed_ips` in [Neon console](https://console.neon.tech/app/projects/withered-salad-42833300) → Settings → Allowed IPs.

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
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/55
**Merge:** `b378e22`
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

- [x] `pnpm typecheck` passes across monorepo with new package
- [x] `pnpm migration:run` creates `mercflow_seo_config` and `mercflow_redirect` tables with `store_id NOT NULL`
- [x] RLS enabled on both tables (same pattern as T002)
- [x] `SeoConfigService.get(storeId)` returns correct config
- [x] Package README created

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

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] Migration has DECISION LOG comment
- [x] Package README with responsibility, run/test, field definitions
- [x] PR description filled in

---

## T005 — Nordic slug utility — Settings UI + service

**Sprint:** S002
**Milestone:** M001
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/55
**Merge:** `b378e22`
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

- [x] Slug utility correctly transforms all Nordic characters per strategy
- [x] Admin saves strategy → subsequent product saves use new strategy
- [x] Live preview works (type a name, see slug)
- [x] Utility is pure and importable by content-module (no circular dep)

### Out of scope

- Bulk re-slug of existing products (T005 only handles new slugs; bulk is a follow-up)
- Auto-redirect on re-slug (T006)

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] No secrets or debug artifacts
- [x] PR description filled in

---

## T006 — 301 Redirect backend — service + middleware + subscriber

**Sprint:** S002
**Milestone:** M001
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/55
**Merge:** `b378e22`
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

- [x] Product slug change → `mercflow_redirect` row created automatically
- [x] `GET /old-slug` → `301 Location: /new-slug`
- [x] Redirect scoped to tenant (no cross-tenant redirect leakage)
- [x] Chain detection: redirect pointing to another redirect logs warning
- [x] Redirect middleware runs before Medusa route resolution

### Out of scope

- Admin UI (T007)
- Bulk CSV import (backlog)
- Wildcard/regex redirects (non-goal)

### Context for implementing agent

- Medusa subscriber pattern: `packages/content-module/src/subscribers/` for reference
- Middleware registered in `apps/backend/src/api/middlewares.ts`
- Tenant resolved from `Host` header in middleware (use seo-module tenant resolution — T008 HITL pending, implement stub for now that reads `X-Store-Id` header as fallback for local testing)

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] No secrets or debug artifacts
- [x] PR description filled in

---

## T007 — 301 Redirect admin UI — list, create, delete, chain warning

**Sprint:** S002
**Milestone:** M001
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/55
**Merge:** `b378e22`
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

- [x] Redirect list shows all tenant redirects (no other tenant data)
- [x] Manual redirect created via form → appears in list + works as 301
- [x] Delete removes redirect; subsequent request returns 404 (or passes through)
- [x] Chain warning badge visible when destination is itself a redirect

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing
- [x] No secrets or debug artifacts
- [x] PR description filled in

---

## M001 — SEO Infrastructure / S003

**Sprint S003 merged 2026-06-04:** PR https://github.com/eskobar95/mercflow/pull/60 → `development` @ `b2e1d90`. Branch `cursor/s003-sitemap-robots-tenant-6449` (deleted). Closeout log: `.factory/logs/sprints/S003-closeout-2026-06-04.md`.

---

## T008 — Tenant resolution middleware — Host → store_id mapping

**Sprint:** S003
**Milestone:** M001
**Status:** done
**Mode:** HITL
**Parallel group:** A
**Blocked by:** T004
**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged)
**Decision:** Host mapping option (A) — `mercflow_seo_config.storefront_url` hostname index + 60s resolver cache.
**Merged:** PR #60 / `b2e1d90` — HITL log: `.factory/logs/hitl/S003-T008-host-mapping.md`
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

- [x] `GET /sitemap.xml` with `Host: guapo.dk` resolves to `store_01KG0VBTT0714XV2CCTEBRVC47` (when `storefront_url` configured)
- [x] `GET /sitemap.xml` with unknown host → `404`
- [x] Resolution is cached (TTL 60s) to avoid DB hit per request; no negative cache for misses

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests written and passing (`tenant-resolver.test.ts`)
- [x] No secrets or debug artifacts
- [x] PR description filled in (PR #60)
- [x] HITL: host mapping strategy confirmed — option A

---

## T009 — Sitemap service + `GET /sitemap.xml` + config table

**Sprint:** S003
**Milestone:** M001
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T008
**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged PR #60)
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

- [x] Valid XML sitemap returned for configured tenant
- [x] `<loc>` tags use tenant's `storefront_url` (no hardcoded store URLs)
- [x] Excluded product/category absent from sitemap
- [x] Cache invalidated on admin PUT, catalogue events, CMS `mercflow.page.changed`
- [x] Different tenant gets different sitemap (Host middleware + RLS)

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Tests: XML validity (`sitemap-xml.test.ts`, `catalog-loader-categories.test.ts`)
- [x] Migration DECISION LOG + `down()` implemented
- [x] PR description filled in (PR #60)

---

## T010 — Sitemap admin UI — config, priority, exclusions, preview, regenerate

**Sprint:** S003
**Milestone:** M001
**Status:** done
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T009
**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged PR #60)
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

- [x] Priority and changefreq configurable per page type
- [x] Excluded product absent after next regeneration / invalidation
- [x] XML preview matches `GET /sitemap.xml` output
- [x] "Regenerate" button triggers cache invalidation

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing (AppSidebar snapshot)
- [x] PR description filled in (PR #60)

---

## T011 — Robots.txt service + `GET /robots.txt` + config table

**Sprint:** S003
**Milestone:** M001
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T008
**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged PR #60)
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

- [x] Valid `robots.txt` returned for configured tenant
- [x] Different tenant returns different robots.txt (tenant-scoped config)
- [x] Sitemap URL auto-inserted using tenant's `storefront_url`
- [x] Malformed `structured_rules` does not crash public route (`normalizeRobotsStructured`)

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing (`robots-service.test.ts`)
- [x] Migration DECISION LOG + `down()` implemented
- [x] PR description filled in (PR #60)

---

## T012 — Robots.txt admin UI — structured editor + preview + history

**Sprint:** S003
**Milestone:** M001
**Status:** done
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T011
**Branch:** `cursor/s003-sitemap-robots-tenant-6449` (merged PR #60)
**PRD journey:** J004

### Slice objective

Admin can manage robots.txt rules via a structured UI (allow/block per path and bot), toggle to freetext mode, preview the output, and view change history.

### Layers in scope

- API: `GET /admin/robots-config`, `PUT /admin/robots-config`
- UI: SEO → Robots.txt — structured editor, freetext toggle, preview panel, history list
- Tests: save structured rule → correct robots.txt output

### Acceptance criteria

- [x] Structured rule (allow Googlebot to `/`) renders correctly in preview + live endpoint
- [x] Freetext override replaces structured output
- [x] Change history shows last 10 changes with timestamp

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in (PR #60)

---

## M002 — SEO Metadata / S004

---

## T013 — Global per-tenant config — storefront_url, org name, logo, socials

**Sprint:** S004
**Milestone:** M002
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/62
**Merge:** `e9f0c6f`
**Mode:** HITL
**Branch:** `feature/S004/metadata-json-ld-og-canonical`
**HITL log:** `.factory/logs/hitl/S004-T013-global-config-table.md` (option A — `mercflow_seo_config`)
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

- [x] Org name/logo/socials saved and returned per tenant
- [x] No cross-tenant org data in any API response
- [x] Fields empty-state safe (JSON-LD `Organization` block skipped if name not set)

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] HITL: table ownership confirmed by human before PR opens
- [x] PR description filled in

---

## T014 — JSON-LD structured data — Product, Category, Organization, WebSite

**Sprint:** S004
**Milestone:** M002
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/62
**Merge:** `e9f0c6f`
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

- [x] `Product` schema includes name, description, image, sku, price, currency, availability
- [x] `BreadcrumbList` reflects full category path
- [x] `Organization` absent if org name not configured
- [x] All `url` fields use tenant's `storefront_url` — never hardcoded

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## T015 — Open Graph & Social Meta

**Sprint:** S004
**Milestone:** M002
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/62
**Merge:** `e9f0c6f`
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

- [x] `og:title`, `og:description`, `og:image` correct for product
- [x] Fallback: if `seo_title` empty → product title used
- [x] Twitter Card tags included
- [x] No cross-tenant data

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## T016 — Canonical URL handling

**Sprint:** S004
**Milestone:** M002
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/62
**Merge:** `e9f0c6f`
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

- [x] Canonical URL uses tenant `storefront_url` as base — never hardcoded
- [x] Manual override saved and returned
- [ ] Admin warned if potential canonical conflict detected (deferred)

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] Migration DECISION LOG + `down()`
- [x] PR description filled in

**Follow-up:** Category Content tab canonical field UI (product tab done).

---

## M003 — Shopping Feed / S005

---

## T017 — `feed-module` scaffold + DB schema + feed-config table

**Sprint:** S005
**Milestone:** M003
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/54
**Merge:** `35fa81c`
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

- [x] Package scaffolded, typechecks, migrations run clean
- [x] `store_id NOT NULL` + RLS on `mercflow_feed_config`
- [x] Package README created

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] Migration DECISION LOG + `down()`
- [x] Package README
- [x] PR description filled in

---

## T018 — Google Shopping XML feed + `GET /feed/google-shopping.xml`

**Sprint:** S005
**Milestone:** M003
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/57
**Merge:** `05aa41f`
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

- [x] Valid Google Shopping XML output
- [x] `link` and `image_link` use tenant's `storefront_url`
- [x] Excluded products absent
- [x] Cache invalidated within 30s of product change
- [ ] No cross-tenant products in response (full Host middleware — T008; feed shim until S003)
- [x] Tenant shim via `mercflowFeedTenantMiddleware` until T008

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## T019 — Feed admin UI — overview, exclusions, feed URL, validation report

**Sprint:** S005
**Milestone:** M003
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/58
**Merge:** `c5dee78`
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

- [x] Feed URL correct and copyable
- [x] Validation report lists products with missing required fields
- [x] Excluded product absent from next feed generation

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## M004 — Inventory & Purchase Orders / S006

---

## T020 — `inventory-module` scaffold + DB schema (suppliers, POs, receipts, inventory config)

**Sprint:** S006
**Milestone:** M004
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** cursor/s006-inventory-suppliers-po-e302
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

- [x] All tables with `store_id NOT NULL` + RLS
- [x] `pnpm migration:run` clean
- [x] Package README

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] All migrations have DECISION LOG + `down()`
- [x] Package README
- [x] PR description filled in

---

## T021 — Supplier register CRUD — admin UI + API

**Sprint:** S006
**Milestone:** M004
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T020
**Branch:** cursor/s006-inventory-suppliers-po-e302
**PRD journey:** J009

### Slice objective

Admin can create, edit, and delete suppliers. Supplier list available as dropdown in PO creation form.

### Layers in scope

- Service: `SupplierService` CRUD
- API: `GET /admin/suppliers`, `POST /admin/suppliers`, `PATCH /admin/suppliers/:id`, `DELETE /admin/suppliers/:id`
- UI: Inventory → Suppliers — list, create/edit form, delete
- Tests: CRUD happy path; `store_id` isolation (no other tenant's suppliers visible)

### Acceptance criteria

- [x] Supplier CRUD works end-to-end
- [x] Supplier list is tenant-scoped

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## T022 — Purchase Order create + list + status management

**Sprint:** S006
**Milestone:** M004
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T020
**Branch:** cursor/s006-inventory-suppliers-po-e302
**PRD journey:** J010

### Slice objective

Admin can create a PO (select supplier, add lines, set expected date, reference, notes), view PO list with status, and move PO from `draft` to `ordered`.

### Layers in scope

- Service: `PurchaseOrderService.create`, `list`, `updateStatus`
- API: `GET /admin/purchase-orders`, `POST /admin/purchase-orders`, `PATCH /admin/purchase-orders/:id/status`
- UI: Inventory → Purchase Orders — list with status badges, create form (supplier dropdown, variant lines, date, reference, notes)
- Tests: create PO → appears in list; status transition draft→ordered

### Acceptance criteria

- [x] PO created with supplier, lines, date, reference
- [x] PO list tenant-scoped
- [x] Status transition draft → ordered works

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## M004 — Inventory & Purchase Orders / S007

---

## T023 — PO receive flow + inventory boundary decision

**Sprint:** S007
**Milestone:** M004
**Status:** done
**Mode:** HITL
**Parallel group:** A
**Blocked by:** T022
**Branch:** feature/S007/T023-po-receive-flow
**PR:** https://github.com/eskobar95/mercflow/pull/61
**Merge:** `0780d33`
**PRD journey:** J010
**ADRs:** ADR-004

**HITL reason:** Must confirm whether PO receipt auto-updates Medusa `inventory_item` quantity (requires Medusa stock mutation) or only creates a MercFlow receipt record (UI shows incoming vs stocked separately). This is the open question from PRD. The API and UI boundary must be explicit before implementation. Human approves approach.

### Slice objective

Admin can record receipt for a PO (actual qty per line, notes). Partial receipt leaves PO in `partially_received`. Full receipt marks `received`. Receipt creates `mercflow_purchase_order_receipt` records. Boundary between MercFlow records and Medusa stock is explicit.

### HITL checkpoint

Before implementing: decide — does `receive` also call Medusa `createReservationItem` / adjust `inventory_item`? Or does it only record in MercFlow tables? Recommendation: create MercFlow receipt record only in M000; Medusa stock adjustment as explicit separate step in UI (operator clicks "Apply to stock" separately). Human confirms.

### Acceptance criteria

- [x] Admin opens PO → enters received qty per line → submits
- [x] Discrepancy clearly shown (ordered 100, received 94 → -6 flagged)
- [x] Partial receipt leaves PO `partially_received`
- [x] UI explicitly labels whether stock has been applied or not
- [x] `store_id` isolation on all receipt records

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] HITL: stock mutation decision confirmed and documented in PR
- [x] PR description filled in

---

## T024 — Inventory Dashboard — stocked / reserved / available / incoming + low-stock

**Sprint:** S007
**Milestone:** M004
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T023
**Branch:** feature/S007/T023-po-receive-flow
**PR:** https://github.com/eskobar95/mercflow/pull/61
**Merge:** `0780d33`
**PRD journey:** J011

### Slice objective

Admin sees a unified inventory table: stocked (Medusa), reserved (Medusa), available (live calculation), incoming (open PO sum per variant). Low-stock variants highlighted. Movement history per variant.

### Layers in scope

- Service: `InventoryDashboardService.overview(storeId)` — joins Medusa inventory + PO data; live available calc
- API: `GET /admin/inventory-overview?page=&search=&filter=low_stock`
- UI: Inventory → Overview — table, sort/filter/search, low-stock config, movement history drawer
- Tests: available = stocked - reserved; incoming = sum of open PO lines for variant

### Acceptance criteria

- [x] `available = stocked - reserved` is always live (never cached)
- [x] `incoming` reflects open POs for that variant
- [x] Low-stock threshold configurable; variants below threshold highlighted
- [x] Movement history shows correct source label (sale, PO receipt, manual)

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

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

- [x] Status badges visible (pending, processing, shipped, etc.)
- [x] Date range filter works
- [x] Bulk select + mark fulfillment-ready works
- [x] Search by order number returns correct result

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] PR description filled in

---

## T026 — Order detail + internal notes + timeline + pick list

**Sprint:** S008
**Milestone:** M005
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** M000 done (T003 merged)
**Branch:** cursor/s008-order-flow-b792
**PR:** https://github.com/eskobar95/mercflow/pull/56
**Merge:** `fec137f`
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

- [x] Internal note saved and visible (not exposed to customer)
- [x] Timeline shows: placed, paid, fulfillment created, shipped
- [x] Pick list generated for today's fulfillment-ready orders; printable layout
- [x] All notes tenant-scoped via `store_id`

### Definition of done

- [x] `pnpm typecheck` passes / `pnpm lint` passes / tests passing
- [x] Migration DECISION LOG + `down()` for `mercflow_order_note`
- [x] PR description filled in

---

<!-- Total: T001–T026 | AFK: 22 | HITL: 4 (T003, T008, T013, T023) -->
<!-- Sprints: S001–S008 | Milestones: M000–M005 -->

---

## M006 — Production Infrastructure / S009

---

## T027 — Docker Compose stack — Traefik + Redis + Portainer + Medusa on Hetzner

**Sprint:** S009
**Milestone:** M006
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S009/T027-hetzner-docker-compose
**PR:** https://github.com/eskobar95/mercflow/pull/68
**PRD journey:** J001
**ADRs:** ADR-006
**HITL approved:** 2026-06-08 — User delegated full T027 implementation + Hetzner deploy; DNS and Neon Frankfurt ready.
**HITL post-deploy:** 2026-06-08 — Uptime monitor `https://api.mercflow.shop/health` (60s); Neon allowlist `46.225.226.143` confirmed.

**HITL reason:** Requires SSH access to Hetzner VPS to deploy and verify. Domain DNS must be configured before SSL provisioning can be tested. Human must confirm all containers are healthy in Portainer and admin URL is accessible. Neon IP allowlist must be updated to Hetzner egress IP (closes open HITL from T003/M000).

### Slice objective

Full MercFlow stack runs on Hetzner via Docker Compose. Traefik routes configured domain with automatic SSL (Let's Encrypt). Medusa backend + worker start cleanly, connect to Neon. Redis available. Portainer accessible. **Prometheus + Grafana** provide VPS and container metrics dashboards. Neon IP allowlist updated to Hetzner egress IP.

### Layers in scope

- Infra: `infra/docker-compose.yml` — services: `traefik`, `medusa-backend`, `medusa-worker`, `redis`, `portainer`, `prometheus`, `grafana`, `node-exporter`, `cadvisor`
- Config: `infra/traefik/traefik.yml` (static), `infra/traefik/dynamic/` (routing rules), `infra/traefik/acme.json` (gitignored)
- Config: `infra/prometheus/prometheus.yml` — scrape targets (node-exporter, cadvisor, redis exporter if added)
- Config: `infra/grafana/provisioning/` — datasource (Prometheus) + starter dashboards (VPS + containers)
- Env: `infra/.env.example` — all required vars documented (`NEON_DATABASE_URL`, `REDIS_URL`, `SENTRY_DSN`, `DOMAIN`, `GRAFANA_ADMIN_PASSWORD`, etc.)
- Runbook: `infra/RUNBOOK.md` — deploy, restart, add domain, update cert, Grafana access
- Ops: Neon project `withered-salad-42833300` allowed-IP updated to Hetzner VPS static/floating IP

### Services

| Service | Image | Notes |
|---|---|---|
| `traefik` | `traefik:v3` | HTTP-01 ACME, dashboard disabled in prod |
| `medusa-backend` | Built from `apps/backend` | HTTP on internal port; exposed via Traefik |
| `medusa-worker` | Same image, worker mode | No external exposure |
| `redis` | `redis:7-alpine` | Internal only |
| `portainer` | `portainer/portainer-ce:latest` | Exposed via Traefik on `portainer.<domain>` |
| `prometheus` | `prom/prometheus:latest` | Internal; scraped by Grafana |
| `grafana` | `grafana/grafana:latest` | Exposed via Traefik on `grafana.<domain>`; basic auth or Grafana login |
| `node-exporter` | `prom/node-exporter:latest` | Host CPU/RAM/disk metrics |
| `cadvisor` | `gcr.io/cadvisor/cadvisor:latest` | Per-container CPU/RAM metrics |

### Metrics scope (MVP)

- VPS: CPU, memory, disk, network (node-exporter)
- Containers: CPU/memory per service (cAdvisor)
- Redis: up/down + memory (redis_exporter optional in follow-up)
- Medusa HTTP metrics: deferred — add `/metrics` or Traefik metrics in follow-up slice

### Acceptance criteria

- [x] `docker compose up -d` starts all containers without errors
- [x] `GET https://<configured-domain>/health` returns 200 with valid SSL cert
- [x] Portainer UI accessible at `portainer.<configured-domain>`
- [x] Grafana UI accessible at `grafana.<configured-domain>` with pre-provisioned Prometheus datasource
- [x] Starter dashboard shows VPS + container metrics within 2 min of deploy
- [x] Medusa admin login works end-to-end
- [x] Redis connectivity verified (Medusa logs no event bus errors)
- [x] Neon allowed-IP updated; connection string unreachable from other IPs (verify)
- [x] `infra/.env.example` documents all required vars without real values

### HITL checkpoint

1. Human configures DNS (A record or CNAME for configured domain → Hetzner IP; include `grafana.<domain>` and `portainer.<domain>`)
2. Human SSHes to Hetzner, runs `docker compose up -d`
3. Human verifies all containers green in Portainer
4. Human opens Grafana → confirms Prometheus datasource + starter dashboards render data
5. Human updates Neon `allowed_ips` with Hetzner egress IP in [Neon console](https://console.neon.tech/app/projects/withered-salad-42833300)
6. Human confirms admin URL accessible → approves PR

### Out of scope

- CI/CD auto-deploy (post-MVP)
- Backup cron (T029 — cancelled; Neon snapshots + Hetzner VPS backup)
- Multi-tenant domain routing beyond first domain (T030)
- Horizontal scaling

### Definition of done

- [x] `infra/docker-compose.yml` committed and reviewed
- [x] `infra/.env.example` complete — no real values
- [x] `infra/RUNBOOK.md` covers deploy + restart + cert renewal
- [x] HITL: human confirms stack running on Hetzner
- [x] HITL: Neon IP allowlist updated (closes T003/M000 HITL)
- [x] PR description filled in

---

## T028 — Observability — Sentry SDK + BetterStack logs + uptime checks

**Sprint:** S009
**Milestone:** M006
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none (code); T027 deployed for uptime check config
**Branch:** feature/S009/T028-observability
**PR:** https://github.com/eskobar95/mercflow/pull/65
**PRD journey:** J003
**ADRs:** ADR-006

### Slice objective

Sentry SDK integrated into Medusa backend — unhandled errors captured and tagged with `store_id`. BetterStack log source connected. Uptime checks configured per tenant domain. Both services have no real credentials in code.

### Layers in scope

- Code: Sentry SDK in `apps/backend` — `@sentry/node` init with `store_id` tag in error context
- Config: `SENTRY_DSN` env var; Sentry project created (separate from Guapo if applicable)
- Ops: BetterStack log source connected to Docker container stdout/stderr via log driver or agent
- Ops: BetterStack uptime check created for each configured tenant domain (initially Guapo)
- Env: `infra/.env.example` updated with `SENTRY_DSN`, `BETTERSTACK_SOURCE_TOKEN`

### Sentry integration pattern

```ts
// apps/backend/src/lib/sentry.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

// In request context middleware — attach store_id to all errors
Sentry.setTag("store_id", resolvedStoreId)
```

### Acceptance criteria

- [x] Unhandled error in Medusa backend appears in Sentry with `store_id` tag
- [x] Container logs visible in BetterStack log explorer
- [x] Uptime check for Guapo domain active; alert fires on simulated downtime
- [x] No `SENTRY_DSN` or BetterStack tokens committed to repo

### Out of scope

- Per-tenant Sentry projects (single project with `store_id` tag is sufficient)
- Custom BetterStack dashboards
- Performance tracing (Sentry)

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] Sentry init documented in `infra/RUNBOOK.md`
- [x] `infra/.env.example` updated
- [x] PR description filled in

---

## T029 — Automated pg_dump backup → Hetzner S3 + restore runbook

**Sprint:** S009
**Milestone:** M006
**Status:** cancelled
**Mode:** HITL
**Parallel group:** B
**Blocked by:** n/a
**Branch:** feature/S009/T029-backup-restore (not started)
**PRD journey:** J004
**ADRs:** ADR-006

**Cancelled:** 2026-06-08 — Operator decision: Hetzner Object Storage + pg_dump cron is redundant for MVP. Production backup uses **Neon daily snapshots + PITR** (database) and **Hetzner Server Backup** on `mercflow` VPS (infrastructure). Restore procedures documented in `infra/RUNBOOK.md` § Backup & restore. Re-open only if vendor-independent pg_dump exports become a requirement.

**HITL reason:** Requires Hetzner Object Storage bucket + credentials to be provisioned by human. Restore must be tested manually on a real backup to verify it works.

### Slice objective

Daily automated pg_dump from Neon runs via a cron container. Backup uploaded to Hetzner Object Storage via rclone. Restore script documented and tested. BetterStack alert fires if backup job fails.

### Layers in scope

- Infra: `backup` service added to `docker-compose.yml` — cron-based `pg_dump` + rclone upload
- Scripts: `infra/backup/backup.sh` — pg_dump → compress → rclone copy to S3
- Scripts: `scripts/restore-backup.sh <date>` — downloads backup → pg_restore to Neon (local target configurable)
- Config: `infra/backup/rclone.conf.example` — S3 provider config template (no real keys)
- Env: `HETZNER_S3_ACCESS_KEY`, `HETZNER_S3_SECRET_KEY`, `HETZNER_S3_BUCKET`, `BACKUP_RETENTION_DAYS` added to `.env.example`
- Runbook: backup section in `infra/RUNBOOK.md`

### Backup schedule

- **Daily at 02:00 UTC** — full pg_dump of Neon database
- **Retention:** 30 days (configurable via `BACKUP_RETENTION_DAYS`)
- **Naming:** `mercflow-backup-YYYY-MM-DD-HHMMSS.sql.gz`
- **Failure alert:** BetterStack alert if no backup file uploaded within 26 hours

### Acceptance criteria

- [ ] `backup.sh` runs without error; file appears in Hetzner Object Storage
- [ ] `restore-backup.sh 2026-06-08` downloads and restores backup to a test DB without error
- [ ] Cron fires at configured time (verify via container logs)
- [ ] BetterStack heartbeat monitor configured; alerts on missed backup
- [ ] No S3 credentials committed to repo

### HITL checkpoint

1. Human creates Hetzner Object Storage bucket + access key
2. Human adds credentials to `.env.production` on Hetzner VPS
3. Human triggers manual backup run (`docker compose exec backup /backup.sh`) → confirms file in S3
4. Human runs `restore-backup.sh` against a test DB → confirms data integrity
5. Human approves PR

### Out of scope

- Point-in-time recovery (Neon has its own PITR — this is an additional safety net)
- Cross-region backup replication

### Definition of done

- [ ] `infra/backup/backup.sh` and `scripts/restore-backup.sh` committed
- [ ] `infra/backup/rclone.conf.example` committed (no real keys)
- [ ] `infra/.env.example` updated with backup vars
- [ ] Backup section in `infra/RUNBOOK.md`
- [ ] HITL: human confirms backup reaching S3 and restore works
- [ ] PR description filled in

---

## T030 — Tenant provisioning script

**Sprint:** S009
**Milestone:** M006
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** none (T027 done; T029 cancelled)
**Branch:** feature/S009/T030-provision-tenant
**PR:** https://github.com/eskobar95/mercflow/pull/69
**Note:** 2026-06-08 — Dry-run tenant "Salon Maria" provisioned (no owned domain; script + Medusa resources verified). Live DNS/health HITL deferred to first real customer domain.
**PRD journey:** J002
**ADRs:** ADR-004, ADR-006

### Slice objective

`pnpm provision-tenant` accepts `--name`, `--domain`, `--email` and creates a fully isolated MercFlow tenant: Medusa Store, Sales Channel, Publishable API Key, Admin user with generated password, and a Traefik routing rule for the domain. Target: under 5 minutes end-to-end.

### Layers in scope

- Script: `scripts/provision-tenant.ts` — CLI using Medusa Admin API + Traefik dynamic config file
- Output: prints Store ID, Publishable API Key, admin URL, generated password to stdout
- Traefik: appends a new routing rule to `infra/traefik/dynamic/tenants.yml` (or equivalent file provider)
- Env: reads `MEDUSA_ADMIN_API_KEY` (or equivalent auth) + `TRAEFIK_DYNAMIC_DIR` from env

### CLI interface

```bash
pnpm provision-tenant \
  --name "Salon Maria" \
  --domain shop.salon-maria.dk \
  --email maria@salon-maria.dk
```

### What the script creates

1. `POST /admin/stores` → Medusa Store (`store_id`)
2. `POST /admin/sales-channels` → Sales Channel linked to store
3. `POST /admin/publishable-api-keys` → Publishable API Key for storefront
4. `POST /admin/users` → Admin user with `--email` + generated 16-char password
5. Appends Traefik router + service rule for `--domain` to dynamic config file

### Acceptance criteria

- [x] Script runs to completion without errors on a live Hetzner deployment (T027 deployed)
- [x] New tenant visible in Medusa admin store list
- [x] Admin login with generated credentials works (platform admin URL)
- [ ] `GET https://<domain>/health` routed correctly via Traefik after DNS propagates (deferred — no owned test domain)
- [x] Generated password not stored in script output files or logs
- [x] Idempotency: running script twice with same domain gives a clear error (not silent duplicate)

### Out of scope

- Sending credentials to customer (manual step — operator copies from stdout)
- Self-service UI (future PRD)
- Stripe billing setup
- Storefront deployment

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Script documented in `infra/RUNBOOK.md` (provisioning section)
- [ ] `scripts/provision-tenant.ts` committed
- [ ] PR description filled in

---

---

## T031 — Pagination max + error shape audit

**Sprint:** S009
**Milestone:** M006
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S009/T031-pagination-error-shape
**PR:** https://github.com/eskobar95/mercflow/pull/67
**PRD journey:** J002
**ADRs:** PRD-api-hardening

### Slice objective

Every MercFlow list endpoint enforces `limit = Math.min(query.limit ?? 50, 100)` — no unbounded queries. Every MercFlow route error path uses `MedusaError({ message, type, code })` — no raw `Error` or plain JSON shapes. Guapo cannot trigger a memory spike by loading a large `redirects` or `purchase-orders` table.

### Layers in scope

- API: `packages/seo-module/src/api/admin/redirects/route.ts` and all list handlers — add limit guard
- API: `packages/inventory-module/src/api/admin/purchase-orders/route.ts` and all list handlers — add limit guard
- API: audit all `GET /admin/[resource]` handlers in `content-module`, `feed-module`, `connector-module`, `subscription-module` — add guard where missing
- API: audit all error paths in MercFlow route handlers — replace raw `Error` with `MedusaError`
- Tests: verify `GET /admin/redirects?limit=200` returns max 100

### Acceptance criteria

- [x] `rg "Math.min" packages/*/src/api` matches every list handler
- [x] `rg "new Error" packages/*/src/api` returns zero matches (all replaced with `MedusaError`)
- [x] `GET /admin/redirects?limit=500` returns `count` ≤ 100
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes

### Out of scope

- Admin UI pagination UI changes
- Medusa core route changes
- Response envelope for success payloads

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Acceptance criteria above checked
- [ ] PR description filled in

---

## T032 — `/v1/` prefix on all MercFlow store routes + 301 redirects

**Sprint:** S009
**Milestone:** M006
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S009/T032-store-route-versioning
**PR:** https://github.com/eskobar95/mercflow/pull/66
**PRD journey:** J001
**ADRs:** PRD-api-hardening

### Slice objective

All MercFlow store-facing routes are accessible under `/v1/` before the first non-Guapo tenant is provisioned. Old unversioned paths redirect to `/v1/` equivalents with 301. Storefront developers get a stable URL contract.

### Routes in scope

All routes under `apps/backend/src/api/store/` registered by MercFlow modules:

- `/store/seo/*` → `/v1/store/seo/*`
- `/store/feed/*` → `/v1/store/feed/*`
- `/store/sitemap*` → `/v1/store/sitemap*`
- `/store/robots*` → `/v1/store/robots*`
- Any other MercFlow-owned store route

**Not in scope:** Medusa core store routes (`/store/products`, `/store/orders`, etc.) — these are Medusa's contract, not ours.

### Layers in scope

- API: add `/v1/` prefix to all MercFlow store route registrations in `apps/backend`
- API: add 301 redirect middleware from old unversioned paths to `/v1/` equivalents
- Docs: update any route references in `packages/*/README.md` and `apps/backend/README.md`

### Acceptance criteria

- [x] `GET /v1/store/seo/json-ld/product/:id` returns same response as `GET /store/seo/json-ld/product/:id` did before
- [x] `GET /store/seo/json-ld/product/:id` returns 301 → `/v1/store/seo/json-ld/product/:id`
- [x] All other MercFlow store routes follow same pattern (verified with smoke test list)
- [ ] Guapo storefront smoke test: no broken store API calls after deploy
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes

### Out of scope

- Admin route versioning
- Medusa core route versioning
- `/v2/` planning

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Acceptance criteria above checked
- [ ] README route references updated
- [ ] PR description filled in

---

<!-- Total: T001–T032 | AFK: 26 | HITL: 5 (T003, T008, T013, T023, T027) | Cancelled: T029 -->
<!-- Sprints: S001–S009 | Milestones: M000–M006 -->

---

## M007 — Medusa Fork Setup / S010

---

## T033 — Fork workspace — Medusa v2.14.1 source som pnpm workspace packages + zod harmonisering

**Sprint:** S010
**Milestone:** M007
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S010/T033-medusa-fork-workspace
**PR:** https://github.com/eskobar95/mercflow/pull/72
**PRD journey:** J001 (PRD-fork-setup.md)
**ADRs:** ADR-007
**HITL approved:** 2026-06-09 — Packages: framework, medusa, utils, types, cli; js-sdk npm; zod@^4.x override

**HITL reason:** To arkitekturbeslutninger skal godkendes inden implementering:
1. Hvilke `@medusajs/*` pakker inkluderes i forken? (forslag: `framework`, `medusa`, `utils`, `types`, `cli` — `js-sdk` evt. forbliver på npm)
2. Zod-retning: force `zod@3` (nuværende MercFlow modules bruger det) eller `zod@4` (Medusa framework-graf)? Tjek hvilke features hver side bruger — foretrækkes den version der undgår rewrite af validering.

### Slice objective

Medusa v2.14.1 kildekode kopieret ind i `packages/medusa-fork/` som pnpm workspace packages. `pnpm-workspace.yaml` udvidet. Alle `@medusajs/*` i alle `package.json` opdateret til `workspace:*`. Zod harmoniseret via `pnpm.overrides`. `pnpm install`, `pnpm typecheck`, `pnpm build` alle grønne.

### Layers in scope

- Infra: `packages/medusa-fork/` oprettet med Medusa v2.14.1 source (godkendte packages)
- Config: `pnpm-workspace.yaml` udvidet med `packages/medusa-fork/*`
- Config: root `package.json` — `pnpm.overrides` med Zod-version
- Deps: alle `package.json` i monorepo — `@medusajs/*` → `workspace:*`
- Verify: `pnpm install` → ingen npm fetch for `@medusajs/*`; `pnpm typecheck` og `pnpm build` grønne
- Tests: ingen nye tests — eksisterende suite skal bestå

### HITL checkpoint

Inden implementering: godkend (1) hvilke Medusa packages forkes og (2) zod-retningen. Derefter kører agenten AFK.

### Acceptance criteria

- [x] `packages/medusa-fork/` indeholder godkendte Medusa packages
- [x] `pnpm-workspace.yaml` inkluderer `packages/medusa-fork/*`
- [x] Forkede `@medusajs/*` i MercFlow `package.json` bruger `workspace:*` (js-sdk forbliver npm)
- [x] Lockfilen har én Zod-version
- [x] `pnpm typecheck` passes uden nye fejl
- [x] `pnpm build` passes
- [x] `pnpm test` består (ingen regressioner)

### Out of scope

- Modificering af Medusa source (det er T035 og T036)
- Dashboard removal (T035)
- `store_id` på core tables (T036)

### Context for implementing agent

- Medusa v2.14.1 source: `https://github.com/medusajs/medusa/tree/v2.14.1`
- Kopieringsmetode: git subtree eller manuel kopi — ikke submodule (monorepo-first)
- Subpath exports skal bevares: `@medusajs/medusa/fulfillment`, `@medusajs/framework/mikro-orm/core` m.fl.
- Eksisterende imports i MercFlow bruger `@medusajs/framework/utils`, `@medusajs/framework/http`, `@medusajs/framework/types`, `@medusajs/framework/mikro-orm/migrations`, `@medusajs/framework/mikro-orm/core`, `@medusajs/types`, `@medusajs/utils`
- `apps/backend/src/lib/tenant-isolation/` bruger `@medusajs/framework/mikro-orm/core` til `EntityManager` og `TransactionEventArgs`

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] HITL: package-valg + zod-retning godkendt inden PR åbnes
- [ ] PR description filled in

---

## T034 — `@mercflow/shared` pakke — udtræk slug utility + afkobl `admin-ui → seo-module`

**Sprint:** S010
**Milestone:** M007
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S010/T034-shared-package
**PR:** https://github.com/eskobar95/mercflow/pull/71
**PRD journey:** J005 (PRD-fork-setup.md)
**ADRs:** ADR-007

### Slice objective

Ny `@mercflow/shared` pakke oprettet i `packages/shared/`. `slugifyForStrategy` og relaterede utilities flyttes hertil. `@mercflow/admin-ui` importerer fra `@mercflow/shared` — ikke fra `@mercflow/seo-module`. `@mercflow/seo-module` importerer fra `@mercflow/shared`. Ingen frontend→backend-modul kobling.

### Layers in scope

- Pakke: `packages/shared/` oprettet med `package.json`, `tsconfig.json`, `src/index.ts`
- Kode: `slugifyForStrategy` + evt. andre cross-boundary utilities flyttet fra `seo-module` til `shared/src/slug.ts`
- Deps: `packages/admin-ui/package.json` — `@mercflow/seo-module` erstattes af `@mercflow/shared`
- Deps: `packages/seo-module/package.json` — tilføj `@mercflow/shared` afhængighed
- Imports: alle `import ... from "@mercflow/seo-module/..."` i `admin-ui` opdateres
- `pnpm-workspace.yaml`: `packages/*` glob dækker allerede `packages/shared`
- Tests: enhedstest for slug utility i `shared` (bevares fra `seo-module`)

### Acceptance criteria

- [ ] `@mercflow/shared` pakke typechecks rent
- [ ] `pnpm why @mercflow/seo-module --filter @mercflow/admin-ui` returnerer ingen afhængighed
- [ ] `slugifyForStrategy` virker korrekt importeret fra `@mercflow/shared` i admin-ui og seo-module
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (slug tests grønne)

### Out of scope

- Andre shared utilities end slug (tilføjes efter behov i later tasks)
- Design tokens (forbliver i `@mercflow/design-tokens`)

### Context for implementing agent

- `slugifyForStrategy` er i dag i `packages/seo-module/src/` og importeres i `packages/admin-ui/src/`
- Brug `packages/design-tokens` som strukturelt forbillede for en ren frontend-kompatibel pakke
- `packages/shared` skal have `"type": "module"` eller være CJS-kompatibel med begge forbrugere (seo-module er CJS, admin-ui er ESM) — overvej dual-output med `tsup`

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `packages/shared/README.md` oprettet
- [ ] PR description filled in

---

## M007 — Medusa Fork Setup / S011

---

## T035 — Fjern Medusa dashboard fra backend — `admin-ui` som eneste admin interface

**Sprint:** S011
**Milestone:** M007
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T033
**Branch:** feature/S011/T035-remove-medusa-dashboard
**PR:** https://github.com/eskobar95/mercflow/pull/73
**Merge:** `e5cf6ea`
**PRD journey:** J004 (PRD-fork-setup.md)
**ADRs:** ADR-007

### Slice objective

`@medusajs/dashboard` og tilknyttede pakker (`admin-sdk`, `admin-shared`, `admin-bundler`, `admin-vite-plugin`) fjernes fra `apps/backend`. `pnpm build` producerer ingen dashboard-bundle fra Medusa. `admin-ui` bekræftes som den eneste admin-grænseflade.

### Layers in scope

- Deps: `apps/backend/package.json` — fjern `@medusajs/dashboard`, `@medusajs/admin-sdk`, `@medusajs/admin-shared`, `@medusajs/admin-bundler`, `@medusajs/admin-vite-plugin`
- Config: `apps/backend/medusa-config.ts` — fjern eventuel `admin` / dashboard-konfiguration
- Build: verificer `pnpm build` i `apps/backend` fuldføres uden dashboard-bundle
- Dev: verificer `pnpm dev` starter backend uden dashboard-fejl; `admin-ui` Vite dev server kører uafhængigt
- Tests: ingen nye tests — eksisterende suite skal bestå

### Acceptance criteria

- [ ] `@medusajs/dashboard` ikke i `apps/backend/package.json` eller lockfile (som direkte dep)
- [ ] `pnpm build` i `apps/backend` gennemføres uden dashboard-relaterede fejl
- [ ] `pnpm dev` starter backend korrekt
- [ ] MercFlow admin-ui tilgængelig og funktionel (Vite dev server / separate port)
- [ ] Ingen Medusa admin-UI routes serveres af backend

### Out of scope

- Admin-ui feature-ændringer
- Nye admin-routes
- Ændringer i `packages/admin-ui` struktur

### Context for implementing agent

- `apps/backend/package.json` har i dag: `@medusajs/dashboard`, `@medusajs/admin-sdk`, `@medusajs/admin-shared` som deps
- Medusa bygger dashboard via `medusa build` CLI — efter fjernelse vil `medusa build` kun bundle backend
- `packages/admin-ui` kører som selvstændig Vite app på separat port — ingen ændringer her
- Tjek `apps/backend/medusa-config.ts` for eventuel `admin: { disable: false }` config

### Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes (backend)
- [ ] `apps/backend/README.md` opdateret — developer setup beskriver admin-ui som separat Vite app
- [ ] PR description filled in

---

## T036 — `store_id NOT NULL` + RLS på Medusa core tables (product, order, customer, variant, category, line_item)

**Sprint:** S011
**Milestone:** M007
**Status:** done
**Mode:** AFK
**Parallel group:** C
**Blocked by:** T033
**Branch:** feature/S011/T036-core-tables-store-id-rls
**PR:** https://github.com/eskobar95/mercflow/pull/74
**Merge:** `6001fa3`
**PRD journey:** J003 (PRD-fork-setup.md)
**ADRs:** ADR-004, ADR-005, ADR-007
**HITL approved:** 2026-06-09 — Migration + RLS + triggers; 6 M0 tables; Guapo backfill local dev; WITH CHECK; merge T037 before prod deploy

**HITL decision (locked):**
1. **Scope:** 6 M0 tables — physical name `order_line_item` (not `line_item`).
2. **Strategy:** SQL migration in `packages/medusa-fork/tenancy-core/` + RLS + shared INSERT/UPDATE triggers; no DML fork of npm product/order modules.
3. **RLS:** `tenant_isolation` with `USING` + `WITH CHECK` on `app.tenant_id`.
4. **Backfill:** Guapo `store_01KG0VBTT0714XV2CCTEBRVC47`; local dev only.
5. **Deploy:** Ship T037 before prod.

### Slice objective

`store_id text NOT NULL` tilføjet til alle 6 M0 core tables i Neon. RLS policies aktiveret per table med `tenant_isolation` policy på `app.tenant_id`. Guapo rows backfillet med `store_01KG0VBTT0714XV2CCTEBRVC47`. Alle migrations er reversible via `down()`.

### Layers in scope

- DB: migrations for `product`, `product_variant`, `product_category`, `order`, `customer`, `order_line_item`
  - `ADD COLUMN store_id text DEFAULT ''`
  - Backfill: `UPDATE ... SET store_id = 'store_01KG0VBTT0714XV2CCTEBRVC47'`
  - `ALTER COLUMN store_id SET NOT NULL; ALTER COLUMN store_id DROP DEFAULT`
  - `CREATE INDEX ON ... (store_id)`
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY`
  - `CREATE POLICY tenant_isolation ON ... USING (store_id = current_setting('app.tenant_id', true))`
- Fork (hvis DML-vej godkendes): tilføj `store_id` field til relevante DML-modeller i `packages/medusa-fork/medusa/`
- Tests: `SET LOCAL app.tenant_id = 'probe'` → query returnerer 0 rækker; med korrekt store_id → returnerer egne rækker

### HITL checkpoint

Inden implementering: godkend (1) de 6 M0 tabeller, (2) migrationsstrategi (DML vs. ren migration), (3) om Guapo backfill kan køres lokalt mod dev DB. Derefter kører agenten AFK.

### Acceptance criteria

- [x] `store_id text NOT NULL` på alle 6 core tables
- [x] RLS aktiveret og `tenant_isolation` policy tilstede på alle 6 tables
- [x] `SELECT count(*) FROM product WHERE store_id IS NULL` = 0 (efter backfill)
- [x] Samme check for alle 6 tables
- [x] `pnpm migration:run` kører rent på local dev DB
- [x] Integration test: query med probe tenant → 0 rækker; med Guapo ID → egne rækker (test-rls-medusa.ts)

### Out of scope

- `cart`, `fulfillment` og andre M1+ tabeller
- `payload.*` tabeller
- Startup wiring af subscriber (T037)

### Context for implementing agent

- Guapo store_id: `store_01KG0VBTT0714XV2CCTEBRVC47`
- RLS policy mønster: brug `current_setting('app.tenant_id', true)` — matcher `TenantIsolationSubscriber`
- Eksisterende test til reference: `apps/backend/src/scripts/test-rls-medusa.ts`
- Migrations bor i den forked Medusa package — følg MIGRATION DECISION LOG format

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm migration:run` passes lokalt
- [x] Integration test grøn
- [x] HITL: scope + strategi godkendt inden PR åbnes
- [x] Alle migrations har MIGRATION DECISION LOG + `down()`
- [x] PR description filled in

---

## M007 — Medusa Fork Setup / S012

---

## T037 — Startup tenant wiring — `TenantIsolationSubscriber` på alle module EMs + `tenantIsolationMiddleware` på alle routes

**Sprint:** S012
**Milestone:** M007
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T036
**Branch:** feature/S012/T037-tenant-startup-wiring
**PR:** https://github.com/eskobar95/mercflow/pull/75
**Merge:** `4bfc586`
**PRD journey:** J002 (PRD-fork-setup.md)
**ADRs:** ADR-004, ADR-005, ADR-007

### Slice objective

`TenantIsolationSubscriber` registreres automatisk på alle modul-EMs ved Medusa bootstrap. `tenantIsolationMiddleware` wires på alle admin og store routes. Enhver database-transaktion under en request med tenant-kontekst får `SET LOCAL app.tenant_id` injekteret. Integration test (`test-rls-medusa.ts`) består.

### Layers in scope

- Code: `apps/backend/src/subscribers/tenant-bootstrap.ts` — `onApplicationBootstrap` hook der itererer alle registrerede moduler, resolver `service.__container__["manager"]` og kalder `registerTenantSubscriber(em)`
- Config: `apps/backend/src/api/middlewares.ts` — `tenantIsolationMiddleware` tilføjet på alle admin og store route-matchers
- Tests: verificer subscriber registreret og `SET LOCAL` injekteret — brug `test-rls-medusa.ts` (allerede implementeret, verificer den stadig består mod core tables fra T036)
- Docs: `apps/backend/README.md` — tilføj sektion om tenant isolation architecture

### Acceptance criteria

- [x] `tenantIsolationMiddleware` wired og aktivt på `/admin/**` og `/store/**`
- [x] `TenantIsolationSubscriber` registreret på mindst `ProductModule` og `OrderModule` EMs ved bootstrap
- [x] `test-rls-medusa.ts` består — `current_setting('app.tenant_id', true)` returnerer korrekt store_id inde i transaktion
- [x] Request uden tenant-kontekst: subscriber skips `SET LOCAL` (ingen fejl)
- [x] `pnpm typecheck` passes

### Out of scope

- BullMQ / notification worker (separat milestone)
- Per-module `withTenant` wrapper i service layer (de eksisterende MercFlow modules har allerede `store_id` filtre)

### Context for implementing agent

- `apps/backend/src/lib/tenant-isolation/` indeholder allerede:
  - `tenant-context.ts` — `AsyncLocalStorage` med `TenantContext.run()` og `TenantContext.getStoreId()`
  - `tenant-subscriber.ts` — `TenantIsolationSubscriber` med `afterTransactionStart`
  - `register-tenant-subscriber.ts` — `registerTenantSubscriber(em)` helper
  - `tenant-middleware.ts` — `tenantIsolationMiddleware`
- Medusa module iteration: brug `container.resolve(Modules.PRODUCT)` etc. for at få services; access EM via `service.__container__["manager"]`
- `onApplicationBootstrap` i Medusa: registreres som en subscriber i `apps/backend/src/subscribers/`
- Verificer at bootstrap hook kører FØR første HTTP request behandles

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm test` passes (`test-rls-medusa.ts` grøn)
- [x] `apps/backend/README.md` opdateret med tenant isolation sektion
- [x] PR description filled in

---

<!-- Total: T001–T037 | AFK: 29 | HITL: 7 (T003, T008, T013, T023, T027, T033, T036) | Cancelled: T029 -->
<!-- Sprints: S001–S012 | Milestones: M000–M007 -->

---

## M008 — Metafields

---

## T038 — `metafield-module` definitions: model, migration, RLS, service (definition CRUD), admin API routes

**Sprint:** S013
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**PRD journeys:** J001
**Branch:** `feature/S013/T038-metafield-definitions-engine`
**PR:** https://github.com/eskobar95/mercflow/pull/77
**Merge:** `f64238a`

### Slice objective

A merchant-admin can create, list, update, and delete metafield definitions for products and categories via the admin API. Definitions are tenant-scoped with RLS.

### Layers in scope

- **DB:** `metafield_definitions` table via Medusa DML. Columns: `id`, `store_id NOT NULL`, `owner_type` (enum: `product` | `category`), `namespace TEXT NOT NULL`, `key TEXT NOT NULL`, `name TEXT NOT NULL`, `description TEXT`, `type TEXT NOT NULL` (ValueType), `validations JSONB`, `pinned_position INT`, `is_required BOOLEAN DEFAULT false`, `category_constraint_id TEXT`, `is_standard BOOLEAN DEFAULT false`. Unique constraint: `(store_id, owner_type, namespace, key)`.
- **RLS:** Two policies — SELECT: `store_id IS NULL OR store_id = current_setting('app.tenant_id', true)` (library seeds readable by all); INSERT/UPDATE/DELETE: `WITH CHECK (store_id = current_setting('app.tenant_id', true))`.
- **Service:** `createDefinition`, `updateDefinition`, `deleteDefinition`, `getDefinition`, `listDefinitions({ ownerType, storeId, categoryConstraintId? })` — all filter by `store_id`.
- **Admin API:**
  - `GET    /admin/metafield-definitions?owner_type=&category_id=`
  - `POST   /admin/metafield-definitions`
  - `GET    /admin/metafield-definitions/:id`
  - `PUT    /admin/metafield-definitions/:id`
  - `DELETE /admin/metafield-definitions/:id`
  All protected by Medusa admin JWT. Zod validation on request body.
- **Tests:** Unit test for service (create, unique-constraint violation, tenant isolation). Integration test: two tenants — definition created by tenant A not returned for tenant B.

### Context / assumptions

- New package `packages/metafield-module/` — `@mercflow/metafield-module`. Register in `apps/backend/medusa-config.ts`.
- `is_standard = true` rows with `store_id = NULL` are seeded in T040. T038 does NOT seed library data.
- `ValueType` exported as a TypeScript string-literal union (not a DB enum) to allow extension without migrations.
- `TenantIsolationSubscriber` is already wired (M007/T037) — no additional startup wiring needed.
- Pagination: `limit = Math.min(query.limit ?? 50, 100)` (per PRD-api-hardening, T031).

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm test packages/metafield-module` passes
- [x] `pnpm migration:run` clean locally
- [x] `POST /admin/metafield-definitions` returns 201 with created definition
- [x] Two-tenant isolation test: GET for tenant B returns 0 rows when only tenant A has definitions
- [x] RLS `WITH CHECK` test: API call without `app.tenant_id` set cannot insert `store_id = NULL` row
- [x] `packages/metafield-module/README.md` created with field definitions + API route reference + migration notes
- [x] PR description filled in

---

## T039 — `metafield-module` values: model, migration, RLS, service (upsert/list), admin batch API

**Sprint:** S013
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**PRD journeys:** J002
**Branch:** `feature/S013/T039-metafield-values-engine`
**PR:** https://github.com/eskobar95/mercflow/pull/76
**Merge:** `8df5999`

### Slice objective

A merchant-admin can store and retrieve typed metafield values for a product or category via the admin API. Values are tenant-scoped, typed, and locale-aware from day one.

### Layers in scope

- **DB:** `metafield_values` table. Columns: `id`, `store_id NOT NULL`, `definition_id TEXT NOT NULL` (FK → `metafield_definitions.id`), `owner_id TEXT NOT NULL`, `owner_type TEXT NOT NULL`, `value_text TEXT`, `value_json JSONB`, `value_number NUMERIC`, `value_boolean BOOLEAN`, `locale TEXT NOT NULL DEFAULT 'en'`. Unique constraint: `(store_id, definition_id, owner_id, locale)`.
- **RLS:** SELECT + INSERT/UPDATE/DELETE: `store_id = current_setting('app.tenant_id', true)`.
- **Service:** `upsertValue(input, storeId)` — upserts by unique constraint; `deleteValue(id, storeId)`; `listValues({ ownerType, ownerId, storeId, locale? })` — joins with definition to return typed objects including definition metadata.
- **Admin API:**
  - `GET    /admin/metafield-values?owner_type=product&owner_id=`
  - `POST   /admin/metafield-values/batch` — upsert array of values (max 50 per request)
  - `DELETE /admin/metafield-values/:id`
  All protected by Medusa admin JWT. Zod validation.
- **Tests:** Unit: typed column mapping (each ValueType writes the correct column, others NULL). Integration: upsert + list round-trip; tenant isolation.

### Context / assumptions

- T038 must exist (types, module registration) but can be developed in parallel since the model is independent at the DB level. Merge T038 before T039 or develop on same branch with care.
- Service `listValues` returns shape: `{ id, namespace, key, name, type, value: <typed>, locale }` — frontend never needs to inspect which column was used.
- Batch upsert is transactional: all-or-nothing per request.
- `locale` included in unique constraint — same `(definition_id, owner_id)` can have multiple locale values (future i18n).

### Definition of done

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm test packages/metafield-module` passes (including value tests)
- [x] `pnpm migration:run` clean locally
- [x] Batch upsert of 3 values returns 200 with persisted values
- [x] `listValues` returns typed output (number as `number`, boolean as `boolean`, not raw strings)
- [x] Two-tenant isolation test on values
- [x] `packages/metafield-module/README.md` updated with values section
- [x] PR description filled in

---

## T040 — Standard library seeds (skincare + fashion) + activation service + admin library routes

**Sprint:** S014
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T038
**PRD journeys:** J003
**Branch:** `feature/S014/T040-metafield-standard-library`
**PR:** https://github.com/eskobar95/mercflow/pull/78
**Merge:** `0c9a02c`

### Slice objective

A merchant-admin can browse MercFlow's curated standard definitions and activate them for their store in one click. Skincare and fashion verticals are available at launch.

### Layers in scope

- **DB migration (seed):** Idempotent migration that inserts `is_standard = true`, `store_id = NULL` definitions for two verticals:
  - **skincare:** `active_ingredients` (multi_line_text), `spf_level` (number_integer), `skin_type` (list.single_line_text), `cosmetic_function` (list.single_line_text), `target_gender` (list.single_line_text), `age_group` (single_line_text), `scent` (single_line_text), `product_form` (single_line_text)
  - **fashion:** `material` (list.single_line_text), `fit_type` (single_line_text), `wash_instructions` (multi_line_text), `country_of_origin` (single_line_text), `care_label` (single_line_text), `sustainable_materials` (boolean)
  Uses `INSERT ... ON CONFLICT DO NOTHING`.
- **Service:** `listStandardLibrary({ vertical? })` — returns all `is_standard = true` definitions; `activateStandardDefinitions(definitionIds[], storeId)` — creates tenant copies (`store_id = storeId`, `is_standard = false`, same namespace/key/type).
- **Admin API:**
  - `GET  /admin/metafield-definitions/standard-library?vertical=skincare`
  - `POST /admin/metafield-definitions/activate-standard` — body: `{ definition_ids: string[] }`
- **Tests:** Library query returns seeds for both verticals. Activation creates tenant copies; running twice is idempotent (unique constraint on definitions).

### Context / assumptions

- Library seeds have `namespace = "mercflow_standard"`. Activated copies inherit same namespace/key but get `store_id` of the activating tenant.
- `vertical` is stored as a tag/attribute on the definition — add `vertical TEXT` column to `metafield_definitions` (requires small addendum to T038 migration, or add here as a separate migration). Coordinate with T038 PR.
- Activation is all-or-nothing per request. Skip already-existing definitions (idempotent).

### Definition of done

- [x] `pnpm migration:run` seeding both verticals cleanly
- [x] `GET /admin/metafield-definitions/standard-library` returns 14 definitions (8 skincare + 6 fashion)
- [x] `POST /admin/metafield-definitions/activate-standard` with 3 IDs creates 3 tenant definitions
- [x] Calling activate twice is idempotent (no duplicate definitions)
- [x] Library seeds visible to a tenant even before any activation (RLS SELECT policy allows `store_id IS NULL`)
- [x] `pnpm typecheck` + `pnpm lint` + `pnpm test` pass
- [x] PR description filled in

---

## T041 — Admin UI — Custom Data settings page (`/settings/custom-data`)

**Sprint:** S015
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T038
**PRD journeys:** J001
**Branch:** `feature/S015/T041-custom-data-settings-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/79
**Merge:** `34bc047`

### Slice objective

A merchant-admin can navigate to Settings → Custom Data, see their product and category metafield definitions, and create/edit/delete/pin definitions without touching code.

### Layers in scope

- **UI route:** `/settings/custom-data` — new settings page in admin-ui.
- **Entity sidebar:** Products, Categories. Variants/Orders/Customers shown greyed out with "Coming soon" badge.
- **Products entity view:** Two tabs — "All products" | "By category". Definitions table: name, type badge (color-coded), usage count, actions menu (edit, delete, pin/unpin).
- **Add/edit definition slide-over:** Fields: Name, Namespace (pre-filled "custom", editable), Key (auto-slugified from name, editable), Type picker (list of ValueTypes with icons), Description (optional), Pinned (toggle), Required (toggle). Save → POST/PUT `/admin/metafield-definitions`.
- **Delete confirmation modal:** "This will also delete all values for this definition."
- **Empty state:** "No definitions yet. Add your first definition or browse the standard library."
- **Settings navigation:** Add "Custom data" entry to the settings sidebar nav group.
- **Tests:** Smoke test — renders without crash; definition list renders correctly; add form validates required fields.

### Context / assumptions

- No drag-to-reorder for pinning in v1; `pinned_position` set via a number input or toggle (see OQ-03 decision).
- Type picker shows human-readable labels: "Short text", "Long text", "Number", "True/False", "Date", "Color", "URL", "JSON", "List of text", "List of numbers".
- "By category" tab is visible but can show empty state initially — category-constrained definitions are created the same way but with a category picker field.
- The "Browse standard library" button is a stub in this task (opens empty modal) — full implementation is T045.
- No `pnpm react-doctor` issues — 0 violations.

### Definition of done

- [x] `/settings/custom-data` renders with entity sidebar + Products selected by default
- [x] "Add definition" slide-over opens, validates, posts to API, and shows new definition in list
- [x] "Edit" updates definition; "Delete" shows confirmation modal then removes from list
- [x] "Primary field" toggle in definition form sets `is_primary`; shown in definition list as a badge
- [x] Pin position (integer) field sets `pinned_position`
- [x] Empty state shown when no definitions
- [x] Settings sidebar includes "Custom data" link
- [x] `pnpm react-doctor:admin-ui` = 0 issues
- [x] `pnpm typecheck` + `pnpm lint` pass
- [x] PR description filled in

---

## T042 — Admin UI — Product form: "Product metafields" + "Category metafields" sections

**Sprint:** S015
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T039, T041
**PRD journeys:** J002, J004
**Branch:** `feature/S015/T042-product-form-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/82
**Merge:** `80b4855`

### Slice objective

When editing a product, the merchant-admin sees their metafield definitions as editable fields, fills values, and saves them with the product. Category-constrained definitions appear in a separate section only when the product has a matching category.

### Layers in scope

- **UI — Product page:** Add two sections below the Variants section using the **two-tier presentation pattern**:

  **Tier system (from Shopify browser test 2026-06-10):**
  - `is_primary = true` definitions → always visible as text/select inputs
  - `is_primary = false` definitions → rendered as `+ [name]` chips in a row; clicking a chip expands it inline as an input
  - Category field shows badge `N metafelter` immediately after a category is selected (count of category-constrained definitions)

  1. **"Product metafields"** — primary definitions as always-visible inputs + secondary definitions as `+ chip` row. "Add definition" shortcut link to Settings.
  2. **"Category metafields"** — injected inline (not a tab) when product has a category assigned. Section header shows category badge (e.g. `Solcreme i Hudpleje`). Shows definitions with `category_constraint_id` matching the product's category. Same two-tier layout. Hidden entirely when no category is set.

- **UI — Value persistence:** On product save, batch-upsert all changed metafield values via `POST /admin/metafield-values/batch`.
- **Empty state (product metafields):** "No definitions added yet. [Go to Custom Data settings →]"
- **Tests:** Renders both sections; primary field visible; secondary chip expands on click; batch upsert called with correct payload.

### Context / assumptions

- Read existing values on product load via `GET /admin/metafield-values?owner_type=product&owner_id=:id`.
- Values are saved as part of the product form submit flow, not independently. If product save fails, value batch is not sent.
- "See all" toggle shows/hides unpinned definitions inline — no separate page.
- No `pnpm react-doctor` violations.

### Definition of done

- [x] "Product metafields" section renders pinned definitions as editable inputs
- [x] "Category metafields" section appears/disappears based on product category
- [x] Values persist on product save and are visible on page reload
- [x] Empty state renders with link to settings when no definitions exist
- [x] `pnpm react-doctor:admin-ui` = 0 issues
- [x] `pnpm typecheck` + `pnpm lint` pass
- [x] PR description filled in

---

## T043 — Admin UI — Category form metafields section + category-constraint filter in API

**Sprint:** S014
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T039
**PRD journeys:** J004, J006
**Branch:** `feature/S014/T043-category-form-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/81
**Merge:** `43d3cb4`

### Slice objective

When editing a category, the merchant-admin sees category-level metafield definitions as editable fields and can fill values. Category-constrained product definitions work correctly (filter by `category_constraint_id`).

### Layers in scope

- **API:** Ensure `GET /admin/metafield-definitions?owner_type=category` works correctly (covered by T038 but validated here). Add `?category_id=` filter to product definitions query (for the category-constrained section in the product form — also consumed by T042).
- **UI — Category page:** Add "Category metafields" section. Fetches definitions with `owner_type = 'category'` and values with `owner_type = 'category', owner_id = <categoryId>`. Same input rendering as T042. Saves via batch upsert on category form submit.
- **Tests:** Category form renders section; value save round-trip works.

### Context / assumptions

- `category_constraint_id` stores the Medusa category ID as plain text; T038 defines the column. This task validates the filter works via the admin API.
- Category form integration follows the same pattern as the product form (T042) — reuse components where possible.
- No new DB migrations needed in this task.

### Definition of done

- [x] Category page shows "Category metafields" section with definitions
- [x] Values save on category form submit and persist on reload
- [x] `GET /admin/metafield-definitions?owner_type=product&category_id=X` returns correct filtered definitions
- [x] `pnpm react-doctor:admin-ui` = 0 issues
- [x] `pnpm typecheck` + `pnpm lint` pass
- [x] PR description filled in

---

## T044 — Store API — `GET /store/v1/metafields` with publishable_api_key auth + cross-tenant isolation test

**Sprint:** S014
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T039
**PRD journeys:** J005
**Branch:** `feature/S014/T044-store-api-metafields`
**PR:** https://github.com/eskobar95/mercflow/pull/80
**Merge:** `e6d6eb8`

### Slice objective

A storefront can fetch metafield values for a product or category via the public store API, authenticated by publishable API key. Zero cross-tenant data is returned under any circumstances.

### Layers in scope

- **Store route:** `GET /store/v1/metafields?owner_type=product&owner_id=:id` — protected by standard Medusa publishable_api_key middleware. Returns: `[{ namespace, key, name, type, value, locale }]`. Only returns values where `definition.is_required = false OR value IS NOT NULL` (no empty required fields exposed to storefront).
- **Tenant resolution:** `Host` header → store → `store_id` (same pattern as seo-module T008 middleware).
- **Tests:** Integration: two tenants with overlapping product IDs — tenant A store request returns only tenant A values. Unauthenticated request returns 401. Wrong publishable key returns 401/403.

### Context / assumptions

- Mount under `/store/v1/` (per PRD-api-hardening T032 versioning requirement).
- Response pagination: max 100 values per request.
- No filtering by namespace/key in v1 — return all values for the owner.

### Definition of done

- [x] `GET /store/v1/metafields?owner_type=product&owner_id=X` returns correct values
- [x] Cross-tenant isolation integration test: 0 cross-tenant rows
- [x] Unauthenticated request returns 401
- [x] `pnpm typecheck` + `pnpm lint` + `pnpm test` pass
- [x] PR description filled in

---

## T045 — Admin UI — Standard library browse dialog in Custom Data settings

**Sprint:** S016
**Milestone:** M008
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T040, T041
**PRD journeys:** J003
**Branch:** `feature/S016/T045-standard-library-browse-ui`
**PR:** https://github.com/eskobar95/mercflow/pull/83
**Merge:** `93bc552`

### Slice objective

A merchant-admin can open the standard library from Settings → Custom Data, filter by vertical, select definitions, and activate them in one click. The activated definitions immediately appear in their definitions list.

### Layers in scope

- **UI — Library modal:** Triggered by "Browse standard library" button (stub added in T041). Full implementation: fetch `GET /admin/metafield-definitions/standard-library`, show vertical filter tabs (All | Skincare | Fashion), checklist of definitions with type badge and description, "Activate selected (N)" button. On activate: POST `/admin/metafield-definitions/activate-standard` → close modal → refresh definitions list.
- **UX details:** Already-activated definitions shown as greyed-out with a checkmark. Empty selection disables the activate button.
- **Tests:** Modal opens; vertical filter changes visible items; activate calls correct API with selected IDs.

### Context / assumptions

- "Already activated" is determined by checking if a definition with matching `namespace + key` already exists in the tenant's definitions list (fetched before opening modal).
- No new API routes — all endpoints built in T040.

### Definition of done

- [x] "Browse standard library" button opens modal with definitions
- [x] Vertical filter works (Skincare shows 8, Fashion shows 6, All shows 14)
- [x] Selecting 3 and clicking "Activate" creates 3 tenant definitions
- [x] Already-activated definitions appear greyed with checkmark
- [x] `pnpm react-doctor:admin-ui` = 0 issues
- [x] `pnpm typecheck` + `pnpm lint` pass
- [x] PR description filled in

---

---

## M009 — Product Form Polish

> Se PRD-product-form-polish.md

---

## T046 — Unsaved state indicator + `beforeunload` guard

**Sprint:** S017
**Milestone:** M009
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/85
**Merge:** `f71c460`
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S017/T046-unsaved-state-indicator
**PRD journey:** J002 (PRD-product-form-polish.md)

### Slice objective

Merchant ser tydeligt når produktformularen har ændringer der ikke er gemt. Navigation væk fra en uGemt formular kræver bekræftelse.

### Layers in scope

- UI: `packages/admin-ui` — produktformular
- React Hook Form `isDirty` → `document.title` præfikset med `• ` når dirty
- `beforeunload` handler med `event.preventDefault()` + `event.returnValue = ""`
- Cleanup ved unmount og ved successful save

### Context for implementing agent

- Produktformularen bruger allerede React Hook Form — find den eksisterende `useForm` instans
- `beforeunload` kræver `event.preventDefault()` + `event.returnValue = ""` for cross-browser support
- Sørg for at cleanup sker i `useEffect` return function

### Definition of done

- [x] `document.title` viser `• Produktnavn` ved dirty state
- [x] Browser-dialog vises ved navigation med unsaved changes
- [x] Dialog vises IKKE når formularen er ren (ingen falske positiver)
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T048 — SEO section: lazy preview + character counter

**Sprint:** S017
**Milestone:** M009
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/84
**Merge:** `622ad70`
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S017/T048-seo-lazy-preview
**PRD journey:** J003 (PRD-product-form-polish.md)

### Slice objective

SEO-sektionen viser instruktionstekst når ingen data er udfyldt, og et live Google snippet preview med character counters når felterne er udfyldt.

### Layers in scope

- UI: `packages/admin-ui` — produktformulars SEO sektion
- Konditionel rendering: `if (!seoTitle && !seoDescription)` → empty state med instruktionstekst
- Live Google snippet preview: titel (rød > 60) + description (rød > 160)
- Preview opdateres debounced 300ms på keystroke
- Character count badge inline under hvert felt

### Definition of done

- [x] Tom tilstand: instruktionstekst (ikke blank box)
- [x] Udfyldt tilstand: Google snippet preview live
- [x] Character counters med rød fejltilstand ved overskridelse
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T047 — Variant UX: progressiv "Add options" CTA → variant grid

**Sprint:** S018
**Milestone:** M009
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/86
**Merge:** `6d89f1b`
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S018/T047-variant-progressive-ux
**PRD journey:** J001 (PRD-product-form-polish.md)

### Slice objective

Variants-sektionen starter med ét simpelt CTA frem for den fulde variant-matrix. Option builder udvider sig inline. Grid vises kun efter mindst én option er defineret.

### Layers in scope

- UI: `packages/admin-ui` — Variants sektion på produktformularen
- Initial state: `+ Add options like size or color` CTA-knap
- Option builder (inline expand): option name input + comma-separated values input + "Add option" knap
- Grid render: aktiveres når `options.length > 0`
- Eksisterende variant CRUD (pris, lager) bevares uændret

### Context for implementing agent

- Find den eksisterende `VariantsSection` eller tilsvarende komponent
- "Default Title" variant for simple produkter skal IKKE vises som en row i gridden
- Tilføj "Add another option" link under første option for multipel-option produkter

### Definition of done

- [x] Tom tilstand: kun CTA synlig
- [x] Efter én option: grid med korrekte variant rows
- [x] Eksisterende variant-data (pris, lager) vist korrekt i grid
- [x] Ingen "Default Title" row for simple produkter
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T049 — "Physical product" toggle + shipping section collapse + dimension fields

**Sprint:** S018
**Milestone:** M009
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/87
**Merge:** `b0ade41`
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S018/T049-physical-toggle-dimensions
**PRD journey:** J004, J005 (PRD-product-form-polish.md)

### Slice objective

Shipping-sektionen har et "Physical product" toggle (default ON). Toggle OFF kollapser alle shipping-felter. Dimensioner (L×W×H + weight) er synlige og persisterede per variant.

### Layers in scope

- UI: `packages/admin-ui` — Shipping sektion på produktformularen
- Toggle: kontrollerer `product_variant.requires_shipping` for alle variants
- Collapse animation på shipping-felter ved toggle OFF
- Dimension inputs per variant: Length (cm), Width (cm), Height (cm), Weight (g)
- "Apply to all variants" knap med bekræftelse når varianter har eksisterende værdier
- Read/write: Medusa Admin JS SDK `product_variant.length/width/height/weight/requires_shipping`

### Context for implementing agent

- `product_variant.length`, `.width`, `.height`, `.weight` eksisterer allerede i Medusa — ingen migration nødvendig
- **OQ-01:** Verificer unit-konvention i Medusa-forken (mm? cm?) FØR implementering — konverter KUN i UI, ikke i DB

### Definition of done

- [x] Toggle OFF skjuler shipping-felter med animation
- [x] Toggle sætter `requires_shipping` korrekt på alle variants
- [x] Dimension-felter vises og gemmes korrekt
- [x] "Apply to all variants" fungerer med bekræftelse
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## M010 — Fulfillment Intelligence

> Se PRD-fulfillment-intelligence.md

---

## T050 — `packaging-module`: PackagingType model, migration, RLS, service (CRUD + suggestPackaging), admin API

**Sprint:** S019
**Milestone:** M010
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/88
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S019/T050-packaging-module
**PRD journey:** J001, J002, J003 (PRD-fulfillment-intelligence.md)

### Slice objective

Packaging-modulet eksisterer med `packaging_types` tabel, fuld CRUD service og `suggestPackaging()` algoritme. Admin API eksponerer CRUD + `/suggest` endpoint.

### Layers in scope

- Package: `packages/packaging-module/` — ny Medusa module
- DB: `packaging_types` — `id`, `store_id NOT NULL`, `name`, `type` enum (`box|envelope|bag|tube|other`), `length_mm int`, `width_mm int`, `height_mm int`, `max_weight_g int`, `is_active boolean`, `deleted_at`
- RLS: `store_id = current_setting('app.tenant_id', true)`
- Service: `PackagingTypeService extends MedusaService` — CRUD + `suggestPackaging({ items: [{variantId, quantity}] })`
- `suggestPackaging`: `totalVolumeMm3 = sum(L×W×H×qty) × 1.2` + `totalWeightG = sum(weight×qty)` → smallest qualifying entry
- API: CRUD routes + `POST /admin/packaging-types/suggest`
- Validation: Zod på alle request bodies
- Module registration i `apps/backend/medusa-config.ts`
- Tests: unit test på `suggestPackaging` med mock variants
- Docs: `packages/packaging-module/README.md`

### Definition of done

- [x] `pnpm migration:run` ren lokalt
- [x] CRUD API returnerer korrekte statuskoder
- [x] `suggestPackaging` returnerer korrekt forslag i unit tests
- [x] Zero cross-tenant rows (integration test)
- [x] Module registreret i backend
- [x] `pnpm typecheck` + `pnpm lint` grøn
- [x] `packages/packaging-module/README.md` oprettet

---

## T051 — Admin UI: Settings → Packaging catalog

**Sprint:** S020
**Milestone:** M010
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/89
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T050
**Branch:** feature/S020/T051-packaging-settings-ui
**PRD journey:** J001, J005 (PRD-fulfillment-intelligence.md)

### Slice objective

Merchant kan administrere deres pakke-katalog i Admin → Settings → Packaging. Tabel med alle typer, "Add packaging type" slide-over, edit og delete.

### Layers in scope

- UI: `packages/admin-ui` — `/settings/packaging` side
- Tabel: name, type badge, dimensions (L×W×H cm, konverteret fra mm), max weight, is_active toggle, edit/delete actions
- "Add packaging type" slide-over: name, type picker, dimension inputs (cm → sendes som mm til API), max weight (g/kg), is_active toggle
- Empty state med instruktionstext + CTA
- Settings sidebar: "Packaging" link under Shipping-sektion

### Definition of done

- [x] CRUD fungerer end-to-end
- [x] Dimensioner vises korrekt i cm (konverteret fra mm)
- [x] Empty state vist korrekt
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T052 — Order fulfillment widget: packaging forslag + override dropdown

**Sprint:** S020
**Milestone:** M010
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/90
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T050
**Branch:** feature/S020/T052-fulfillment-packaging-widget
**PRD journey:** J002, J003 (PRD-fulfillment-intelligence.md)

### Slice objective

Order detail-siden viser et "Suggested packaging" widget i fulfillment-sektionen. Merchant accepterer eller overrider forslaget. Valgt emballage-ID klar til T053 Shipmondo-integration.

### Layers in scope

- UI: `packages/admin-ui` — Order detail side, fulfillment sektion
- Kalder `POST /admin/packaging-types/suggest` med order line items (variant_id + quantity)
- Loading: skeleton mens request pågår
- Succes: packaging navn + dimensioner + utilisation % (`Math.round(totalVol / packagingVol × 100)`)
- Ingen egnet emballage: contextuel besked med link til Settings → Packaging
- Override: "Change" knap → dropdown med alle aktive `packaging_types`
- Confirmed packaging ID eksponeret via callback/state til parent for T053

### Definition of done

- [x] Widget viser forslag for ordre med varianter der har dimensioner
- [x] Override dropdown viser aktive pakke-typer
- [x] Ingen-forslag tilstand vist korrekt
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T053 — Shipmondo connector: packaging dimensions auto-fill ved label-generering

**Sprint:** S021
**Milestone:** M010
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/91
**Follow-up PR:** https://github.com/eskobar95/mercflow/pull/93 — merged `b891b26` (local E2E fixes + reproducible dev setup)
**Mode:** HITL
**HITL reason:** Kræver live Shipmondo API-verifikation — label-generering kan ikke mockes fuldt ud; menneskelig bekræftelse af korrekt dimension-payload er nødvendig
**Parallel group:** A
**Blocked by:** T052
**Branch:** feature/S021/T053-shipmondo-packaging-autofill
**PRD journey:** J004 (PRD-fulfillment-intelligence.md)

### Slice objective

Shipmondo label-generering præ-udfyldes med dimensioner fra bekræftet emballage. Merchant behøver ikke manuelt taste boks-mål i Shipmondo.

### Layers in scope

- Code: `packages/connector-module` — Shipmondo integration
- `generateLabel(fulfillmentId, packagingTypeId)` — resolver `PackagingType` og injekterer dimensioner i Shipmondo `POST /shipments` payload
- Dimensioner konverteret mm → cm og g → kg per Shipmondo API spec
- Order detail UI: "Generate label" knap sender `packagingTypeId` fra T052 widget
- Fallback: `packagingTypeId = null` → kald uden dimensioner (ingen fejl)
- Tests: unit test verificerer korrekt payload-mapping

### Context for implementing agent

- Verificer Shipmondo `POST /shipments` payload format og enheder inden implementering
- Find eksisterende Shipmondo integration i connector-module og udvid `generateLabel`
- HITL checkpoint: manuel verifikation af Shipmondo test-forsendelse med korrekte dimensioner

### Definition of done

- [x] Shipmondo label-kald indeholder korrekte dimensioner fra valgt `PackagingType`
- [x] HITL: manuel verifikation af Shipmondo test-forsendelse gennemført (sandbox shipment `58028300`; PR #93 lokal E2E)
- [x] Fallback (null packagingTypeId) fungerer uden fejl
- [x] Unit test på payload-mapping grøn
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## M011 — Fulfillment Packaging Persistence

> Se PRD-fulfillment-intelligence.md (OQ-01)

---

## T054 — `packaging-module`: `shipment_packaging` model, migration, RLS, upsert service, admin API

**Sprint:** S022
**Milestone:** M011
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S022/T054-shipment-packaging-model
**PR:** https://github.com/eskobar95/mercflow/pull/94
**PRD journey:** J003 (PRD-fulfillment-intelligence.md, OQ-01)

### Slice objective

Bekræftet emballage per fulfillment persisteres i packaging-modulet. Admin API kan læse og upserte valg pr. `fulfillment_id` med dimension-snapshot til historik.

### Layers in scope

- Package: `packages/packaging-module/`
- DB: `shipment_packaging` — `id`, `store_id NOT NULL`, `fulfillment_id` (unique per store), `packaging_type_id`, `dimensions_snapshot_json` (length_mm, width_mm, height_mm, max_weight_g, name), `deleted_at`
- RLS: `store_id = current_setting('app.tenant_id', true)`
- Service: `upsertShipmentPackaging({ storeId, fulfillmentId, packagingTypeId })` — snapshots dimensions from live `PackagingType` at write time; soft-clear on explicit delete
- API: `GET /admin/fulfillments/:fulfillment_id/shipment-packaging`, `PUT /admin/fulfillments/:fulfillment_id/shipment-packaging`
- Validation: Zod on request bodies; reject unknown `packaging_type_id` for tenant
- Tests: unit test on snapshot shape; integration test on tenant isolation
- Docs: update `packages/packaging-module/README.md` (field definitions + routes)

### Definition of done

- [x] `pnpm migration:run` clean locally
- [x] Upsert returns persisted row with snapshot JSON
- [x] Cross-tenant read/write blocked (integration test)
- [x] `pnpm typecheck` + `pnpm lint` green
- [x] README updated

---

## T055 — Order detail: persist + restore confirmed packaging on reload

**Sprint:** S022
**Milestone:** M011
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T054
**Branch:** feature/S022/T055-order-packaging-persist-ui
**PR:** https://github.com/eskobar95/mercflow/pull/95
**PRD journey:** J003, J004 (PRD-fulfillment-intelligence.md)

### Slice objective

Order detail gemmer merchant's packaging-valg (suggestion accept eller override) og genskaber det ved reload. "Generate label" bruger persisted `packaging_type_id` som default.

### Layers in scope

- UI: `packages/admin-ui` — `OrderSuggestedPackagingWidget` + `OrderFulfillmentSection`
- On confirm/override: `PUT /admin/fulfillments/:id/shipment-packaging`
- On load: `GET` før suggestion; persisted choice takes precedence over fresh suggest
- Loading/error states explicit; failed save blocks silent override switch
- Wire `packagingTypeId` into existing Shipmondo label flow from persisted row
- Tests: widget/hook test for restore + save paths

### Definition of done

- [x] Reloading order detail shows last confirmed packaging
- [x] Override persists and survives reload
- [x] Generate label uses persisted id when set
- [x] `pnpm react-doctor:admin-ui` 0 issues
- [x] `pnpm typecheck` + `pnpm lint` green

---

---

## M012 — Notification System

> T056–T063 — se PRD-notification-system.md og ADR-009

---

## T056 — `notification-module` foundation: EmailConfig + EmailDelivery models, migrations, RLS, service, admin API

**Sprint:** S023
**Milestone:** M012
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/97
**PRD journey:** J003, J004 (PRD-notification-system.md)
**ADRs:** ADR-009

### Slice objective

`@mercflow/notification-module` eksisterer med de to tabeller, fuld service og admin API. `enqueueEmail()` sender BullMQ-job til `mercflow:notifications` queue. Delivery history er læsbar via admin API.

### Layers in scope

- Package: `packages/notification-module/` — ny Medusa module
- DB: `email_configs` tabel — `id`, `store_id NOT NULL`, `domain`, `from_email`, `from_name`, `reply_to`, `logo_url`, `brand_color`, `support_email`, `ses_domain_status enum('pending','verified','failed')`, `ses_identity_arn`, `fallback_from`
- DB: `email_deliveries` tabel — `id`, `store_id NOT NULL`, `template_key`, `to_email`, `entity_id`, `idempotency_key UNIQUE`, `status enum('queued','sent','failed','dead_letter')`, `error_message`, `sent_at`, `ses_message_id`
- RLS: `store_id = current_setting('app.tenant_id', true)` på begge tabeller
- Service: `NotificationService extends MedusaService` — `getEmailConfig`, `updateEmailConfig`, `enqueueEmail({ storeId, templateKey, to, entityId, data })` → BullMQ job, `listDeliveries({ storeId, limit, offset })`, `resendEmail(deliveryId, storeId)`
- `enqueueEmail`: jobId = `{storeId}:{templateKey}:{entityId}` (idempotency); skips enqueueing if job already exists
- SES client: **stub interface only** — real SES calls implementeres i T057/T058
- Admin API:
  - `GET /admin/notification-config`
  - `PUT /admin/notification-config/branding` — logo_url, brand_color, from_name, reply_to, support_email
  - `GET /admin/email-deliveries` — `?limit&offset`
  - `POST /admin/email-deliveries/:id/resend`
- Validation: Zod på PUT branding body + resend
- Module registration i `apps/backend/medusa-config.ts`
- Tests: unit test på `enqueueEmail` idempotency (duplicate job = no-op)
- Docs: `packages/notification-module/README.md` (initial version)

### Context for implementing agent

- BullMQ er allerede i stacken via Redis — brug eksisterende Redis connection fra `apps/backend`
- Queue navn: `mercflow:notifications`; job navn: `send-email`
- `enqueueEmail` skriver `EmailDelivery` med `status: 'queued'` ved enqueueing; worker opdaterer til `sent`/`failed` (T058)
- SES client stub: `interface ISESClient { sendEmail(params): Promise<{ messageId: string }> }` — ingen rigtig AWS-kald; stub returnerer fake messageId

### Definition of done

- [ ] `pnpm migration:run` ren lokalt
- [ ] `enqueueEmail` idempotency test grøn
- [ ] Admin API: GET/PUT config + GET deliveries + POST resend returnerer korrekte statuskoder
- [ ] Zero cross-tenant rows (integration test)
- [ ] Module registreret i backend
- [ ] `pnpm typecheck` + `pnpm lint` grøn
- [ ] `packages/notification-module/README.md` oprettet

---

## T057 — SES domain identity management: `setupDomain()`, `checkDomainStatus()`, DKIM records, admin API domain routes

**Sprint:** S024
**Milestone:** M012
**Status:** done
**Mode:** AFK
**HITL approved:** 2026-06-11 — mail.mercflow.shop verified (eu-north-1); IAM user mercflow + AWS_* in apps/backend/.env; production SES (50k/day quota, no sandbox banner)
**HITL reason:** AWS SES account prerequisites kræver menneskelig handling inden T057 kan køre end-to-end: (1) IAM-bruger med SES send+identity permissions, (2) SES sandbox exit for production sending, (3) `mail.mercflow.shop` verificeret som fallback sending domain (PRD OQ-04)
**Parallel group:** A
**Blocked by:** none
**Unblocked by:** T056 (PR #97 merged `d7194a4`)
**Branch:** cursor/s024-t057-ses-domain-identity-dc6a
**PR:** https://github.com/eskobar95/mercflow/pull/104
**Merged:** `development` @ `33a98d2` (2026-06-11)
**PRD journey:** J001 (PRD-notification-system.md)
**ADRs:** ADR-009

### Slice objective

Merchant kan sætte deres sending domain op i MercFlow og modtager de 4 DNS records (3 CNAME DKIM + 1 TXT SPF) der skal tilføjes til deres DNS. System poller SES og opdaterer verifikationsstatus automatisk.

### Layers in scope

- Code: `packages/notification-module` — `SESIdentityService` (eller udvid `NotificationService`)
- AWS SDK: `@aws-sdk/client-ses` — `CreateEmailIdentityCommand`, `GetEmailIdentityCommand`
- `setupDomain(storeId, domain)`:
  - Kalder SES `CreateEmailIdentity(domain)`
  - Gemmer `ses_identity_arn`, DNS records snapshot i `email_configs`
  - Returnerer `{ dkim: CnameRecord[], spf: TxtRecord }` DNS records
- `checkDomainStatus(storeId)`:
  - Kalder SES `GetEmailIdentity(domain)` → `VerificationStatus`
  - Opdaterer `email_configs.ses_domain_status`
- Admin API:
  - `POST /admin/notification-config/domain` — body: `{ domain }` → returns DNS records
  - `GET /admin/notification-config/domain/status` → `{ status, records, fallback_from }`
- Cron/polling: `checkDomainStatus` kan kaldes fra admin (on-demand) + planlagt BullMQ job hvert 15. min for `pending` domains
- Env vars: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (dokumenteret i `infra/.env.example`)
- Tests: unit test med mock SES client

### Context for implementing agent

- HITL checkpoint INDEN test: AWS IAM credentials skal være i `.env`; SES sandbox exit kan tage 24h
- `fallback_from` sættes automatisk til `noreply@mail.mercflow.shop` i EmailConfig ved oprettelse
- Hvis `ses_domain_status != 'verified'`: `from_email` i leveringer bruger `fallback_from` automatisk (logik i worker, T058)

### Definition of done

- [x] HITL: AWS prerequisites on checklist completed (IAM + sandbox + mail.mercflow.shop)
- [x] `setupDomain` returnerer korrekte DNS records for test-domain
- [x] `checkDomainStatus` opdaterer status korrekt
- [x] Admin API returnerer korrekte records og status
- [x] Unit test med mock SES grøn
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T058 — BullMQ notification worker infrastructure (queue, retry, DLQ, template renderer)

**Sprint:** S024
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Unblocked by:** T056 (PR #97 merged `d7194a4`)
**Branch:** cursor/s024-t058-notification-worker-dc6a
**PR:** https://github.com/eskobar95/mercflow/pull/103
**Merged:** `development` @ `eea674c` (2026-06-11)
**PRD journey:** J003 (PRD-notification-system.md)
**ADRs:** ADR-009

### Slice objective

BullMQ notification worker kører i `apps/backend`, henter `send-email` jobs fra `mercflow:notifications` queue, resolver EmailConfig, renderer React Email template til HTML, og sender via SES (real client hvis T057 done, ellers stub). Retry + DLQ konfigureret.

### Layers in scope

- Code: `apps/backend/src/workers/notification-worker.ts`
- Queue: `mercflow:notifications`, job: `send-email`, concurrency: `NOTIFICATION_WORKER_CONCURRENCY` env (default 5)
- Retry: `{ attempts: 3, backoff: { type: 'exponential', delay: 30_000 } }` (30s → 5m → 30m)
- DLQ: `mercflow:notifications:dead` — failed jobs moved here after exhausting retries
- Template renderer: `renderTemplate(key: TemplateKey, props: TemplateProps): string` — renders React Email TSX to HTML via `@react-email/render`
- Processor logic:
  1. Resolve `EmailConfig` for `storeId`
  2. Determine `from_email` (verified domain or `fallback_from`)
  3. Render template: `renderTemplate(templateKey, { ...emailConfig, ...jobData })`
  4. Call `sesClient.sendEmail({ from, to, subject, html })`
  5. Update `EmailDelivery.status = 'sent'`, set `ses_message_id` + `sent_at`
  6. On error: update `EmailDelivery.status = 'failed'`, set `error_message`
  7. On DLQ: update `EmailDelivery.status = 'dead_letter'`
- Template registry: `Map<TemplateKey, React.FC<TemplateProps>>` — initially empty; T059 registers `order-confirmation`
- Worker registration in backend startup (`apps/backend/src/workers/index.ts` or equivalent)
- Dependencies: `@react-email/render`, `@react-email/components`, `@aws-sdk/client-ses`
- Tests: unit test — mock job processing, verify `EmailDelivery` status updates

### Context for implementing agent

- Worker bruger SES client fra `notification-module` — if T057 er done, real client; ellers stub
- `from_email` logik: `emailConfig.ses_domain_status === 'verified' ? emailConfig.from_email : emailConfig.fallback_from`
- BetterStack alert: konfigurér metrics/uptime check på DLQ størrelse (dokumentér i `infra/RUNBOOK.md`)

### Definition of done

- [x] Worker starter og behandler test-job uden fejl
- [x] Retry konfigureret og verificeret i unit test
- [x] DLQ modtager job efter 3 mislykkede forsøg
- [x] `EmailDelivery.status` opdateres korrekt (sent / failed / dead_letter)
- [x] `pnpm typecheck` + `pnpm lint` grøn
- [x] `infra/RUNBOOK.md` opdateret med DLQ monitoring note

---

## T059 — `order-confirmation` React Email template + `order.placed` event subscriber

**Sprint:** S025
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none (T058 merged PR #103 `eea674c`)
**Unblocked by:** T058 (PR #103 merged `eea674c`)
**Branch:** feature/S025/T059-order-confirmation-template
**PR:** https://github.com/eskobar95/mercflow/pull/108
**PRD journey:** J003 (PRD-notification-system.md)
**ADRs:** ADR-009

### Slice objective

En kunde modtager automatisk en ordrebekræftelse med butikslogo, ordreresumé og linjevarer inden for 30 sekunder efter ordren er placeret. Kritisk leveringsvej fuldt operationel.

### Layers in scope

- Templates: `packages/notification-module/src/templates/`
  - `layout.tsx` — header (logo, brand color), footer (store name, support email, unsubscribe note)
  - `line-item.tsx` — product name, variant, qty, price
  - `address-block.tsx` — shipping address
  - `order-confirmation.tsx` — order number, line items, shipping address, totals, CTA "View order"
- Shared components bruge `@react-email/components` (Html, Head, Body, Container, Section, Text, Button, Img, Hr)
- Template props: `{ logoUrl, brandColor, storeName, supportEmail, order: MedusaOrder }`
- Register in worker template registry: `templates.set('order-confirmation', OrderConfirmationTemplate)`
- Subscriber: `apps/backend/src/subscribers/order-placed.subscriber.ts`
  - Medusa event: `order.placed`
  - Resolver: `order.customer.email` + `store_id` → `notificationService.enqueueEmail({ storeId, templateKey: 'order-confirmation', to: customer.email, entityId: order.id, data: { order } })`
- Tests:
  - Snapshot test: rendered HTML contains order number, customer email
  - Integration test: `order.placed` event → `EmailDelivery` row created with `status: 'queued'`

### Context for implementing agent

- Hent Medusa order data via `OrderModule` service — inkludér line items, shipping address, customer
- `@react-email/render` producerer HTML string — verificer preview i browser med `pnpm email:preview` (tilføj script til notification-module)
- Brug eksisterende Medusa event subscriber pattern fra `apps/backend/src/subscribers/`

### Definition of done

- [ ] `order-confirmation.tsx` renderer korrekt HTML med alle props
- [ ] Snapshot test grøn
- [ ] `order.placed` subscriber enqueuer job med korrekt idempotency key
- [ ] Integration test: delivery row oprettet
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T060 — `shipping-update`, `order-cancellation`, `customer-welcome` templates + event subscribers

**Sprint:** S026
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none (T059 done PR #108)
**Unblocked by:** T059 (PR #108)
**Branch:** feature/S026/T060-remaining-notification-templates
**PR:** https://github.com/eskobar95/mercflow/pull/124
**PRD journey:** J005 (PRD-notification-system.md)
**ADRs:** ADR-009

### Slice objective

Alle v1 transaktionelle emails er aktive: shipping update med tracking link, ordreannullering, og velkomstmail ved ny kunde.

### Layers in scope

- Templates:
  - `shipping-update.tsx` — carrier, tracking number, tracking link, expected delivery
  - `order-cancellation.tsx` — order number, reason (if available), refund note
  - `customer-welcome.tsx` — welcome message, store CTA, support contact
- Subscribers:
  - `order-shipped.subscriber.ts` → `order.shipment_created` → `enqueueEmail('shipping-update', ...)`
  - `order-canceled.subscriber.ts` → `order.canceled` → `enqueueEmail('order-cancellation', ...)`
  - `customer-created.subscriber.ts` → `customer.created` → `enqueueEmail('customer-welcome', ...)`
- Register all 3 in worker template registry
- Tests: snapshot test per template

### Definition of done

- [x] Alle 3 templates renderer korrekt HTML
- [x] Alle 3 subscribers enqueuer jobs korrekt
- [x] Snapshot tests grønne
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T061 — Admin UI: Settings → Email → Domain tab

**Sprint:** S025
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** none (T057 merged PR #104 `33a98d2`)
**Unblocked by:** T057 (PR #104 merged `33a98d2`)
**Branch:** feature/S025/T061-email-domain-settings-ui
**PR:** https://github.com/eskobar95/mercflow/pull/109
**PRD journey:** J001 (PRD-notification-system.md)

### Slice objective

Merchant kan konfigurere og verificere deres sending domain i admin. DNS records vises med copy-to-clipboard. Verifikationsstatus opdateres automatisk.

### Layers in scope

- UI: `packages/admin-ui` — `/settings/email` side, Domain tab
- Domain input (disabled efter setup) + "Setup domain" knap
- DNS records tabel: Type (CNAME/TXT), Name, Value — copy-to-clipboard per row
- Verifikationsstatus badge: Pending (gul) / Verified (grøn) / Failed (rød)
- Auto-refresh: `useInterval(checkStatus, 30_000)` mens status = pending
- Fallback info: "Emails send from noreply@mail.mercflow.shop until verified"
- Settings sidebar: "Email" under Communications sektion

### Definition of done

- [ ] Domain setup flow fungerer end-to-end
- [ ] DNS records vises korrekt med copy-to-clipboard
- [ ] Status badge opdateres automatisk (polling)
- [ ] Fallback besked synlig ved pending/failed
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T062 — Admin UI: Settings → Email → Branding tab + preview modal

**Sprint:** S026
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Unblocked by:** T056 (PR #97 merged `d7194a4`)
**Branch:** feature/S026/T062-email-branding-ui
**PR:** https://github.com/eskobar95/mercflow/pull/106
**PRD journey:** J002 (PRD-notification-system.md)

### Slice objective

Merchant kan tilpasse emailbranding (logo, farve, butiksnavns, reply-to, support email) og se et live preview af ordrebekræftelse med deres variabler inden de gemmer.

### Layers in scope

- UI: `packages/admin-ui` — `/settings/email` side, Branding tab
- Form: Logo URL (HTTPS input), Store display name, Brand color (hex color picker), Reply-to email, Support email
- "Preview" knap → kalder `GET /admin/notification-config/preview/order-confirmation` → åbner HTML i scrollable modal
- Auto-preview: debounced preview refresh on field change (500ms)
- Save → `PUT /admin/notification-config/branding`

### Definition of done

- [ ] Alle 5 felter gemmes korrekt
- [ ] Preview modal viser korrekt rendered HTML med brugerens variabler
- [ ] Logo URL valideres (HTTPS)
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T063 — Admin UI: Settings → Email → Delivery history tab

**Sprint:** S026
**Milestone:** M012
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Unblocked by:** T056 (PR #97 merged `d7194a4`)
**Branch:** feature/S026/T063-email-delivery-history-ui
**PR:** https://github.com/eskobar95/mercflow/pull/105
**PRD journey:** J004 (PRD-notification-system.md)

### Slice objective

Merchant kan se leveringshistorik for alle transaktionelle emails og kan gensende fejlede emails med ét klik.

### Layers in scope

- UI: `packages/admin-ui` — `/settings/email` side, Delivery history tab
- Pagineret tabel: recipient, template type (badge), entity link (order number → order detail), status badge (Sent/Failed/Queued/Dead Letter), sent_at relative timestamp
- Row expand: error_message ved Failed/Dead Letter
- "Resend" knap på Failed og Dead Letter rows → `POST /admin/email-deliveries/:id/resend` → optimistic UI update
- Empty state: "No emails sent yet"
- Pagination: 50 per side; Previous/Next

### Definition of done

- [ ] Delivery history vises med korrekte statuser
- [ ] Resend opretter ny delivery row (optimistisk UI + re-fetch)
- [ ] Fejlbesked synlig på mislykkede leveringer
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

---

## M013 — Admin Shell & Navigation

---

## T064 — Clerk auth integration (Store Admin) + AppShell + sidebar navigation

**Sprint:** S027
**Milestone:** M013
**Status:** done
**Mode:** HITL
**Parallel group:** solo
**Blocked by:** T063
**Branch:** feature/S027/T064-clerk-auth-appshell-sidebar
**PR:** https://github.com/eskobar95/mercflow/pull/96
**Merge:** `3fe6dc0`
**PRD journey:** J001, J003 (PRD-admin-shell-navigation.md)
**ADRs:** ADR-011

### Slice objective

Medusa's admin JWT-middleware er erstattet med Clerk JWT-validering. Merchants logger ind via Clerk (email + Google). Clerk `org_id` mappes til `store_id` og bruges af `TenantIsolationSubscriber`. AppShell leverer den nye sidebar med NavGroup/NavItem-hierarki, collapse til icon-rail, og mobil drawer.

### HITL reason

Kræver at operatøren opretter Clerk-konto + to apps (`mercflow-store-admin`, `mercflow-platform`), konfigurerer Google social provider, opretter JWT-template med `store_id`-claim, og uploader `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` til `.env` / infra-secrets. Clerk-konto er gratis og tager ~5 minutter — ingen Google Cloud projekt kræves.

### Layers in scope

- **Fork:** `packages/medusa-fork/medusa/` — erstat Medusa admin JWT-middleware med Clerk JWT-validering via `@clerk/backend`. JWT-claim `org_id` → `TenantContext.run(orgId, next)`.
- **Backend:** `apps/backend/` — `CLERK_SECRET_KEY` i env; `@clerk/backend` som dependency.
- **UI:** `packages/admin-ui/` — `@clerk/react` provider wraps hele appen. `<SignIn>` component erstatter Medusa login-side. `useOrganization()` hook til aktiv store.
- **UI:** AppShell component med struktureret sidebar:
  - `NavGroup` (label + icon + children) og `NavItem` (icon, label, active state)
  - Grupper: Home, Orders, Products (Products/Categories/Inventory), Customers, Content, Settings
  - Collapse til 48px icon-rail (persisted i localStorage); tooltip on hover
  - Mobil drawer ved < 768px (hamburger icon, overlay)
- **Design tokens:** ingen nye — brug eksisterende surface + border tokens

### Context / assumptions

- Guapo Medusa admin user migreres manuelt til Clerk org (HITL step — agent kan skrive migrations-script men operatøren kører det).
- Clerk JWT-template sættes op i Clerk dashboard (ikke i kode) — agent dokumenterer de nøjagtige felter i task-notes.
- Mobil drawer bruger Radix Dialog eller Sheet primitive.
- Ingen role-based navigation hiding i v1 (deferred).
- Home viser placeholder: "Welcome to MercFlow" + 3 quick-action cards.

### Definition of done

- [ ] `POST /admin/` routes kræver Clerk JWT (Medusa JWT afvist med 401)
- [ ] Merchant logger ind via Clerk `<SignIn>` → redirectes til admin
- [ ] `org_id` fra JWT bruges korrekt som `store_id` i `TenantContext`
- [ ] Sidebar viser alle 6 grupper med korrekte ruter
- [ ] Collapse/expand persisted i localStorage — virker efter page reload
- [ ] Mobil drawer åbner og lukker korrekt
- [ ] Home placeholder vises ved `/`
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T065 — Settings landing page + sub-navigation + route reorganisation

**Sprint:** S028
**Milestone:** M013
**Status:** done — superseded by T076 (M016)
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T064
**Branch:** feature/S028/T065-settings-landing-sub-nav
**PR:** #98
**PRD journey:** J001, J004 (PRD-admin-shell-navigation.md)
**ADRs:** ADR-011

### Slice objective

Alle settings-sider er samlet under `/settings` med en landing page der viser sub-sektioner som klik-kort. Settings-navigationen i sidebar viser nested items (Shipping → Packaging / Carriers).

### Layers in scope

- **UI:** `packages/admin-ui/` — `/settings` landing page: grid af kort (icon, titel, beskrivelse, link) for alle sub-sektioner: General, Email, Shipping (→ Packaging, Carriers), Payments, Custom Data, SEO, Integrations, Store details
- Settings sidebar sub-nav: NavGroup "Settings" med nested NavItems; Shipping-gruppen viser Packaging og Carriers som indrykkede children
- Route reorganisation: eksisterende settings-sider flyttes til korrekte paths:
  - `/settings/email` (M012 domain/branding/delivery)
  - `/settings/shipping/packaging` (M010)
  - `/settings/custom-data` (M008)
  - `/settings/seo` (M001/M002)
  - Gamle paths → redirect eller opdaterede NavItem links
- No new pages created — existing pages moved/rewired only

### Definition of done

- [ ] `/settings` landing page viser ≥ 7 sub-sektion-kort med korrekte links
- [ ] Settings sub-nav i sidebar viser Shipping med nested Packaging + Carriers
- [ ] Alle eksisterende settings-sider tilgængelige via nye URL paths
- [ ] Ingen 404 på kendte settings-routes
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T066 — Breadcrumb component + detail page wiring

**Sprint:** S028
**Milestone:** M013
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T064
**PR:** #99
**Branch:** feature/S028/T066-breadcrumb-detail-pages
**PRD journey:** J002 (PRD-admin-shell-navigation.md)

### Slice objective

Alle detail-sider og second-level sider har breadcrumbs der viser hierarki og linker tilbage til list med URL-state preserveret.

### Layers in scope

- **UI:** `packages/admin-ui/` — `<Breadcrumb>` base component: `items: { label: string; href?: string }[]`; renders som horizontal chain med separator; sidste item er ikke klikbar
- Wire breadcrumbs ind på:
  - Order detail: `Orders / #1234`
  - Product detail: `Products / {product title}`
  - Category detail: `Categories / {category name}`
  - Settings sub-pages: `Settings / Email`, `Settings / Shipping / Packaging`
- List-links i breadcrumbs bevarer URL params (filters, pagination) via `useSearchParams`

### Definition of done

- [ ] Breadcrumb vises på Order detail, Product detail, Category detail, alle settings sub-pages
- [ ] Breadcrumb "Orders" link bevarer aktive filters via URL state
- [ ] Keyboard navigerbar (links er korrekte `<a>` tags)
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## M014 — Platform Console

---

## T067 — Platform Console app scaffold + Clerk auth + `/platform/` backend skeleton

**Sprint:** S029
**Milestone:** M014
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T066
**Branch:** feature/S029/T067-platform-console-scaffold
**PR:** https://github.com/eskobar95/mercflow/pull/107
**PRD journey:** — (PRD-platform-console.md)
**ADRs:** ADR-011
**HITL approved:** 2026-06-11 — Traefik allowlist documented in T067 PR; mercflow-platform Clerk app + session `email` claim; Hetzner deploy post-merge per README checklist

### Slice objective

`apps/platform-console/` eksisterer som en kørende React+Vite app. Operators logger ind via Clerk (`mercflow-platform` app). `/platform/` API routes er scaffoldet med BYPASSRLS DB-forbindelse og Clerk JWT-validering. IP allowlist dokumenteret i Traefik-config.

### HITL reason

Kræver at operatøren tilføjer `mercflow-platform` Clerk app (gratis, ~2 min), konfigurerer `@mercflow.shop` email-domain check i kode, og angiver `PLATFORM_CLERK_PUBLISHABLE_KEY` + `PLATFORM_CLERK_SECRET_KEY`. Kræver desuden Traefik IP allowlist konfiguration på Hetzner.

### Layers in scope

- **New app:** `apps/platform-console/` — Vite + React + TypeScript + `@clerk/react`. Port 5174 i development.
- **Auth:** `<ClerkProvider>` med `mercflow-platform` publishable key. `<SignIn>` komponent. Middleware: check at `user.primaryEmailAddress` ender på `@mercflow.shop` (app-level, ingen Clerk paid feature kræves).
- **Layout:** Simpel shell — left sidebar (Tenants, Queues, Email, System, Audit), topbar med Clerk `<UserButton>`.
- **Backend:** `apps/backend/` — ny route-fil `/platform/index.ts` mountet på `/platform/`. Separat `platformDb` connection der kører som `mercflow_owner` (BYPASSRLS). Clerk JWT-validering via `@clerk/backend` med `PLATFORM_CLERK_SECRET_KEY`.
- **Infra:** `infra/traefik/` — IP allowlist middleware dokumenteret (ikke enforced i development — kun production).
- **Design tokens:** `@mercflow/design-tokens` inkluderes — konsistent visuel stil uden at importere admin-ui components.

### Definition of done

- [x] `apps/platform-console/` starter med `pnpm dev --filter @mercflow/platform-console`
- [x] Login via Clerk virker; ikke-@mercflow.shop emails afvises med 403 (prod; local gmail override documented)
- [x] `/platform/` routes returnerer 401 uden Clerk JWT; 200 med gyldigt JWT
- [x] `platformDb` forbindelsen kører som `mercflow_owner` (BYPASSRLS verificeret via test-query — local: `mercflow` superuser)
- [x] Sidebar placeholder-sektioner renderes (Tenants, Queues, Email, System, Audit)
- [x] `pnpm typecheck` + `pnpm lint` grøn

### Deferred — human HITL, not now (2026-06-11)

Scaffold er merged og kører lokalt. **Vent med Hetzner production deploy** indtil vi aktivt går live med console:

| Item | Status | When |
|------|--------|------|
| Traefik operator **/32 IPs** i `platform-console.yml` | Config scaffold committed; **IPs not set** | Human HITL før `console.mercflow.shop` go-live |
| **`platform-console` Docker Compose service** + static build deploy | **Not in compose yet** | Same HITL slice — efter console features (S030+) eller eksplicit deploy-beslutning |
| DNS `console.mercflow.shop` → Hetzner | Not done | Same go-live gate |

Continue S030 feature work (T068/T069) against local dev; production infra steps stay in README checklist + RUNBOOK until deliberate go-live.

---

## T068 — Tenant management: list + provision + suspend + audit log

**Sprint:** S030
**Milestone:** M014
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T067
**Branch:** feature/S030/T068-platform-tenant-management
**PR:** https://github.com/eskobar95/mercflow/pull/113
**PRD journey:** J001, J005 (PRD-platform-console.md)

### Slice objective

Operatorer kan se alle tenants, provisionere en ny tenant via UI (med progress log), og suspendere en eksisterende tenant. Alle handlinger logges i `platform_audit_log`.

### Layers in scope

- **DB:** `platform_audit_log` tabel (uden `store_id`, uden RLS — platform-level): `id`, `operator_email`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `created_at`. DML i `apps/backend/` (ikke i et separat modul).
- **Backend:** `/platform/tenants` routes: `GET` (list alle stores), `POST /provision` (kalder eksisterende provision-script internt), `PUT /:id/suspend` (sætter `is_disabled` + revokerer Publishable API keys), audit log entry ved alle writes.
- **UI:** `apps/platform-console/` — Tenants side: tabel (store name, domain, status badge, created_at, actions dropdown). Provision form: shop name, domain, admin email, currency, timezone → progress log (Server-Sent Events eller polling). Suspend confirmation modal med reason-felt.

### Definition of done

- [x] Tenant liste viser alle stores fra DB
- [x] Provision form opretter ny tenant end-to-end (calls provision script)
- [x] Suspend revokerer API keys og markerer store `is_disabled`
- [x] Audit log entry oprettes ved provision + suspend
- [x] `platform_audit_log` har ingen `store_id` kolonne (det er by design)
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T069 — BullMQ queue monitor: live stats + DLQ drill-down + manual retry

**Sprint:** S030
**Milestone:** M014
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T067
**Branch:** feature/S030/T069-platform-queue-monitor
**PR:** https://github.com/eskobar95/mercflow/pull/112
**PRD journey:** J002 (PRD-platform-console.md)

### Slice objective

Operatorer kan se alle BullMQ køer med live job-counts, DLQ-størrelse markeret i rød, og kan drill-down på fejlede jobs med fuld error-detalje og manuel retry.

### Layers in scope

- **Backend:** `/platform/queues` routes: `GET` (alle køer med stats: active, waiting, completed_24h, failed, dlq_size via BullMQ `Queue` API), `GET /:name/jobs?status=failed` (job liste), `POST /:name/jobs/:id/retry` (re-enqueue job). Data polles fra BullMQ Redis-instansen (samme Redis som workers).
- **UI:** `apps/platform-console/` — Queues side: kort per kø (navn, stats, DLQ badge rød hvis > 0). Klik → job-liste tabel (job ID, data preview, error message, attempts, created_at). Klik på job → full detail overlay med stack trace. Retry-knap med optimistisk UI.
- **Polling:** client-side refresh hvert 10s via React Query eller SWR.

### Definition of done

- [x] Alle aktive BullMQ køer vises med korrekte counts
- [x] DLQ > 0 vises tydeligt (rød badge)
- [x] Fejlet job viser full error message + stack trace
- [x] Retry enqueuer job igen (verificeres manuelt)
- [x] Data refreshes hvert 10s
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T070 — Email health + system metrics + audit log UI

**Sprint:** S031
**Milestone:** M014
**Status:** done
**Mode:** AFK
**Parallel group:** B
**Blocked by:** T067
**Branch:** feature/S031/T070-platform-email-system-audit
**PR:** https://github.com/eskobar95/mercflow/pull/111
**PRD journey:** J003, J004 (PRD-platform-console.md)

### Slice objective

Operatorer kan søge i email-leveringshistorik på tværs af alle tenants, se system-sundhed (Hetzner CPU, Neon connections, Redis memory), og se audit log over operatør-handlinger.

### Layers in scope

- **Backend:** `/platform/email/deliveries` (cross-tenant søgning — `platformDb` BYPASSRLS), `/platform/email/domains` (SES status per tenant via notification-module `EmailConfig`), `/platform/system/metrics` (Hetzner Cloud API + Neon API + Redis `INFO` kommando), `/platform/audit` (læs `platform_audit_log`).
- **UI:** `apps/platform-console/` — 
  - Email side: søgefelt (email/order ID), tabel med tenant, recipient, template type, status, sent_at; row expand: SES error code + beskrivelse.
  - System side: 6 metric-kort (Hetzner CPU %, RAM %, Neon connections, Redis used/max, uptime), refresh hvert 30s.
  - Audit side: tabel (operator, action, entity, timestamp) med dato-filter.

### Context / assumptions

- Hetzner Cloud API: `GET /v1/servers/:id/metrics` — kræver `HETZNER_API_TOKEN` i env.
- Neon API: `GET /v2/projects/:id/branches/:id/endpoints` → connection count. Kræver `NEON_API_KEY`.
- Redis: `INFO memory` kommando via ioredis.

### Definition of done

- [ ] Cross-tenant email søgning returnerer korrekte rows (inkl. rows fra andre tenants)
- [ ] System metrics refreshes hvert 30s med data fra Hetzner + Neon + Redis
- [ ] Audit log viser actions fra T068 provision/suspend tests
- [ ] Ingen `store_id` filter på platform routes (by design — cross-tenant)
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## M015 — Subscription System

---

## T071 — `subscription-module` foundation: models, migrations, RLS, service, admin API

**Sprint:** S032
**Milestone:** M015
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T070
**Branch:** feature/S032/T071-subscription-module-foundation
**PR:** https://github.com/eskobar95/mercflow/pull/115
**PRD journey:** J001 (PRD-subscription-system.md)

### Slice objective

`subscription-module` eksisterer med DML-modeller, migrationer, RLS, og et fuldt service-lag. Admin API routes lader merchant liste, hente, pause, cancel og resume subscriptions.

### Layers in scope

- **Module:** `packages/subscription-module/` — DML modeller:
  - `subscription`: id, store_id, customer_id, product_id, variant_id, interval (enum), status (enum), stripe_subscription_id (nullable), current_period_start, current_period_end, next_renewal_at, cancelled_at, pause_requested_at
  - `subscription_renewal_log`: id, subscription_id, order_id, amount, currency, status (enum), stripe_payment_intent_id (nullable), error_message, created_at
  - `subscription_config`: id, store_id, club_enabled, club_stripe_product_id, club_price_monthly, club_price_annual, club_fallback_discount_pct, club_name
- **Migrations:** Medusa DML tooling. Decision log comment. `down()` implementeret.
- **RLS:** `store_id NOT NULL` + RLS policy på `subscription` og `subscription_config`. `subscription_renewal_log` scopes via subscription_id join (ikke direkte store_id).
- **Service:** `MedusaService` extension. Metoder: `createSubscription`, `listSubscriptions`, `getSubscription`, `pauseSubscription`, `cancelSubscription`, `resumeSubscription`, `updateRenewalTimestamp`.
- **Backend:** `/admin/subscriptions` routes: `GET` (list med filters: status, customer_id), `GET /:id` (detail + renewal log), `POST /:id/pause`, `POST /:id/cancel`, `POST /:id/resume`. Zod-validering på alle writes.
- **Module registration:** subscription-module registreres i `apps/backend/medusa-config.ts`.

### Definition of done

- [ ] `pnpm migration:run` — nul fejl lokalt
- [ ] RLS policy verificeret: anden tenant kan ikke se subscriptions
- [ ] Alle 6 service-metoder har unit tests
- [ ] Admin API routes returnerer korrekte svar (smoke test via curl)
- [ ] `packages/subscription-module/README.md` oprettet med field definitions + API reference
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T072 — BullMQ renewal worker: cron + charge + failure handler + idempotency

**Sprint:** S033
**Milestone:** M015
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T071
**Branch:** feature/S033/T072-subscription-renewal-worker
**PR:** https://github.com/eskobar95/mercflow/pull/117
**PRD journey:** J002 (PRD-subscription-system.md)
**ADRs:** ADR-010

### Slice objective

BullMQ `subscription-renewal` kø i `apps/worker/` kører cron hvert time og processer forfaldne subscriptions: opretter Medusa draft order, opkræver via Stripe PaymentIntent, logger resultat, og sender notification-events ved succes og fejl.

### Layers in scope

- **Worker:** `apps/worker/` — ny kø `subscription-renewal`:
  - `process-due-renewals` (cron job, hvert time): query `subscription WHERE next_renewal_at <= now() AND status = 'active'`; enqueue `charge-subscription` job per subscription
  - `charge-subscription`: opret Medusa draft order for variant → opret Stripe PaymentIntent (idempotency key: `${subscription_id}_${next_renewal_at.toISOString()}`); ved succes: confirm order, advance `next_renewal_at`, log renewal_log (success); emit `subscription.renewed` event
  - `handle-renewal-failure`: ved PaymentIntent failure: subscription status → `past_due`, log renewal_log (failed); emit `subscription.renewal_failed` event → notification-module trigger
- **Notification events:** `subscription.renewed` og `subscription.renewal_failed` emittet via BullMQ event bus (ADR-010) — notification-module lytter (T060-scope).
- **Idempotency:** duplicate `charge-subscription` job med samme idempotency key → Stripe returnerer existing PaymentIntent (ingen double-charge).

### Definition of done

- [ ] Cron job finder forfaldne subscriptions korrekt
- [ ] Double-charge test: to jobs med samme idempotency key → kun ét Stripe opkald
- [ ] Renewal log entry oprettes ved succes og fejl
- [ ] `subscription.renewal_failed` event emittet og synligt i BullMQ queues
- [ ] `pnpm test apps/worker/` grøn (unit tests på job-handlers med Stripe mocked)
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T073 — Subscription admin UI: list + detail + pause/cancel/resume

**Sprint:** S033
**Milestone:** M015
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T071
**Branch:** feature/S033/T073-subscription-admin-ui
**PR:** https://github.com/eskobar95/mercflow/pull/116
**PRD journey:** J003 (PRD-subscription-system.md)

### Slice objective

Merchants kan se og administrere alle subscriptions fra Store Admin — søge efter kunde, se renewal-log, og pause/cancel/resume med ét klik.

### Layers in scope

- **UI:** `packages/admin-ui/` — Subscriptions side (under Customers i M013 sidebar):
  - Liste: tabel (customer email, product/variant, interval badge, status badge, next renewal date, actions dropdown)
  - Søgning: customer email input
  - Status filter: Active / Paused / Cancelled / Past Due
  - Detail side: subscription info header + renewal log tabel (date, amount, status, order link)
  - Actions: Pause (confirm modal med optional resume-date picker), Cancel (confirm modal), Resume (direkte)
  - Optimistisk UI på status-skift
- **Navigation:** Subscriptions NavItem tilføjes under Customers i AppShell (T064) ved `import` af route

### Definition of done

- [ ] Subscription liste viser korrekte data for test-subscriptions
- [ ] Pause → status skifter til Paused; Resume → Active
- [ ] Cancel → status Cancelled (irreversibel — confirm modal)
- [ ] Renewal log viser historik per subscription
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T074 — Customer Club: Stripe webhook + `club_members` group activation + Settings config UI

**Sprint:** S034
**Milestone:** M015
**Status:** done
**Mode:** AFK
**HITL approved:** 2026-06-11 — Stripe test credentials supplied for local dev; production uses connector-module encrypted credentials (Settings → Connectors → Stripe), not merchant secrets in env.
**Parallel group:** A
**Blocked by:** T071
**Branch:** feature/S034/T074-customer-club-stripe-setup
**PR:** https://github.com/eskobar95/mercflow/pull/119
**PRD journey:** J004, J005 (PRD-subscription-system.md)

### HITL reason

Kræver Stripe webhook endpoint med HMAC-signaturverificering og Club membership Stripe Product oprettet via API ved save. **Produktion:** `secret_key` + `webhook_secret` fra per-store `connector_config` (connector-module). **Lokal dev:** env-fallback (`STRIPE_API_KEY` / `STRIPE_SECRET_KEY`) eller Admin → Connectors → Stripe; webhook test via `stripe listen --forward-to`.

### Slice objective

Merchants kan konfigurere en Customer Club (navn, månedspris, fallback % rabat). Stripe-webhook aktiverer/deaktiverer `club_members` customer_group for kunden ved membership-oprettelse og -annullering.

### Layers in scope

- **Backend:** `/store/club-membership/webhook` — Stripe webhook handler. HMAC verification (`stripe.webhooks.constructEvent`). Events: `customer.subscription.created` (→ add to club_members group), `customer.subscription.deleted` (→ remove from group). Idempotency: check om customer allerede i group før add.
- **Backend:** `/admin/subscription-config` — `GET` og `PUT` routes for `subscription_config` (club_enabled, club_name, club_price_monthly, club_price_annual, club_fallback_discount_pct). Kaller Stripe API for at oprette/opdatere Stripe Product+Price ved save.
- **UI:** `packages/admin-ui/` — Settings → Subscriptions side: toggle "Enable Customer Club", form (club name, monthly price, annual price, fallback discount %). Save opretter/opdaterer Stripe Product. Readonly preview: "Customers see X DKK/month or Y DKK/year".

### Definition of done

- [x] Stripe webhook HMAC verification virker (test med `stripe listen --forward-to`)
- [x] `customer.subscription.created` → customer tilføjet til `club_members` group inden 30s
- [x] `customer.subscription.deleted` → customer fjernet fra group
- [x] Settings form gemmer `subscription_config` korrekt
- [x] Stripe Product oprettes via API (ikke hardkodet product ID)
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T075 — Per-produkt Club-pris: Product → Pricing tab + Medusa price_list upsert

**Sprint:** S034
**Milestone:** M015
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T071
**Branch:** feature/S034/T075-product-club-price-ui
**PR:** https://github.com/eskobar95/mercflow/pull/118
**PRD journey:** J006 (PRD-subscription-system.md)

### Slice objective

Merchants kan sætte en eksplicit Club-pris på et produkt direkte fra Product-formularen → Pricing-tab. Club-prisen gemmes som Medusa price_list entry knyttet til `club_members` customer_group og returneres korrekt via Medusa's pricing API.

### Layers in scope

- **UI:** `packages/admin-ui/` — Product detail → Pricing tab: ny sektion "Club member price" (kun synlig når `subscription_config.club_enabled = true`). Felt per variant: "Member price (DKK)". Placeholder: "No member price — fallback discount applies".
- **Backend:** `PUT /admin/products/:id/club-pricing` — Zod-valideret body `{ variant_id, amount, currency_code }`. Upsert Medusa price_list entry for `club_members` customer_group. `DELETE /admin/products/:id/club-pricing/:variant_id` — fjern explicit member price (fallback % aktiveres igen).

### Definition of done

- [ ] Club member price felt vises kun når club er aktiveret
- [ ] Gem → Medusa price_list entry oprettet/opdateret korrekt
- [ ] Medusa's `GET /store/products/:id` returnerer korrekt pris ved `customer_group_id=club_members` i context
- [ ] Slet member price → fallback % aktiveres (verificeret via store pricing API)
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## M016 — Settings Architecture

---

## T076 — SettingsShell layout + `settingsNav.ts` config + `/settings` redirect

**Sprint:** S035
**Milestone:** M016
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/120
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T064 (AppShell + router foundation)
**Branch:** feature/S035/T076-settings-shell
**PRD journey:** J001, J002 (PRD-settings-architecture.md)
**ADRs:** ADR-012

### Slice objective

Alle `/settings/*` routes er pakket ind i en `SettingsShell` layout der viser en persistent sekundær sidebar med 8 grupperinger. `/settings` redirecter automatisk til `/settings/general`. Ingen card-landing page eksisterer mere.

### Layers in scope

- **UI:** `packages/admin-ui/`
  - `src/config/settingsNav.ts` — ny SSOT: `SETTINGS_NAV_GROUPS` typed config (group label + icon + items array) for alle 8 grupper (Store, Sales, Shipping, Customers, Communication, Team, Apps, Developers)
  - `src/components/layout/SettingsShell.tsx` — layout-komponent: to-kolonne layout (sekundær sidebar venstre + `<Outlet />` højre); sidebar renderer `SETTINGS_NAV_GROUPS`; aktiv gruppe auto-expanded; aktiv item highlighted via `useMatch`
  - `src/router.tsx` — `/settings` nested layout route bruger `SettingsShell`; index route redirecter til `/settings/general` via `<Navigate to="/settings/general" replace />`
  - `src/config/settingsSections.ts` — `SETTINGS_LANDING_SECTIONS` og `SETTINGS_PATHS` depreceres / erstattes af `settingsNav.ts`
  - `src/pages/SettingsPage.tsx` (card grid) — fjernes; erstattes af redirect

### Definition of done

- [ ] `/settings` redirecter til `/settings/general` — ingen card landing page
- [ ] `SettingsShell` vises på alle `/settings/*` routes med persistent sidebar
- [ ] Alle 8 grupper synlige i sidebar: Store, Sales, Shipping, Customers, Communication, Team, Apps, Developers
- [ ] Aktiv sub-item highlighted; aktiv gruppe auto-expanded
- [ ] `SETTINGS_LANDING_SECTIONS` fjernet — ingen imports tilbage i kodebasen
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T077 — Settings route remapping + placeholder pages for alle nye sektioner

**Sprint:** S036
**Milestone:** M016
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/122
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T076
**Branch:** feature/S036/T077-settings-route-remapping
**PRD journey:** J001, J004 (PRD-settings-architecture.md)
**ADRs:** ADR-012

### Slice objective

Alle eksisterende settings-sider er korrekt placeret i de nye grupper i `SettingsShell`. 6 nye sektioner uden feature-sider får clean placeholder-screens. Ingen 404s på hverken gamle eller nye paths.

### Layers in scope

- **UI:** `packages/admin-ui/`
  - `src/pages/settings/SettingsPlaceholderPage.tsx` — genbrugelig placeholder: `title` + `description` props; "Coming soon" callout; korrekt breadcrumb/sidebar active state
  - Nye placeholder-routes i `router.tsx`:
    - `/settings/policies` → `SettingsPlaceholderPage` ("Policies")
    - `/settings/taxes` → `SettingsPlaceholderPage` ("Taxes")
    - `/settings/checkout` → `SettingsPlaceholderPage` ("Checkout")
    - `/settings/customer-accounts` → `SettingsPlaceholderPage` ("Customer accounts")
    - `/settings/returns` → `SettingsPlaceholderPage` ("Returns")
    - `/settings/notifications` → `SettingsPlaceholderPage` ("Notifications")
  - `/settings/team` → eksisterende `TeamSettingsPage` (route tilføjes hvis mangler)
  - Redirects i `router.tsx` for gamle paths der ændrer sig:
    - `/settings/connectors` → `/settings/apps`
    - `/settings/store-details` → `/settings/general`
  - `SETTINGS_NAV_GROUPS` i `settingsNav.ts` opdateres med korrekte ikoner + paths for alle items (verificeres mod eksisterende ikonbibliotek i `components/ui/icons`)

### Definition of done

- [ ] Alle 6 nye placeholder-routes returnerer clean placeholder page (ingen 404)
- [ ] `/settings/team` viser `TeamSettingsPage`
- [ ] `/settings/connectors` → `/settings/apps` redirect virker
- [ ] `/settings/store-details` → `/settings/general` redirect virker
- [ ] `SettingsPlaceholderPage` har korrekt title, description og "Coming soon" markering
- [ ] Alle sidebar-items i alle 8 grupper har korrekte paths + ikoner
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T078 — `/settings/apps` overview page med connector status

**Sprint:** S036
**Milestone:** M016
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/123
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T076
**Branch:** feature/S036/T078-settings-apps-overview
**PRD journey:** J003 (PRD-settings-architecture.md)
**ADRs:** ADR-012

### Slice objective

Merchant kan åbne Settings → Apps → Overview og se alle 4 connectors (Stripe, Shipmondo, Plunk, GTM) med status-badge (Connected / Error / Not configured) og et link til den kontekstuelle konfigurations-side.

### Layers in scope

- **Backend** (connector-module, kun hvis nødvendigt):
  - Tjek `GET /admin/connectors` i connector-module — returnerer det en liste med connector-objekter?
  - Hvis ja og der ikke er et `status` felt: tilføj `status: "connected" | "error" | "not_configured"` til response-shape (service-layer logik: credentials present + last_verified_at inden for 24h = connected; credentials present + error = error; ingen credentials = not_configured)
  - Hvis endpoint ikke eksisterer: tilføj simpelt `GET /admin/connectors` route der returnerer `{ connectors: ConnectorStatus[] }`
- **UI:** `packages/admin-ui/`
  - `src/pages/settings/AppsOverviewSettingsPage.tsx` — liste af connector-kort: navn, ikon, status-badge, beskrivelse, "Configure" link → kontekstuel settings-side
  - Status-badge: grøn (Connected), rød (Error), grå (Not configured)
  - "Configure" links: Stripe → `/settings/payments`; Shipmondo → `/settings/shipping/carriers`; Plunk → `/settings/notifications`; GTM → eksisterende GTM-page
  - Route i `router.tsx`: `/settings/apps` → `AppsOverviewSettingsPage`
  - Erstatter `ConnectorsPage.tsx` som primær connector-oversigt

### Definition of done

- [ ] `/settings/apps` viser alle 4 connectors med korrekt navn + ikon
- [ ] Status-badge afspejler faktisk connector-tilstand (Connected / Error / Not configured)
- [ ] "Configure" link for hver connector navigerer til korrekt kontekstuel side
- [ ] `GET /admin/connectors` returnerer status-felt (tilføjet eller bekræftet eksisterende)
- [ ] Ingen cross-tenant connector data (eksisterende connector-module RLS dækker)
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

---

## M017 — Payment Module

---

## T079 — `payment-module` foundation: `IPaymentProvider` + `StripePaymentProvider` + model + service + migrations

**Sprint:** S037
**Milestone:** M017
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T078
**Branch:** feature/S037/T079-payment-module-foundation
**PR:** https://github.com/eskobar95/mercflow/pull/125
**PRD journey:** J003 (PRD-payment-module.md)
**ADRs:** ADR-013

### Slice objective

`packages/payment-module` eksisterer med `IPaymentProvider` interface, `StripePaymentProvider` implementation, `payment_provider_config` DML model (test/live keys + mode per tenant), `PaymentModuleService` med `getActiveProvider()` og `upsertProviderConfig()`, migrations med RLS, og komplet README.

### Layers in scope

- **DB:** `payment_provider_config` tabel — `store_id` (RLS), `provider` enum, `test_*` + `live_*` nøgler (encrypted), `mode` enum
- **Module:** `packages/payment-module/` — ny Medusa DML module
  - `IPaymentProvider` interface med alle metoder (checkout, capture, refund, subscription ops, webhook)
  - `StripePaymentProvider` implementation — bruger Stripe SDK; resolver mode-korrekte credentials fra DB
  - `PaymentModuleService extends MedusaService` — `getActiveProvider(storeId)`, `upsertProviderConfig()`, `setMode()`, `getPublishableKey()`
  - AES-256-GCM encryption for secret keys (`MERCFLOW_ENCRYPTION_KEY` env var)
- **Backend:** Registrer `payment-module` i `apps/backend/src/medusa-config.ts`
- **Package:** `packages/payment-module/README.md` — field definitions, API, encryption notes, webhook setup

### Definition of done

- [x] `payment_provider_config` migration kører rent; `down()` implementeret
- [x] `IPaymentProvider` interface kompilerer i strict TypeScript
- [x] `StripePaymentProvider` implementerer alle interface-metoder (kan kaste `NotImplemented` for v2-metoder)
- [x] Secret keys encrypted på `INSERT`, decrypted på `getActiveProvider()` — aldrig returneret til API callers
- [x] `MERCFLOW_ENCRYPTION_KEY` kræves ved startup (validation i module init)
- [x] `PaymentModuleService` registreret + resolverbar fra Medusa container
- [x] RLS policy på `payment_provider_config` — ingen cross-tenant rows
- [x] `pnpm typecheck` + `pnpm test` grøn
- [x] `README.md` komplet

---

## T080 — Credential migration: fjern Stripe fra `connector-module`, tilføj til `payment-module`

**Sprint:** S038
**Milestone:** M017
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T079
**Branch:** feature/S038/T080-stripe-credential-migration
**PR:** https://github.com/eskobar95/mercflow/pull/127
**PRD journey:** J001 (PRD-payment-module.md)
**ADRs:** ADR-013

### Slice objective

Stripe-credentials fjernes fra `connector-module`. `payment-module` er nu den eneste ejer af Stripe-credentials. Eksisterende Guapo-credentials migreres til `payment_provider_config`. Webhook-route bruger `PaymentModuleService` HMAC-validering. `connector-module` beholder kun GTM, Plunk, Shipmondo.

### Layers in scope

- **DB:** Migration i `connector-module` — fjern `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret` kolonner. `down()` gendanner kolonnerne. Data-migration: kopier eksisterende Guapo Stripe-credentials til `payment_provider_config` som en seeded migration step.
- **Module:** `connector-module` — fjern `StripeConfig` model/fields + `getStripeClient()` helper. Beholder `GtmConfig`, `PlunkConfig`, `ShipmondoConfig`.
- **Backend:** `/webhooks/stripe` route — udskift direkte HMAC-check med `PaymentModuleService.verifyWebhookSignature()`

### Definition of done

- [ ] `rg "stripe" packages/connector-module/src` returnerer 0 resultater (ekskl. eventuelle kommentarer)
- [ ] Guapo Stripe-credentials tilgængelige i `payment_provider_config` post-migration
- [ ] `/webhooks/stripe` bruger `PaymentModuleService` HMAC — validerer korrekt mod mode-aktiv secret
- [ ] Migration `down()` gendanner `connector-module` Stripe-felter
- [ ] `pnpm typecheck` + `pnpm test` grøn

---

## T081 — `subscription-module` → delegér charge-execution til `payment-module`

**Sprint:** S038
**Milestone:** M017
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T079
**Branch:** feature/S038/T081-subscription-module-payment-delegation
**PR:** https://github.com/eskobar95/mercflow/pull/126
**PRD journey:** J003 (PRD-payment-module.md)
**ADRs:** ADR-013

### Slice objective

`subscription-module` og BullMQ `charge-subscription` job har ingen direkte Stripe SDK imports. Alle charge-operationer går via `PaymentModuleService.getActiveProvider(storeId)`. Renewal worker resolver provider per `store_id` ved job-execution.

### Layers in scope

- **Module:** `packages/subscription-module/` — udskift `stripe.paymentIntents.create()` med `provider.chargeSubscription()`; udskift Stripe webhook HMAC-check med `PaymentModuleService.verifyWebhookSignature()`
- **Worker:** `apps/worker/` — `charge-subscription` job resolver `PaymentModuleService` fra Medusa container; idempotency key uændret (`sub_{id}_{date}`)
- **Tests:** Opdater unit tests — mock `IPaymentProvider`, ikke Stripe SDK direkte

### Definition of done

- [x] `rg "from 'stripe'" packages/subscription-module/` returnerer 0 resultater
- [x] `rg "from 'stripe'" apps/worker/"` returnerer 0 resultater
- [x] Renewal job testes med mock `IPaymentProvider` — ikke Stripe SDK
- [x] `pnpm typecheck` + `pnpm test` grøn

---

## T082 — Settings → Payments UI: provider config form, test/live tabs, mode toggle

**Sprint:** S039
**Milestone:** M017
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T080
**Branch:** feature/S039/T082-settings-payments-ui
**PR:** https://github.com/eskobar95/mercflow/pull/128 (merged `049760e`)
**PRD journey:** J001, J002 (PRD-payment-module.md)
**ADRs:** ADR-013, ADR-012

### Slice objective

Merchant kan åbne Settings → Payments, indtaste Stripe test- og live-credentials i separate tabs, og toggle mellem test- og live-mode. Status-badge viser "Test mode — connected" / "Live mode — active" / "Not configured". Webhook endpoint URL vises til kopiering.

### Layers in scope

- **Backend:** Admin routes `/admin/payment-providers` — `GET` (config + publishable key for aktiv mode), `PUT` (upsert credentials), `POST /mode` (skift mode). Zod-validering. Secret keys aldrig returneret.
- **UI:** `packages/admin-ui/`
  - `src/pages/settings/PaymentsSettingsPage.tsx` — provider section med "Stripe"-titel + status-badge
  - `StripeCredentialsForm.tsx` — tabs: "Test" / "Live"; felter: Secret key, Publishable key, Webhook secret
  - Mode toggle: "Activate live mode" med bekræftelsesdialog
  - Webhook URL display med copy-button: `https://[domain]/webhooks/stripe`
  - Route i `settingsNav.ts`: Settings → Payments → `/settings/payments`

### Definition of done

- [ ] Test-credentials kan gemmes og vises (publishable key synlig, secret key maskeret)
- [ ] Live-credentials kan gemmes separat
- [ ] Mode toggle skifter `mode` i DB + viser bekræftelsesdialog
- [ ] Status-badge afspejler faktisk DB-tilstand
- [ ] Secret key returneres aldrig fra API (response contains `has_secret_key: boolean`)
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## M018 — Discount System

---

## T083 — Backend discount routes + Zod + "Discounts" top-level nav item

**Sprint:** S040
**Milestone:** M018
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T082
**Branch:** feature/S040/T083-discount-routes-nav
**PR:** https://github.com/eskobar95/mercflow/pull/129
**PRD journey:** — (PRD-discount-system.md)
**ADRs:** ADR-012

### Slice objective

`/admin/discounts` CRUD-routes eksisterer, validerer med Zod, og wrapper Medusa's `promotion` API. "Discounts" er et top-level nav item i sidebar (samme niveau som Orders og Products). Discount-listesiden loader og viser eksisterende Medusa-promotions.

### Layers in scope

- **Backend:** `apps/backend/src/api/admin/discounts/`
  - `GET /admin/discounts` — list (wraps `GET /admin/promotions` + enrichment: type label, method, usage count)
  - `POST /admin/discounts` — create (translate form payload → Medusa promotion create); Zod schema
  - `GET /admin/discounts/:id` — single
  - `PATCH /admin/discounts/:id` — update; Zod schema
  - `DELETE /admin/discounts/:id`
  - `POST /admin/discounts/:id/activate` + `/deactivate`
  - Alle routes: `store_id` fra JWT enforced
- **UI nav:** `packages/admin-ui/src/lib/nav/sidebarNav.ts` — tilføj "Discounts" som top-level item med icon
- **UI page:** `src/pages/discounts/DiscountsListPage.tsx` — tabel: name, type, method, status badge, usage/limit, expiry. Skeleton loading, empty state, "Create discount" CTA.

### Definition of done

- [ ] `GET /admin/discounts` returnerer Medusa-promotions med enrichment
- [ ] Alle routes validerer med Zod og returnerer korrekt `MedusaError` ved fejl
- [ ] "Discounts" synlig i sidebar som top-level item
- [ ] Listeside loader og viser discounts (happy path)
- [ ] Empty state vises når ingen discounts
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T084 — Discount list + Product discount + Order discount create/edit forms

**Sprint:** S041
**Milestone:** M018
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T083
**Branch:** feature/S041/T084-discount-product-order-forms
**PR:** https://github.com/eskobar95/mercflow/pull/130
**PRD journey:** J001 (PRD-discount-system.md)
**ADRs:** —

### Slice objective

Merchant kan oprette og redigere Product discounts og Order discounts via en ren form-wizard. Shared conditions section (min purchase, customer eligibility, usage limits, date range, combination rules) er implementeret og genbruges.

### Layers in scope

- **UI:** `packages/admin-ui/src/pages/discounts/`
  - `DiscountCreatePage.tsx` — type-selector (4 tiles: Product, Order, Buy X Get Y, Free Shipping) → form per type
  - `ProductDiscountForm.tsx` — value (% eller fast beløb), applies to (All / Collections / Products), method (code/automatic), shared conditions
  - `OrderDiscountForm.tsx` — value, applies to: order total, method, shared conditions
  - `DiscountCodeInput.tsx` — code-felt med "Generate" button
  - `DiscountConditionsSection.tsx` — min purchase, min quantity, customer eligibility, usage limits (total + per customer), date range picker, combination checkboxes
  - `DiscountEditPage.tsx` — genbruger form-komponenterne
- **UI:** Discount detail-side: summary + conditions + usage stats + activate/deactivate/delete actions

### Definition of done

- [ ] Merchant kan oprette Product discount (% og fast beløb) med coupon code
- [ ] Merchant kan oprette Order discount (automatic)
- [ ] Conditions section gemmes korrekt (min purchase, dates, usage limits)
- [ ] "Generate" button producerer random 8-char uppercase code
- [ ] Edit-flow genindlæser eksisterende værdier korrekt
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T085 — Buy X Get Y form + Free Shipping form + activate/deactivate/delete

**Sprint:** S041
**Milestone:** M018
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T083
**Branch:** feature/S041/T085-discount-bxgy-freeshipping
**PR:** https://github.com/eskobar95/mercflow/pull/131
**PRD journey:** J002, J003 (PRD-discount-system.md)
**ADRs:** —

### Slice objective

Merchant kan oprette Buy X Get Y og Free Shipping discounts. Activate/deactivate/delete-actions virker for alle discount-typer. Free shipping med land-scope og pris-threshold fungerer.

### Layers in scope

- **UI:** `packages/admin-ui/src/pages/discounts/`
  - `BuyXGetYForm.tsx` — "Customer buys" (qty/amount + product scope), "Customer gets" (qty + % / fast / gratis + produkt-scope), max uses per order
  - `FreeShippingForm.tsx` — countries (all / specific med multi-select), "Exclude above" pris-threshold felt
  - Discount list: "Activate" / "Deactivate" row actions i dropdown
  - Discount detail: "Delete" med confirm-dialog

### Definition of done

- [ ] Buy X Get Y discount kan oprettes og gemmes via Medusa promotion API
- [ ] Free Shipping discount med threshold og land-scope oprettes korrekt
- [ ] Activate/deactivate toggler status-badge i listesiden real-time
- [ ] Delete kræver confirm-dialog; fjerner discount fra liste
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## M019 — Tenant Onboarding

---

## T086 — HITL: Stripe platform setup + `platform_invite` tabel + backend invite-routes + Console invite UI

**Sprint:** S042
**Milestone:** M019
**Status:** done
**Mode:** AFK
**HITL approved:** 2026-06-13 — Stripe test keys supplied in session; `platform_invite` migration fields approved; `STRIPE_PLATFORM_PRICE_ID` to be created in Stripe before T088 billing step
**PR:** https://github.com/eskobar95/mercflow/pull/133
**Parallel group:** solo
**Blocked by:** T082
**Branch:** feature/S042/T086-tenant-onboarding-invite-foundation
**PRD journey:** J001 (PRD-tenant-onboarding.md)
**ADRs:** ADR-014

### Slice objective

Operator kan i Platform Console åbne "Tenants" → "Invite merchant", indtaste en e-mail, og sende et invite-link. Invite-listen viser status (Pending / Redeemed / Expired / Revoked) og en "Revoke" action. `platform_invite` tabel eksisterer med korrekte felter og migration.

### Layers in scope

- **DB:** `platform_invite` tabel — `id`, `email`, `token` (hashed UUID), `status` enum, `invited_by`, `created_at`, `expires_at` (72h), `redeemed_at` (nullable), `tenant_id` (nullable). Ikke en Medusa DML module — platform-niveau tabel i `apps/backend`.
- **Backend:** `/platform/invites` routes (platform-bypass-RLS):
  - `POST /platform/invites` — generer token, gem hashed, send invite email via SES (notification-module)
  - `GET /platform/invites` — list med status
  - `POST /platform/invites/:id/revoke`
  - `GET /platform/invites/validate?token=` — public; bruges af signup flow
- **Console UI:** `apps/platform-console/`
  - "Invite merchant" button i Tenants-siden → modal med e-mail felt + send
  - Invites list-tab: tabel med email, status badge, expires, redeemed_at, Revoke action
- **HITL:** Operatøren konfigurerer `STRIPE_PLATFORM_SECRET_KEY` + `STRIPE_PLATFORM_PRICE_ID` i `.env` på Hetzner

### Definition of done

- [ ] HITL-checkpoint: Stripe platform-konto konfigureret; env vars sat på server
- [ ] `platform_invite` migration kører rent; `down()` implementeret
- [ ] `POST /platform/invites` opretter invite + sender email inden for 30s
- [ ] Invite token er single-use og expires efter 72h
- [ ] `/platform/invites/validate?token=` returnerer `{ valid: true/false, email, store_name? }`
- [ ] Platform Console invite modal + liste virker
- [ ] `pnpm typecheck` + `pnpm lint` grøn

---

## T087 — Signup flow steps 1–4: invite-validering, Clerk SignUp, store-detaljer, domain + gate middleware

**Sprint:** S043
**Milestone:** M019
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T086
**Branch:** feature/S043/T087-signup-flow-steps-1-4
**PR:** https://github.com/eskobar95/mercflow/pull/134
**PRD journey:** J002 (PRD-tenant-onboarding.md)
**ADRs:** ADR-014, ADR-011

### Slice objective

`/signup?invite=[token]` er tilgængeligt og gennemgår de første 4 trin: token-validering (fejlside ved ugyldigt/udløbet token), Clerk SignUp, store-detaljer (navn, valuta, land, tidszone), og domain-input. Invite gate middleware blokerer `/signup` uden gyldigt token (med `MERCFLOW_PUBLIC_SIGNUP=true` env flag til at deaktivere gaten).

### Layers in scope

- **App:** `apps/onboarding/` (ny Vite React app) eller sub-route i `apps/platform-console/` — decision: sub-route i platform-console for simplicity i v1
- **UI — Step 1:** Token-validering: vis fejlside ("Invite link invalid or expired") hvis token er ugyldigt
- **UI — Step 2:** Clerk `<SignUp />` component — email + password; hosted Clerk UI
- **UI — Step 3:** Store-detaljer form — store name, currency (select), country (select), timezone (select)
- **UI — Step 4:** Domain-input — subdomain (`[input].mercflow.shop`) eller custom domain (fritekst); vejledning om DNS-opsætning vises
- **Middleware:** Invite gate — tjek `?invite=` token mod `/platform/invites/validate`; 403 uden gyldigt token; `MERCFLOW_PUBLIC_SIGNUP=true` env var disabler gaten
- **State:** Wizard state bevares i React context (ikke URL params) — data fra trin 1–4 videresendes til trin 5

### Definition of done

- [x] `/signup` uden token → 403/fejlside (med gaten aktiv)
- [x] `/signup?invite=[ugyldigt]` → fejlside "Invalid or expired invite"
- [x] Clerk SignUp-step fungerer (test mode Clerk)
- [x] Store-detaljer valideres client-side (navn required, valuta+land+timezone required)
- [x] Domain-input accepterer subdomain og custom domain
- [x] `MERCFLOW_PUBLIC_SIGNUP=true` disabler gate (lokal test bekræftet)
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T088 — Signup step 5–7 + `provision-tenant` BullMQ job + platform billing webhook + welcome email

**Sprint:** S044
**Milestone:** M019
**Status:** done
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** T087
**Branch:** feature/S044/T088-signup-provisioning-billing
**PR:** https://github.com/eskobar95/mercflow/pull/135
**PRD journey:** J002, J003 (PRD-tenant-onboarding.md)
**ADRs:** ADR-014, ADR-010

### Slice objective

Merchant gennemfører Step 5 (Stripe Payment Element for platform-abonnement), ser Step 6 (provisioning-progress med synlige trin), og lander i Step 7 ("Your store is ready" med link til Store Admin). Bag scenen kører `provision-tenant` BullMQ job idempotent: opretter Medusa Store, Sales Channel, Publishable API Key, Clerk Org + admin user, Traefik domain-regel, og Stripe platform subscription. Welcome-email sendes via notification-module.

### Layers in scope

- **UI — Step 5:** Stripe Payment Element (plan-detaljer + kortindtastning); Submit → backend bekræfter + trigger provisioning job
- **UI — Step 6:** "Setting up your store…" — polling `/platform/provisioning-status/:jobId`; liste af trin med check-ikoner (Medusa store, Clerk org, Domain routing, Email…); max 60s timeout med fejlbesked
- **UI — Step 7:** "Your store is ready!" — "Open Store Admin" link; bekræftelse om hvad der er oprettet
- **Worker:** `apps/worker/` — `provision-tenant` BullMQ job med 8 idempotente trin:
  1. Create Medusa Store
  2. Create Medusa Sales Channel
  3. Create Medusa Publishable API Key (link til sales channel)
  4. Create Clerk Org (external ID = `store_id`)
  5. Add merchant Clerk user to Org as admin
  6. Set JWT template claim `org_id → store_id`
  7. Add Traefik routing rule for tenant domain (via Traefik API eller Docker label)
  8. Create Stripe platform subscription
  - Hvert trin logges til `platform_audit_log`; fejl → retry (max 3, exponential backoff)
- **Backend:** `POST /platform/provision` — validerer Stripe payment intent → enqueue `provision-tenant` job; `GET /platform/provisioning-status/:jobId` — returnerer job progress
- **Backend:** Stripe platform billing webhook handler — `customer.subscription.created` → mark invite redeemed; `customer.subscription.deleted` → suspend tenant
- **Notification:** "Welcome to MercFlow" React Email template — sendes ved `tenant.provisioned` event

### Definition of done

- [x] Stripe Payment Element vises korrekt i step 5 (test mode)
- [x] `provision-tenant` job kører alle 8 trin idempotent — retry ved fejl genduplikerer ikke resources
- [x] Alle 8 trin logger til `platform_audit_log`
- [x] Provisioning-progress poller korrekt; trin vises med check-ikoner
- [x] `customer.subscription.created` webhook verificeres med HMAC og trigger korrekt
- [x] Welcome-email sendes inden for 60s af `tenant.provisioned`
- [x] `platform_invite.status` → redeemed + `tenant_id` sat
- [x] Platform Console Tenants-liste viser ny tenant som "Active" efter provisioning
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

---

## T089 — Billing foundation: migration + catalog API + provision step 7

**Sprint:** S045
**Milestone:** M020
**Status:** done
**PR:** https://github.com/eskobar95/mercflow/pull/136
**Mode:** AFK
**Parallel group:** solo
**Blocked by:** none
**Branch:** cursor/t089-billing-foundation-2b04
**PRD journey:** J001 (PRD-platform-billing-retrofit.md)
**ADRs:** ADR-015

### Slice objective

Backend-fundamentet er på plads: `platform_tenant_billing` tabel eksisterer, `GET /platform/billing/plans?currency=xxx` returnerer Standard/Pro × Monthly/Annual med live beløb fra Stripe, `POST /platform/signup/billing/setup` validerer `price_id` mod Stripe (ingen `STRIPE_PLATFORM_PRICE_ID` lookup), og provision-jobbet skriver `store_id` + `clerk_org_id` til Stripe Customer + Subscription metadata og upsert-er `platform_tenant_billing`.

### Layers in scope

- **DB:** `platform_tenant_billing` migration (raw SQL — platform-level tabel, ikke Medusa DML). Felter: `store_id` PK, `clerk_org_id`, `stripe_customer_id` UNIQUE, `stripe_subscription_id` UNIQUE, `stripe_price_id`, `plan_tier`, `billing_interval`, `billing_currency`, `subscription_status`, `current_period_end`, `created_at`, `updated_at`. Migration har `down()` + MIGRATION DECISION LOG comment.
- **API:** `GET /platform/billing/plans?currency=xxx` — henter aktive Stripe Prices med `metadata.mercflow_platform=true`, grupperer per tier + interval. In-memory cache 60s per currency. Response shape: `{ plans: [{ tier, name, interval, currency, amount, price_id }] }`.
- **API:** `POST /platform/signup/billing/setup` retrofit — accepterer `{ price_id, invite_token, email, store_name }`. Backend validerer at `price_id` tilhører en aktiv MercFlow platform Price (henter fra Stripe, tjekker metadata). Fjerner `getStripePlatformPriceId()` kald.
- **Worker:** `provision-tenant` job step 7 tilføjes (eller opdateres hvis allerede eksisterer): `stripe.customers.update(cus_id, { metadata: { store_id, clerk_org_id, mercflow_platform: 'true' } })` + `stripe.subscriptions.update(sub_id, { metadata: { store_id, clerk_org_id, plan_tier, billing_interval } })` + upsert `platform_tenant_billing` row.
- **Cleanup:** `getStripePlatformPriceId()` fjernes fra `apps/backend/src/lib/platform-billing/stripe-platform-client.ts`. `STRIPE_PLATFORM_PRICE_ID` fjernes fra `.env.example` (allerede gjort) og eventuelle andre steder i kodebasen.
- **Tests:** integration test verificerer at `GET /platform/billing/plans?currency=dkk` returnerer mindst 2 plans (kræver Stripe test-key i env). Unit test på provision-step: mock Stripe API, verificerer at metadata skrives korrekt og `platform_tenant_billing` upsert-es.

### Definition of done

- [x] `platform_tenant_billing` migration kører lokalt (`pnpm migration:run`) og har `down()`
- [x] `GET /platform/billing/plans?currency=dkk` returnerer `plans` array med `tier`, `interval`, `currency`, `amount`, `price_id`
- [x] `POST /platform/signup/billing/setup` afviser ukendt/inaktiv `price_id` med 400
- [x] Provision step 7 skriver `store_id` i Stripe Customer **og** Subscription metadata
- [x] `platform_tenant_billing` row upsert-es med `subscription_status=active` efter provision
- [x] `rg "STRIPE_PLATFORM_PRICE_ID" .` → 0 resultater (kun docs/planning)
- [x] `rg "getStripePlatformPriceId" .` → 0 resultater
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T090 — Webhook retrofit + suspend action + audit log

**Sprint:** S046
**Milestone:** M020
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T089
**Branch:** feature/S046/T090-webhook-suspend-audit
**PR:** https://github.com/eskobar95/mercflow/pull/137
**PRD journey:** J003, J004 (PRD-platform-billing-retrofit.md)
**ADRs:** ADR-015

### Slice objective

Webhooks fra Stripe platform-konto resolves korrekt via `store_id` (ikke `invite_token_hash`). `platform_tenant_billing` holdes synkroniseret på alle relevante events. Suspend-action i Platform Console canceller Stripe subscription som en del af den samme operation.

### Layers in scope

- **Backend — webhook handler** (`apps/backend/src/lib/platform-billing/`): Opdatér tenant-resolution-logik — prioritér `subscription.metadata.store_id` (primary) → `customer.metadata.store_id` (secondary) → `invite_token_hash` (bootstrap fallback, log warning når brugt). Håndtér: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`. Alle events opdaterer `platform_tenant_billing.subscription_status` + `current_period_end` + `updated_at`.
- **Backend — suspend route** (`POST /platform/admin/tenants/:store_id/suspend`): atomisk operation — (1) `stripe.subscriptions.cancel(sub_id)`, (2) `store.is_disabled = true` via Medusa Admin API, (3) revoke Publishable API Keys, (4) update `platform_tenant_billing.subscription_status = 'canceled'`. Alt sker i samme request; fejl i trin 2+ skal logges + returnere partial-success med klart error-message.
- **Backend — audit log**: Skriv `platform_audit_log` entries med `entity_id = store_id`, `action`, `actor`, `payload` (JSON) på: billing status change (alle webhook events), suspend, provision completion (allerede dækket af T089).
- **Tests:** Unit test på webhook resolution-logik med alle tre lookup-paths. Integration test på suspend: mock Stripe + Medusa, verificer at alle fire trin udføres og audit log skrives.

### Definition of done

- [x] `customer.subscription.updated` opdaterer `platform_tenant_billing.subscription_status`
- [x] `invoice.payment_failed` sætter status til `past_due` + skriver audit log
- [x] `customer.subscription.deleted` sætter status til `canceled` + skriver audit log
- [x] Webhook resolution bruger `store_id` som primary key (verificeret via test)
- [x] `invite_token_hash` fallback logger `warn` til server log
- [x] Suspend-route canceller Stripe subscription + disabler store + revokér keys i én operation
- [x] `platform_audit_log` har entries for alle ovenstående events
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T091 — Signup Step 5 plan picker UI

**Sprint:** S046
**Milestone:** M020
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T089
**Branch:** feature/S046/T091-signup-plan-picker
**PR:** https://github.com/eskobar95/mercflow/pull/139
**PRD journey:** J001 (PRD-platform-billing-retrofit.md)
**ADRs:** ADR-015

### Slice objective

Signup Step 5 viser en plan picker med tier-cards (Standard / Pro) og et Monthly/Annual interval-toggle. Beløb er hentet live fra `GET /platform/billing/plans?currency=xxx` baseret på den currency der blev sat i Step 3. Merchant vælger plan → Stripe Payment Element vises med den valgte pris. `price_id` sendes til `POST /platform/signup/billing/setup`.

### Layers in scope

- **UI:** `apps/platform-console/src/signup/steps/SignupStep5Billing.tsx` redesignes. Komponent er max ~200 linjer — split i `PlanPicker.tsx`, `PlanCard.tsx`, `BillingIntervalToggle.tsx` i samme directory hvis nødvendigt.
- **UI — Plan picker:** To tier-cards (Standard / Pro) side om side. Hvert card viser: navn, pris per interval (fra Stripe), evt. feature-liste (hardcoded copy i v1 — ikke fra Stripe). Monthly/Annual toggle over cards. Valgt card fremhæves (border, check-ikon). Beløb formateres korrekt per currency (DKK: "299 kr/md", EUR: "€39/mo").
- **UI — Loading + error states:** Skeleton loader mens plans hentes. Error-state med retry-knap hvis Stripe-kald fejler. Ingen planer tilgængelige → fallback tekst + kontakt-link.
- **UI — Payment Element:** Vises under plan picker. Kald til `POST /platform/signup/billing/setup` medtager valgt `price_id`. Eksisterende Stripe Elements setup bevares — kun `priceId` parameter tilføjes.
- **Types:** `PlatformPlan` type matcher `GET /platform/billing/plans` response shape.

### Definition of done

- [x] Plan picker renderes med Standard + Pro cards og Monthly/Annual toggle
- [x] Beløb hentes fra `GET /platform/billing/plans?currency=xxx` (ingen hardcoded beløb)
- [x] Valgt `price_id` sendes korrekt til `POST /platform/signup/billing/setup`
- [x] Skeleton loader vises mens plans loader
- [x] Error state med retry-knap hvis API fejler
- [x] Ingen hardcoded `STRIPE_PLATFORM_PRICE_ID` i UI-kode
- [x] `pnpm react-doctor:admin-ui` 0 issues (hvis admin-ui er berørt — ellers N/A)
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

## T092 — Platform Console Tenant billing panel

**Sprint:** S046
**Milestone:** M020
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** T089
**Branch:** feature/S046/T092-console-billing-panel
**PR:** https://github.com/eskobar95/mercflow/pull/138
**PRD journey:** J002, J004 (PRD-platform-billing-retrofit.md)
**ADRs:** ADR-015

### Slice objective

Tenant detail-siden i Platform Console har en "Billing" sektion der viser plan, interval, currency, subscription status, og `current_period_end` fra `platform_tenant_billing`. "View in Stripe" link åbner Stripe Dashboard direkte. Suspend-knappen er tilgængelig og kalder suspend-route (T090). Operator kan se alle relevante billing-detaljer uden at åbne Stripe Dashboard.

### Layers in scope

- **API:** `GET /platform/admin/tenants/:store_id/billing` — læser fra `platform_tenant_billing` + returnerer row som JSON. Ingen Stripe API-kald (Platform Console list-view skal forblive hurtig).
- **UI:** Tenant detail-side (`apps/platform-console/src/tenants/TenantDetail.tsx` eller tilsvarende) — tilføj "Billing" section/card. Felter: plan tier badge (Standard / Pro), interval, currency, status badge (Active / Past due / Canceled — farvekodning), "Renews" dato (fra `current_period_end`), "View in Stripe" link (konstrueret fra `stripe_customer_id`: `https://dashboard.stripe.com/customers/{stripe_customer_id}`).
- **UI — Suspend:** Eksisterende suspend-knap (fra T090) integreres i billing-panelet. Confirm-dialog: "This will disable the store, revoke API keys, and cancel the Stripe subscription. This cannot be undone." Viser loading-state under operation.
- **UI — Edge cases:** Tenant uden `platform_tenant_billing` row (f.eks. intern Guapo-tenant) → billing-sektion vises ikke / "No platform billing" placeholder. Canceled tenant → viser canceled badge + ingen suspend-knap.

### Definition of done

- [x] Billing panel viser tier, interval, currency, status, `current_period_end`
- [x] Status badge er farvekodnet (grøn = active, gul = past_due, rød = canceled)
- [x] "View in Stripe" link bygget fra `stripe_customer_id` — åbner korrekt Stripe Dashboard URL
- [x] Suspend-knap kalder T090's suspend-route med confirm-dialog
- [x] Tenant uden billing row → "No platform billing" placeholder (ingen fejl)
- [x] `pnpm typecheck` + `pnpm lint` grøn

---

---

## T093 — CVE remediation + audit gate

**Sprint:** S047
**Milestone:** M021
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S047/T093-cve-remediation
**PR:** https://github.com/eskobar95/mercflow/pull/142
**PRD journey:** J003 (PRD-security-hardening.md)
**ADRs:** ADR-016

### Slice objective

`pnpm audit --audit-level=high` returns exit code 0. The 1 high-severity esbuild CVE is resolved by bumping `tsx`. Moderate production-path CVEs are addressed where a safe upgrade exists. Dev-only moderate CVEs are documented in `infra/SECURITY.md` as accepted risk. `gitleaks detect --source . --staged` returns 0 secrets.

### Layers in scope

- **Dependencies:** Bump `tsx` to `>=4.23.0` in root `package.json` devDependencies → resolves esbuild `<0.28.1` high CVE. Verify `pnpm audit` clears the high entry.
- **Dependencies:** Bump `react-router` to latest patch in `apps/platform-console` and `packages/admin-ui`. Bump `vite` to latest `5.x` in both apps. Check if `qs`, `ajv`, `ws` can be resolved by bumping `@medusajs/deps` in the fork — if yes, bump; if not, add `pnpm.overrides` with a comment referencing the CVE.
- **Dependencies:** For each remaining moderate CVE: classify as production-path or dev-only. Production-path without a safe upgrade path → document in `infra/SECURITY.md` with version, CVE ID, rationale, and expiry sprint. Dev-only → document same.
- **Infra:** Create `infra/SECURITY.md` — lists accepted-risk CVEs (package, CVE ID, severity, why dev-only/unexploitable, target sprint to revisit).
- **Secrets:** Run `gitleaks detect --source . --staged` locally + add it to CI pipeline as a required check (or document how to run it manually pre-PR if CI config is out of scope for this task).
- **Tests:** All existing tests pass (`pnpm test`). `pnpm typecheck` green.

### Definition of done

- [ ] `pnpm audit --audit-level=high` → exit code 0
- [ ] `tsx` bumped to `>=4.23.0` in root devDependencies
- [ ] `react-router` + `vite` bumped to latest patch in affected apps
- [ ] `infra/SECURITY.md` created with documented accepted-risk CVEs
- [ ] `gitleaks detect --source . --staged` → 0 secrets
- [ ] `pnpm test` + `pnpm typecheck` green

---

## T094 — `validateBody` helper + Zod on all 20 platform routes

**Sprint:** S047
**Milestone:** M021
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S047/T094-platform-route-validation
**PR:** https://github.com/eskobar95/mercflow/pull/141
**PRD journey:** J001 (PRD-security-hardening.md)
**ADRs:** ADR-016

### Slice objective

Every POST/PATCH `/platform/*` route validates its request body with Zod before any business logic runs. URL params on parameterised routes are validated. A malformed payload receives a clean 400 with a human-readable message — no stack traces, no silent pass-through.

### Layers in scope

- **Shared helper:** Create `apps/backend/src/lib/platform-http/validateBody.ts`:
  ```ts
  export function validateBody<T>(schema: ZodSchema<T>, req: MedusaRequest): T {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        result.error.issues.map(i => i.message).join(', ')
      )
    }
    return result.data
  }
  ```
- **Routes — apply Zod schemas (all 20 platform routes):**
  - `POST /platform/invites` → `{ email: z.string().email() }`
  - `POST /platform/invites/:id/revoke` → params `{ id: z.string().min(1) }`
  - `POST /platform/signup/billing/setup` → `{ price_id: z.string().startsWith('price_'), invite_token: z.string().min(1) }`
  - `POST /platform/provision` → `{ payment_intent_id: z.string().min(1), invite_token: z.string().min(1) }`
  - `POST /platform/admin/tenants/:store_id/suspend` → params `{ store_id: z.string().min(1) }`
  - All remaining POST/PATCH routes: define body schema based on handler logic; read-only GET routes: validate required URL params inline
- **Tests:** Unit test for `validateBody` — valid payload passes, invalid rejects with 400-mappable error. Integration test for at least 2 routes: one with valid body, one with invalid.

### Definition of done

- [ ] `validateBody` helper exists in `apps/backend/src/lib/platform-http/validateBody.ts`
- [ ] All 20 platform routes call `validateBody` or inline param validation as first line
- [ ] `POST /platform/invites` with `{ email: "not-an-email" }` → 400
- [ ] `POST /platform/signup/billing/setup` with missing `price_id` → 400
- [ ] Unit test for `validateBody` passes
- [ ] `rg "validateBody" apps/backend/src/api/platform/` → matches all POST/PATCH route files
- [ ] `pnpm typecheck` + `pnpm lint` green

---

## T095 — Rate limiting + `innerHTML` fix + SECURITY.md

**Sprint:** S047
**Milestone:** M021
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S047/T095-rate-limiting-xss-fix
**PR:** https://github.com/eskobar95/mercflow/pull/140
**PRD journey:** J002 (PRD-security-hardening.md)
**ADRs:** ADR-016

### Slice objective

Four high-risk endpoint groups have rate limiting. The `innerHTML` assignment in `previewPlainText.ts` is replaced with a safe alternative. Combined with T093 and T094, M021 is gate-complete.

### Layers in scope

- **Rate limiting:** Install `express-rate-limit` (or equivalent Medusa-compatible middleware). Create `apps/backend/src/lib/platform-http/rateLimits.ts` with four limit configs:
  - `POST /platform/invites` — 10 req / 15 min per IP
  - `POST /platform/signup/*` — 20 req / 15 min per IP
  - `GET /platform/billing/plans` — 30 req / 1 min per IP
  - `POST /platform/provision` — 5 req / 15 min per IP
  - Storage: in-memory (MemoryStore). Document in `infra/SECURITY.md`: upgrade to Redis-backed when horizontal scaling is introduced.
- **XSS fix:** Inspect call sites of `previewPlainText.ts`. If the function is extracting plain text from HTML markup → replace `div.innerHTML = markup` with `div.textContent = markup`. If HTML rendering is genuinely needed → wrap with `DOMPurify.sanitize(markup)` before assignment (add `dompurify` dep). Add a comment explaining the choice.
- **Tests:** Verify rate limit config is applied (middleware registered). Verify `previewPlainText` returns expected output after fix. All existing tests green.

### Definition of done

- [x] Rate limiting middleware registered on all 4 endpoint groups
- [x] 11th POST to `/platform/invites` within 15 min window → 429
- [x] `previewPlainText.ts` — no raw `innerHTML = untrustedInput` assignment
- [x] `pnpm typecheck` + `pnpm lint` green
- [x] Existing tests green

---

## T096 — General + Taxes settings pages

**Sprint:** S048
**Milestone:** M022
**Status:** planned
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S048/T096-settings-general-taxes
**PRD journey:** J001 (PRD-settings-completion.md)
**ADRs:** ADR-012

### Slice objective

A new tenant can fill in their store name, contact email, default currency, timezone, and address — and configure tax regions with rates — entirely from Settings, without operator help.

### Layers in scope

- **UI — `/settings/general`:** Form with fields: store name, contact email, default currency (select from `GET /admin/currencies`), timezone (IANA select), address (street, city, postal code, country). Save button calls `POST /admin/stores/:id`. Unsaved changes → browser prompt on navigate-away (reuse `useUnsavedChanges` pattern from product form if it exists).
- **UI — `/settings/taxes`:** List view of tax regions (country, name, rate %). Empty state: "No tax regions — add one to charge the right tax at checkout." Add/edit slide-over or inline form: country select, name, rate % input. Delete with confirm dialog. Wraps `GET/POST/DELETE /admin/tax-regions` and `GET/POST/DELETE /admin/tax-rates`.
- **Both pages:** Loading skeletons, error banners, success toasts, token-backed styling. `pnpm react-doctor:admin-ui` 0 issues.

### Definition of done

- [ ] `/settings/general` saves store name + email + currency + timezone + address via Medusa API
- [ ] `/settings/taxes` lists, adds, edits, deletes tax regions
- [ ] Both pages have loading, error, and empty states
- [ ] Unsaved changes prompt on General page
- [ ] `pnpm react-doctor:admin-ui` 0 new issues
- [ ] `pnpm typecheck` + `pnpm lint` green

---

## T097 — Shipping zones + Carriers settings pages

**Sprint:** S048
**Milestone:** M022
**Status:** planned
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S048/T097-settings-shipping-carriers
**PRD journey:** J001 (PRD-settings-completion.md)
**ADRs:** ADR-012

### Slice objective

A merchant can configure shipping profiles and flat/weight-based rates, and connect Shipmondo with their API key — all from Settings without touching code or contacting support.

### Layers in scope

- **UI — `/settings/shipping`:** Tab layout: Profiles | Rates. Profiles tab: list of shipping profiles (name, type); add/edit/delete. Rates tab: shipping options scoped to selected profile (name, carrier label, price, conditions); add/edit/delete. Wraps Medusa `GET/POST/DELETE /admin/shipping-profiles` and `/admin/shipping-options`.
- **UI — `/settings/shipping/carriers`:** Shipmondo connector config card. Fields: API key (masked password input), sender name, sender address. "Test connection" button → calls a validation endpoint (`POST /admin/connectors/shipmondo/test` or equivalent in connector-module). Status badge: Connected / Error / Not configured. Wraps `connector-module` Shipmondo config routes.
- **Both pages:** Loading, error, empty states. Token-backed styling. `pnpm react-doctor:admin-ui` 0 issues.

### Definition of done

- [ ] `/settings/shipping` manages profiles and rates via Medusa API
- [ ] `/settings/shipping/carriers` saves Shipmondo credentials + "Test connection" works
- [ ] Shipmondo status badge reflects actual connection state
- [ ] Both pages have loading, error, and empty states
- [ ] `pnpm react-doctor:admin-ui` 0 new issues
- [ ] `pnpm typecheck` + `pnpm lint` green

---

## T098 — Team settings page

**Sprint:** S048
**Milestone:** M022
**Status:** planned
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S048/T098-settings-team
**PRD journey:** J002 (PRD-settings-completion.md)
**ADRs:** ADR-012, ADR-011

### Slice objective

A merchant can invite team members by email, assign roles (Admin / Staff), and revoke access — entirely from `/settings/team`. No Clerk Dashboard access needed.

### Layers in scope

- **Backend (if not existing):** Check for a Clerk org-members proxy route in `apps/backend`. If missing, create: `GET /admin/team/members` (list org members from Clerk), `POST /admin/team/invite` (send Clerk invitation with role), `DELETE /admin/team/members/:clerk_user_id` (remove from org). All routes use `validateBody` per ADR-016. Auth: Medusa admin JWT → extract `clerk_org_id` from JWT claims.
- **UI — `/settings/team`:** Members table: avatar (initials fallback), name, email, role badge (Admin / Staff), joined date, row actions (Change role, Revoke). "Invite member" form above table: email input + role select → Submit sends invitation. Empty state: "Your team is just you — invite colleagues to help manage your store." Confirmation dialog on Revoke.
- **Page:** Loading skeleton, error banner, success toast on invite sent / member revoked. Token-backed styling. `pnpm react-doctor:admin-ui` 0 issues.

### Definition of done

- [ ] `/admin/team/members` returns current org members (or existing route confirmed)
- [ ] `/admin/team/invite` sends Clerk invitation with correct role
- [ ] `/settings/team` lists members + invite form + revoke works
- [ ] Role change persists via Clerk API
- [ ] Empty state rendered when no other members
- [ ] `pnpm react-doctor:admin-ui` 0 new issues
- [ ] `pnpm typecheck` + `pnpm lint` green

---

## T099 — Notifications + Email settings pages

**Sprint:** S048
**Milestone:** M022
**Status:** planned
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S048/T099-settings-notifications-email
**PRD journey:** J001 (PRD-settings-completion.md)
**ADRs:** ADR-012, ADR-009

### Slice objective

A merchant can configure their email branding (logo, color, from name, reply-to) and enable/disable individual notification templates — and verify their sending domain status — from Settings.

### Layers in scope

- **UI — `/settings/notifications`:** Two sections: Branding + Templates. Branding: from name (text), reply-to email, logo URL (text input or upload), brand color (hex color picker). Templates: list of notification types (Order confirmation, Shipping update, Cancellation) each with enable/disable toggle + "Preview" button. Preview opens a modal with rendered email (use existing React Email preview if available). Wraps `notification-module` branding config API.
- **UI — `/settings/email`:** Verify M012 delivered a functional page. If it's a placeholder or incomplete: step-by-step layout — enter sending domain → DNS records shown (DKIM + SPF) → "Verify now" button polls SES status → status badge updates. Default from address field. Wraps `notification-module` SES domain identity routes. If already complete, add polish only (loading states, empty state copy, token styling).
- **Both pages:** Loading, error, empty states. `pnpm react-doctor:admin-ui` 0 issues.

### Definition of done

- [ ] `/settings/notifications` saves branding fields + template toggles persist
- [ ] Preview modal renders a sample email with the saved branding
- [ ] `/settings/email` domain verification flow is complete end-to-end (enter → DNS records → verify → status)
- [ ] Both pages have loading, error, and empty states
- [ ] `pnpm react-doctor:admin-ui` 0 new issues
- [ ] `pnpm typecheck` + `pnpm lint` green

---

## T100 — Apps overview + Developers settings pages

**Sprint:** S048
**Milestone:** M022
**Status:** done
**Mode:** AFK
**Parallel group:** A
**Blocked by:** none
**Branch:** feature/S048/T100-settings-apps-developers
**PR:** https://github.com/eskobar95/mercflow/pull/146
**PRD journey:** J003, J004 (PRD-settings-completion.md)
**ADRs:** ADR-012

### Slice objective

A merchant can see all connected apps and their status at a glance from `/settings/apps`, and find their publishable API key for storefront integration from `/settings/developers`.

### Layers in scope

- **UI — `/settings/apps`:** 2-column card grid of connector-module connectors: Stripe, Shipmondo, Plunk, GTM. Each card: logo/icon, name, short description, status badge (Connected / Error / Not configured). "Configure" link navigates to the contextual settings page (Stripe → `/settings/payments`, Shipmondo → `/settings/shipping/carriers`, Plunk → `/settings/notifications`, GTM → connector config page). Status fetched from `GET /admin/connectors`. Refreshes on mount.
- **UI — `/settings/developers`:** Tab layout: API Keys | Webhooks. API Keys tab: publishable key card — partially masked display, copy-to-clipboard icon button, "Revoke & regenerate" with confirmation dialog. Wraps `GET /admin/api-keys` (Medusa publishable key created during provisioning). Webhooks tab: informational placeholder — "Webhook management coming soon" with a brief explanation of what webhooks are for.
- **Both pages:** Loading, error, empty states. Token-backed styling. `pnpm react-doctor:admin-ui` 0 issues.

### Definition of done

- [x] `/settings/apps` shows all 4 connectors with correct status badges
- [x] "Configure" links navigate to correct contextual settings pages
- [x] `/settings/developers` displays publishable API key with copy-to-clipboard
- [x] Revoke & regenerate shows confirm dialog and calls Medusa API
- [x] Webhooks tab shows informational placeholder
- [x] Both pages have loading, error, and empty states
- [x] `pnpm react-doctor:admin-ui` 0 new issues
- [x] `pnpm typecheck` + `pnpm lint` green

---

<!-- Total: T001–T100 | AFK: 83 | HITL: 13 (T003, T008, T013, T023, T027, T033, T036, T053, T057, T064, T067, T074, T086) | Cancelled: T029 -->
<!-- Sprints: S001–S048 | Milestones: M000–M022 -->
