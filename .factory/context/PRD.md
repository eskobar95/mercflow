# PRD — MercFlow Batch 2

> Version 1.1 — 2026-06-04
> Source: `.cursor/docs/PRD-batch2.md` (v0.2, Draft)
> Prerequisite: Batch 1 shipped on `development` (admin UI, content-module, connector-module, subscription-module)
> Multi-tenant model: SaaS — shared Medusa instance + Neon DB, `store_id` row isolation — see ADR-004

---

## Problem

Batch 1 solved the admin layer. Two operational domains remain unaddressed in standard Medusa:

1. **SEO infrastructure** — no redirect handling when slugs change, no sitemap control in admin, no structured data, broken Nordic character handling in URLs, no shopping feed for Google/Meta/TikTok.
2. **Inventory & Purchase Orders** — no purchase order flow, no unified inventory overview, fragmented order processing.

Operators cannot manage SEO without touching code, lose link juice when products move, and have no purchase history or incoming-stock visibility.

Additionally, Batch 2 is the first batch where configuration is **storefront-URL-dependent** (sitemap `<loc>` tags, feed `link` fields, JSON-LD `url` / `logo`) — requiring per-tenant config in the shared DB. No Guapo-specific values may be hardcoded in any module.

---

## Goals

1. Zero dead links when product/category slugs change (auto 301 redirect).
2. Sitemap and robots.txt fully controlled from admin without code changes.
3. Structured data (JSON-LD) auto-generated for product and category pages.
4. Nordic characters (ø/æ/å) produce clean, consistent URLs.
5. One auto-maintained shopping feed consumable by Google, Meta, and TikTok Shopping.
6. Full purchase order lifecycle (draft → ordered → received) with supplier register.
7. Unified inventory overview: stocked, reserved, available, incoming — per variant.
8. Improved order admin: status badges, notes, timeline, bulk actions, printable pick list.
9. **All Batch 2 modules deployable by any operator** — zero Guapo-specific hardcoding; storefront URL, organisation name, locale, currency, and feed config are runtime admin settings, not compile-time constants.

---

## Multi-tenant deployment model

MercFlow is a **SaaS platform**: one shared Medusa instance + one Neon database, multiple shops (tenants) isolated at row level via `store_id`.

### Full architecture

```
┌─────────────────────────────────────────────────────────┐
│  MercFlow Platform (shared)                             │
│                                                         │
│  apps/backend  ←  Medusa v2 + MercFlow modules          │
│  Neon DB       ←  all tenants, store_id isolation       │
│                                                         │
│  Admin UI (MercFlow)  ←  tenant scoped per login        │
│  Public routes: /sitemap.xml, /robots.txt, /feed/*      │
│                  ←  scoped by Host header               │
└────────────────┬────────────────────────────────────────┘
                 │  Medusa Store API (per publishable_api_key)
        ┌────────┴──────────┐
        │  Tenant A         │  Tenant B  …
        │  own frontend repo│  own frontend repo
        │  (starter template│  (starter template
        │  as starting point│   as starting point)
        └───────────────────┘
```

### Tenancy rules for every Batch 2 module table

| Concern | Rule |
|---------|------|
| `store_id` column | `NOT NULL` + index on every MercFlow-owned table |
| Service methods | Every query filters by `store_id`; no query without it |
| Public routes | Scoped by `Host` header → store mapping; return 404 if tenant not found |
| Admin routes | `store_id` from JWT / Medusa session |
| Locale / currency | From Medusa store config via Admin API — never hardcoded list |
| Storefront URL | Stored in per-tenant config table, set in admin Settings |
| Organisation identity | Per-tenant in admin Settings (used for JSON-LD, feed brand) |

### Batch 1 backfill (blocking task for Batch 2)

Existing tables (content-module, connector-module, subscription-module) were created without `store_id`. A migration task must add `store_id NOT NULL` + backfill Guapo's `store_id` on all existing rows **before any Batch 2 feature ships**.

### Starter template

MercFlow provides a frontend starter template (separate repo). Operators clone it as their storefront starting point. The starter connects to the shared MercFlow backend via `publishable_api_key`. No MercFlow admin credentials in the starter.

**Not in scope Batch 2:** tenant provisioning UI, per-tenant billing, tenant onboarding flow, frontend starter template (Batch 3).

### Cross-tenant risk register

These are the specific failure modes that must be gated **before** second tenant is onboarded:

| Risk | Trigger | Guard |
|------|---------|-------|
| All Batch 1 data is global (no `store_id`) | Any query without `store_id` filter returns all tenants' data | M0: backfill migration + NOT NULL before any Batch 2 task |
| Unique indexes cross-tenant | Tenant B uses same slug as Tenant A → constraint violation | Rebuild all 4 unique indexes with `store_id` in M0 |
| No RLS | Service bug or missing filter = silent cross-tenant leak | RLS policy on every MercFlow table in M0 |
| `store` table is currently empty | Cannot backfill until Guapo store record exists | Provision Guapo store as M0 task 0 |
| Public routes return all-tenant data | `/sitemap.xml` without `Host` scoping serves every tenant's URLs | Tenant resolution middleware before public routes ship |

See ADR-004.

---

## Non-goals (Batch 2)

- Wildcard or regex redirects
- Sitemap index / image sitemaps / news sitemaps
- Amazon, Pricerunner, or other non-Google feed formats
- Pinterest Rich Pins / LinkedIn-specific meta
- Nordic payment modules (MobilePay, Klarna)
- GLS / DAO shipping label generation
- Blog / page builder
- Dark mode
- Automatic low-stock ordering
- EDI / supplier system integration
- Email marketing automation beyond connector-module config
- PO → Medusa stock auto-mutation in v1 (UX and API boundary must be explicit in the implementing task; defer auto-mutation unless task spec confirms it)

---

## Success metrics

| Metric | Target |
|--------|--------|
| 301 redirect auto-created on slug change | 100 % of slug changes |
| Sitemap regeneration after catalogue change | < 30 s |
| JSON-LD present on product pages | 100 % of published products |
| Shopping feed validation errors | 0 required fields missing at ship |
| PO create → receive flow works end-to-end | Full lifecycle in admin |
| Available inventory correct vs Medusa reserved | Live, never cached |

---

## Users

**Store admin / operator** — manages a Medusa-based shop (Guapo as first validation case; any Medusa operator as general target). Non-technical; expects SEO tasks to happen automatically after one-time config. Manages supplier orders directly in admin rather than a separate ERP.

**Storefront** (not a human user) — consumes `GET /sitemap.xml`, `GET /robots.txt`, `GET /feed/google-shopping.xml`, JSON-LD / OG metadata from backend public routes.

**Other operators (future)** — install MercFlow on their own Medusa instance; configure storefront URL, organisation data, feed settings, and slug strategy independently. No code changes required to switch shop identity.

---

## User journeys

### J001 — Nordic slug utility

**Problem:** Products with ø/æ/å in their names generate broken URLs or inconsistent slugs across Medusa.
**Goal:** All slugs follow a consistent Nordic transliteration rule configured once in Settings.
**Steps:**
1. Admin opens Settings → Slug strategy → chooses "Nordic (ø→oe)" or "Omit (ø→o)".
2. Live preview shows how a sample name is slugified.
3. On product save, slug is generated by seo-module utility (replaces Medusa default).
4. Admin can trigger bulk re-slug; each change auto-creates a 301 redirect.

**Tasks:** T001

---

### J002 — 301 Redirect Manager

**Problem:** Changing a product or category URL breaks external links and loses SEO value.
**Goal:** Every slug change produces a 301 redirect automatically; admins can manage redirects manually.
**Steps:**
1. Slug changes on product or category → subscriber creates `mercflow_redirect` record.
2. Medusa middleware intercepts incoming request, checks redirect table, returns 301.
3. Admin opens SEO → Redirects → sees list with source, destination, date, type.
4. Admin creates manual redirect (e.g. from migration), imports CSV, deletes stale ones.
5. Chain detection warns if destination is itself a redirect.

**Tasks:** T002, T003

---

### J003 — Sitemap Manager

**Problem:** No admin control over sitemap; operators must edit code to change priorities or exclude pages.
**Goal:** Full sitemap config from admin; auto-regeneration after catalogue changes.
**Steps:**
1. Admin opens SEO → Sitemap → configures priority/changefreq per page type.
2. Admin excludes specific products or categories from sitemap.
3. Manual "Regenerate" button or auto-trigger on catalogue change.
4. `GET /sitemap.xml` returns fresh, cached XML; storefront (or Google) crawls it.
5. Admin sees preview of generated XML inline.

**Tasks:** T004

---

### J004 — Robots.txt Editor

**Problem:** robots.txt is a file on the server; non-technical admins cannot update crawl rules.
**Goal:** robots.txt editable from admin UI; served dynamically from database.
**Steps:**
1. Admin opens SEO → Robots.txt → structured editor with allow/block per path and bot.
2. Sitemap reference auto-inserted.
3. Freetext mode for advanced rules.
4. Preview shows final robots.txt; admin saves.
5. `GET /robots.txt` returns current config from `mercflow_robots_config`.
6. Change history visible in admin.

**Tasks:** T005

---

### J005 — Structured Data / JSON-LD

**Problem:** Product pages have no machine-readable schema; Google misses rich results.
**Goal:** Auto-generated JSON-LD for products, categories, and global site identity.
**Steps:**
1. Admin opens SEO → Structured Data → enables JSON-LD per page type (toggle).
2. Admin fills Organisation fields (name, logo, social URLs) in Settings.
3. Storefront requests product page → backend returns JSON-LD block in API response → storefront injects in `<head>`.
4. Product: `Product` + `Offer` schema from Medusa core + content-module fields.
5. Category: `BreadcrumbList` from category hierarchy.
6. Global: `Organization`, `WebSite` with `SearchAction`.

**Tasks:** T006

---

### J006 — Open Graph & Social Meta

**Problem:** Sharing a product URL on social media shows generic title/image because OG tags are absent.
**Goal:** All OG/Twitter Card tags populated from existing SEO fields with fallbacks.
**Steps:**
1. Backend generates OG metadata from `seo_title`, `seo_description`, `seo_og_image` (content-module).
2. Fallback: if field is empty, use product title / category name.
3. Admin sees social share preview in Content tab (from Batch 1) or SEO panel.
4. Storefront injects tags from API response.

**Tasks:** T006 (co-implement with JSON-LD)

---

### J007 — Canonical URL handling

**Problem:** Same product reachable via multiple paths → duplicate content risk.
**Goal:** Canonical tag auto-set to primary URL; manual override available.
**Steps:**
1. Backend calculates canonical from product slug + active region/locale.
2. Admin can override per product/category in Content tab → override stored in `product_content` / `category_content`.
3. Admin warned if canonical is missing or potentially conflicting.
4. Storefront injects `<link rel="canonical">` from API response.

**Tasks:** T007

---

### J008 — Shopping Feed (Google / Meta / TikTok)

**Problem:** No product feed → manual setup, stale data, feed errors in Merchant Center.
**Goal:** Always-fresh, validated XML feed consumable by all three platforms.
**Steps:**
1. Admin opens Feed → Google Shopping → sees feed URL, last updated, validation report.
2. Admin excludes specific products/categories from feed.
3. Feed invalidated on catalogue change (webhook); `GET /feed/google-shopping.xml` returns fresh XML.
4. Validation report flags products with missing required fields.
5. Admin copies feed URL into Google Merchant Center / Meta / TikTok.

**Tasks:** T008, T009

---

### J009 — Supplier Register

**Problem:** No central record of suppliers; PO creation has nowhere to link supplier data.
**Goal:** Simple CRUD supplier list: name, contact, email, country, currency.
**Steps:**
1. Admin opens Inventory → Suppliers → creates/edits/deletes supplier records.
2. Supplier list available in PO creation form (dropdown).

**Tasks:** T010

---

### J010 — Purchase Orders

**Problem:** No PO flow → no history of what was ordered from whom, no incoming-stock tracking.
**Goal:** Full PO lifecycle from draft to received; inventory updated on receipt.
**Steps:**
1. Admin creates PO: selects supplier, adds variants with quantity + cost, sets expected date, adds reference/notes.
2. PO moves: `draft → ordered → partially_received → received → cancelled`.
3. Admin opens PO → records receipt per variant (actual qty may differ).
4. Discrepancies shown clearly (ordered 100, received 94).
5. Partial receipt leaves PO open for backorder.
6. Inventory updated on confirmed receipt (MercFlow records receipt event; Medusa stock mutation boundary defined per task spec).

**Tasks:** T011, T012, T013

---

### J011 — Inventory Dashboard

**Problem:** Medusa shows raw stock counts; operators can't see available (stocked minus reserved) or incoming from POs.
**Goal:** Unified inventory table: stocked / reserved / available / incoming, with low-stock alerts.
**Steps:**
1. Admin opens Inventory → Overview → table of all variants with four columns.
2. `Available` = stocked − reserved (live, never cached).
3. `Incoming` = sum of open PO quantities for that variant.
4. Filter: low stock only, out of stock only. Sort on any column. Search by name/SKU.
5. Low-stock threshold configurable per variant (default 5); alerts visible in overview.
6. Movement history per variant: sales, returns, PO receipt, manual adjustment — with source label.

**Tasks:** T014

---

### J012 — Improved Order Flow

**Problem:** Order processing in Medusa admin is fragmented; no notes, no pick list, slow bulk actions.
**Goal:** Faster order processing: status badges, internal notes, timeline, bulk actions, pick list.
**Steps:**
1. Admin opens Orders → improved list with status badges, customer, amount, date.
2. Filters: status, date range, payment status, fulfillment status. Bulk select + mark fulfillment-ready.
3. Admin opens order detail → no modal navigation; notes section (internal, not sent to customer).
4. Timeline: placed, paid, fulfillment created, shipped.
5. Admin generates pick list for today's ready-to-ship orders → printable layout.

**Tasks:** T015, T016

---

## System overview

Three new Medusa modules registered in `apps/backend`:

```
seo-module     — redirects, sitemap, robots, slug utility
               — public routes: GET /sitemap.xml, GET /robots.txt
               — admin routes: /admin/redirects, /admin/sitemap-config, /admin/robots-config

feed-module    — feed config, generation, validation
               — public route: GET /feed/google-shopping.xml
               — admin route: /admin/feed-config

inventory-module — suppliers, POs, receipts, inventory dashboard
                 — admin routes: /admin/suppliers, /admin/purchase-orders,
                                 /admin/purchase-orders/:id/receive,
                                 /admin/inventory-overview
```

Batch 1 modules extended (minimal):
- `content-module` — canonical override + brand feed field on product_content
- `admin-ui` — new pages for SEO, Feed, Inventory, improved Orders

All Batch 2 config in admin. Storefront consumes public routes via HTTP.

---

## Deliverables (v1)

1. `@mercflow/seo-module` — package, DB migrations, service, admin + public routes
2. `@mercflow/feed-module` — package, DB migration, feed generation, admin + public route
3. `@mercflow/inventory-module` — package, DB migrations, PO/supplier service, inventory aggregates, admin routes
4. `admin-ui` — SEO pages, Feed page, Inventory pages (suppliers, POs, overview), improved Orders
5. `content-module` additions — canonical override field, brand feed field (migration)
6. Batch 2 README per new package

---

## Security requirements (non-negotiable before second tenant)

Three gaps identified from Neon DB analysis (ADR-005):

| Gap | Risk | Fix |
|-----|------|-----|
| **No RLS** on any MercFlow table | Cross-tenant data leak on any service bug | Enable RLS + `store_id` policy per migration |
| **Neon public connections open** (`block_public_connections: false`, no IP allowlist) | Any internet connection can attempt DB access | Add Railway egress IPs to Neon allowlist now; private link when available |
| **No rate limiting** on public routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`) | Abuse, cost overrun, DoS on Neon compute | Medusa middleware: 60 req/min/IP on public routes, 300 req/min/key on store API |

These are **red gates** — do not onboard a second tenant until all three are addressed.

See ADR-005.

---

## Open questions

- **Guapo store_id confirmed:** `store_01KG0VBTT0714XV2CCTEBRVC47` (from Supabase production). M0 backfill can proceed immediately — no store provisioning task needed.
- **Tenant onboarding:** how are new tenants provisioned today? Manual DB insert? Admin UI? Out of scope for Batch 2 but needs a non-code answer before onboarding a second tenant.
- **Public route Host mapping:** where does the `Host → store_id` lookup table live, and how is it managed? Decide before T003 (redirect middleware) and T004 (sitemap route).
- **Medusa admin cross-tenant risk:** Medusa's own admin UI (products, orders) is not scoped by `store_id` from MercFlow's side — is Medusa's own sales-channel/store scoping sufficient, or does this need a gating layer?
- **PO receipt → Medusa stock:** confirm in T012 task spec whether receipt event auto-adjusts Medusa `inventory_item` quantity, or MercFlow records only.
- **Global config table ownership:** which module owns `storefront_url` + org identity — seo-module or content-module globals? Decide before T006 (JSON-LD).
- **Starter template:** deferred to Batch 3. Not in Batch 2 scope.
- **Tech-debt MER-54–57:** triage into Batch 2 backlog or defer to Batch 3.
- **Multiple locales in feed:** which locale is exported as default in the shopping feed?
