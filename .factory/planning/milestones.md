# Milestones — MercFlow

> Ordered deliveries. Each milestone groups one or more sprints.
> Updated: 2026-06-04 (S003 merged — PR #60; see `.factory/logs/sprints/S003-closeout-2026-06-04.md`)
> Updated: 2026-06-04 (synced with `development`; see `.factory/logs/milestone-reviews/M000-2026-06-04.md`)
> Updated: 2026-06-09 (M007 added — Medusa Fork Setup; ADR-007 accepted)
> Updated: 2026-06-10 (M011 added — Fulfillment Packaging Persistence; T054, T055 / S022)
> Updated: 2026-06-10 (M008–M010 marked done; S019–S021 + PR #93 merged)
> Updated: 2026-06-10 (S018 merged to `development` — PRs #86 `6d89f1b`, #87 `b0ade41`; M009 ready for milestone review)
> Updated: 2026-06-11 (M013, M014, M015 added — `/to-prd` session)

---

## Vision

MercFlow becomes a complete SaaS Medusa distribution: multiple shops run on one shared backend, each fully isolated by `store_id`. Every shop gets auto-maintained SEO infrastructure (redirects, sitemap, robots, structured data, Nordic slugs), a validated shopping feed for Google/Meta/TikTok, full purchase order and inventory management, and an improved order admin — all without touching code.

---

## Milestone overview

| ID | Title | Outcome | Depends on | Status |
|----|-------|---------|------------|--------|
| M000 | Tenancy Foundation | SaaS isolation safe; ready for second tenant | — | done (yellow: Neon IP HITL open) |
| M001 | SEO Infrastructure | Redirects, sitemap, robots, slug utility live | M000 | done |
| M002 | SEO Metadata | JSON-LD, OG, canonical on all pages | M001 | done (yellow: category canonical UI deferred) |
| M003 | Shopping Feed | Google/Meta/TikTok feed live and validated | M000 | done |
| M004 | Inventory & Purchase Orders | Full PO lifecycle + inventory dashboard | M000 | done |
| M005 | Improved Order Flow | Faster order processing + pick list | M000 | done |
| M006 | Production Infrastructure | MercFlow kører på Hetzner; Traefik, Redis, Sentry, provisioning | M005 | done |
| M007 | Medusa Fork Setup | Medusa som lokale workspace packages; `store_id` på core tables; tenant wiring; dashboard fjernet | M006 | done |
| M008 | Metafields | Tenant-defined metafield definitions + values; standard library; admin UI; store API | M007 | done |
| M009 | Product Form Polish | Unsaved state; progressive variant UX; SEO lazy preview; physical/digital toggle; product dimensions | M008 | done |
| M010 | Fulfillment Intelligence | Merchant packaging catalog; bin-packing suggestion on order fulfillment; Shipmondo dimensions auto-fill | M009 | done |
| M011 | Fulfillment Packaging Persistence | Confirmed packaging per fulfillment persisted and restored on order detail | M010 | done |
| M012 | Notification System | Transactional email on Amazon SES; per-tenant domain identity; React Email templates; BullMQ delivery queue; admin domain + branding + delivery history | M011 | planned |
| M013 | Admin Shell & Navigation | Unified sidebar with grouped hierarchy; Settings sub-sections; breadcrumbs; collapse/drawer on narrow viewports | M012 | planned |
| M014 | Platform Console | Internal operator tool at `console.mercflow.shop`; tenant provisioning; BullMQ queue monitor; cross-tenant email health; system metrics; audit log | M013 | planned |
| M015 | Subscription System | Product subscriptions with automatic renewal via BullMQ + Stripe; single-tier Customer Club with member pricing (per-product + fallback %) | M014 | planned |

---

## M000 — Tenancy Foundation

**Outcome:** All MercFlow-owned tables have `store_id NOT NULL` + RLS. Guapo backfilled. Rate limiting active on public routes. Safe to onboard a second tenant.

**Progress (2026-06-04):** S001 done — T001 (#50), T002 (#52), T003 (#53). `/milestone-review M000` recorded (yellow): [review log](../logs/milestone-reviews/M000-2026-06-04.md). **Open:** Neon IP allowlist HITL — [checklist](../logs/hitl/M000-neon-allowlist.md). `shipmondo_enabled_products` backfill deferred (table optional / prod-only; not in T001 migration).

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S001 | Backfill + RLS + rate limiting | T001, T002, T003 |

**Dependencies:** none — this is the root blocker.

**Guapo store_id:** `store_01KG0VBTT0714XV2CCTEBRVC47`

**Tables in scope (medusa schema):**

*MercFlow Batch 1 (10):* `article`, `category_content`, `product_content`, `cms_redirect`, `cms_global`, `media_asset`, `page`, `page_block`, `page_version`, `product_attribute`, `product_attr_link`

*Guapo-custom (7):* `brand`, `product_product_brand_brand`, `product_review`, `product_review_image`, `product_review_response`, `product_review_stats`, `guapo_free_shipping_setting`, `shipmondo_enabled_products`

Note: `payload.*` schema (PayloadCMS, Guapo storefront) is excluded — it is Guapo-specific, single-tenant by nature, not managed by MercFlow.

**Definition of done:**
- [x] All 17+ tables have `store_id NOT NULL` + composite index (11 MercFlow + 6 Guapo-custom in migration; `shipmondo_enabled_products` follow-up if present in prod)
- [x] All 4 broken unique indexes rebuilt with `store_id`
- [x] RLS enabled + `tenant_isolation` policy on all MercFlow tables
- [x] Rate limiting returns `429` after threshold on public + store routes
- [x] `pnpm migration:run` clean on local (inferred; PR #50/#52 merged, tenancy tests green)
- [x] `/milestone-review M000` recorded — **yellow** until Neon HITL closed
- [ ] Neon IP allowlist (T003 HITL) — human; see [hitl/M000-neon-allowlist.md](../logs/hitl/M000-neon-allowlist.md)

---

## M001 — SEO Infrastructure

**Outcome:** Slug changes auto-create 301 redirects. Sitemap and robots.txt fully admin-controlled. Nordic characters produce clean URLs.

**Progress (2026-06-04):** S002 merged PR #55 (`b378e22`). **S003 merged PR #60 (`b2e1d90`)** — sitemap, robots, T008 Host→store middleware, admin SEO settings, cache invalidation. Closeout: [S003-closeout](../logs/sprints/S003-closeout-2026-06-04.md).

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S002 | seo-module + slug + redirects | T004, T005, T006, T007 |
| S003 | Sitemap + robots + public tenant routing | T008, T009, T010, T011, T012 |

**Dependencies:** M000

**Definition of done:**
- [x] `GET /sitemap.xml` and `GET /robots.txt` return tenant-scoped data based on `Host` header (S003, PR #60)
- [x] Slug change on product → 301 redirect auto-created (S002, PR #55)
- [x] Nordic slug strategy configurable per tenant in Settings (S002)
- [x] All public SEO/feed routes return `404` if tenant not resolved (T008 middleware)
- [ ] `/milestone-review M001` green (schedule after S004 or when M001 scope complete)

---

## M002 — SEO Metadata

**Outcome:** Structured data (JSON-LD), Open Graph, and canonical tags generated automatically on all product and category pages.

**Progress (2026-06-04):** **S004 merged PR #62 (`e9f0c6f`)** — org/JSON-LD settings, store `/store/seo/*` APIs, publishable-key tenant binding, canonical override on content. Yellow: category canonical admin UI + conflict warning deferred.

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S004 | JSON-LD + OG + canonical + global config | T013, T014, T015, T016 |

**Dependencies:** M001 (seo-module foundation, tenant resolution)

**Definition of done:**
- [x] JSON-LD `Product` + `BreadcrumbList` + `Organization` + `WebSite` blocks generated per tenant
- [x] OG tags populated from SEO fields with fallbacks
- [x] Canonical auto-set; manual override works (product admin UI; category UI deferred)
- [x] No cross-tenant org data in any response (store routes bind publishable key / host)
- [ ] `/milestone-review M002` green

---

## M003 — Shopping Feed

**Outcome:** Auto-maintained Google Shopping XML feed per tenant. Validated, tenant-scoped, cache-invalidated on catalogue changes.

**Progress (2026-06-04):** S005 merged — PR #54, #57, #58. Feed routes use shared T008 middleware via seo-module (S003 merged PR #60).

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S005 | feed-module + XML + admin | T017, T018, T019 |

**Dependencies:** M000 (can run in parallel with M001 after M000)

**Definition of done:**
- [x] `GET /feed/google-shopping.xml` tenant-scoped by `Host` header (T008 + feed middleware shim)
- [ ] Feed invalidated within 30s of catalogue change
- [ ] Validation report flags missing required fields
- [ ] No cross-tenant products in any feed response
- [ ] `/milestone-review M003` green

---

## M004 — Inventory & Purchase Orders

**Outcome:** Full PO lifecycle (draft → ordered → received) with supplier register. Unified inventory dashboard with live available counts.

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S006 | inventory-module + suppliers + PO create | T020, T021, T022 |
| S007 | PO receive + inventory dashboard | T023, T024 |

**Dependencies:** M000

**Definition of done:**
- [ ] Admin can create PO, move through status flow, receive (partial or full)
- [ ] `Available = stocked - reserved` is live, never cached
- [ ] `Incoming` column reflects open POs
- [ ] Low-stock threshold configurable per variant
- [ ] PO-Medusa stock boundary explicit in UI and API
- [ ] `/milestone-review M004` green

---

## M005 — Improved Order Flow

**Outcome:** Faster order processing: status badges, internal notes, timeline, bulk actions, printable pick list.

**Progress (2026-06-04):** S008 merged via PR #56 (`fec137f`) — order list filters/bulk actions, internal notes, pick list.

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S008 | Order list + detail + pick list | T025, T026 |

**Dependencies:** M000 (can run in parallel with M001–M004)

**Definition of done:**
- [ ] Order list has status badges, date filter, bulk fulfillment-ready action
- [ ] Order detail: notes (internal), timeline, no modal navigation
- [ ] Pick list generates and prints for today's ready-to-ship orders
- [ ] `/milestone-review M005` green

---

## Sprint ↔ task mapping

See `.factory/planning/sprints.md` and `.factory/planning/tasks.md`.

---

---

## M006 — Production Infrastructure

**Outcome:** MercFlow runs reproducibly on Hetzner. Traefik routes per-tenant domains with SSL. Redis, Sentry, BetterStack, and automated S3 backups are active. A new tenant can be provisioned in under 5 minutes via CLI script.

**PRD:** `.factory/context/PRD-infra.md`
**ADR:** ADR-006

**Sprints in this milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S009 | Full infra stack + observability + provisioning + API hardening | T027, T028, T030, T031, T032 (T029 cancelled) |

**Dependencies:** Batch 2 modules stable on `development` (M000–M005 done)

**Definition of done:**
- [ ] Docker Compose stack running on Hetzner (Traefik + Medusa backend + worker + Redis + Portainer)
- [ ] Backup: Neon daily snapshots + Hetzner Server Backup enabled (see `infra/RUNBOOK.md`)
- [ ] SSL cert auto-provisioned for configured domain via Let's Encrypt
- [ ] Sentry errors tagged with `store_id`; BetterStack uptime checks active per tenant domain
- [ ] `pnpm provision-tenant` creates Store + Sales Channel + Publishable Key + Admin user in < 5 min
- [ ] Neon allowed-IP updated to Hetzner VPS egress IP (closes T003 HITL from M000)
- [ ] `infra/RUNBOOK.md` complete — second person can operate without the original author
- [ ] All MercFlow list endpoints enforce max 100 records — no unbounded queries (T031)
- [ ] All MercFlow store routes accessible under `/v1/` prefix; old paths 301-redirect (T032)
- [ ] `/milestone-review M006` green

---

---

## M007 — Medusa Fork Setup

**Outcome:** Medusa v2.14.1 kildekode lever som lokale pnpm workspace packages i monorepoet. Alle MercFlow-pakker resolver `@medusajs/*` fra forken — ikke npm. `store_id NOT NULL` tilføjet til Medusa core tables med RLS policies. `TenantIsolationSubscriber` registreret på alle module EMs ved startup. Medusa dashboard fjernet; `admin-ui` er den eneste admin-grænseflade. Zod harmoniseret til én version. `pnpm typecheck`, `pnpm build`, `pnpm test` grønne.

**PRD:** `.factory/context/PRD-fork-setup.md`
**ADR:** ADR-007

**Sprints i dette milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S010 | Fork workspace + shared package | T033, T034 |
| S011 | Dashboard removal + core table store_id | T035, T036 |
| S012 | Startup tenant wiring | T037 |

**Dependencies:** M006 (done)

**Definition of done:**
- [ ] `pnpm install` — nul npm fetches for `@medusajs/*` (runtime)
- [ ] `pnpm typecheck` passes med nul nye fejl
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes inkl. `test-rls-medusa.ts`
- [ ] `admin-ui → seo-module` afhængighed fjernet (`pnpm why @mercflow/seo-module --filter @mercflow/admin-ui` = 0)
- [ ] Zod: én version i lockfile
- [ ] `store_id NOT NULL` + RLS på alle 6 M0 core tables
- [ ] `TenantIsolationSubscriber` registreret og verificeret via integration test
- [ ] `@medusajs/dashboard` fjernet fra `apps/backend`
- [x] `/milestone-review M007` grøn

---

## M008 — Metafields

**Outcome:** Merchants can create tenant-scoped metafield definitions and fill values on products and categories from the admin UI — no code required. Standard library per vertical (skincare, fashion) activatable in one click. Storefront fetches metafields via publishable API key. Two-tier form UX: `is_primary` fields always visible; secondary as expandable chips.

**PRD:** `.factory/context/PRD-metafields.md`
**ADR:** ADR-008

**Sprints in this milestone:**

| Sprint | Goal | Tasks | Status |
|--------|------|-------|--------|
| S013 | metafield-module engine: definitions + values | T038, T039 | done |
| S014 | Standard library + activation + store API + category constraints | T040, T043, T044 | done |
| S015 | Admin UI: Custom Data settings + product form metafields | T041, T042 | done |
| S016 | Polish: standard library browse dialog | T045 | done |

**Dependencies:** M007 (done)

**Definition of done:**
- [x] `metafield-module` definitions + values engine with RLS (S013 — PR #77, #76)
- [x] Standard library seeds + activation API (T040 — PR #78)
- [x] Store API `GET /store/v1/metafields` with cross-tenant isolation (T044 — PR #80)
- [x] Category form metafields + category-constraint filter (T043 — PR #81)
- [x] Custom Data settings page `/settings/custom-data` (T041 — PR #79)
- [x] Product form metafields two-tier UI + batch save (T042 — PR #82)
- [x] `is_primary` always visible; secondary as `+ chip` pattern
- [x] Standard library browse dialog in settings (T045 / S016 — PR #83)
- [x] Zero cross-tenant metafield rows (test-covered on store API)
- [ ] Guapo brand + ingredients migrated to metafields (deferred — post-M008)
- [ ] `/milestone-review M008` grøn (harness housekeeping)

**Merged to `development` (2026-06-10):**

| PR | Task | Merge |
|----|------|-------|
| #76 | T039 metafield values engine | `8df5999` |
| #77 | T038 metafield definitions engine | `f64238a` |
| #78 | T040 standard library | `0c9a02c` |
| #80 | T044 store API metafields | `e6d6eb8` |
| #81 | T043 category form metafields | `43d3cb4` |
| #79 | T041 Custom Data settings UI | `34bc047` |
| #82 | T042 product form metafields | `80b4855` |
| #83 | T045 standard library browse dialog | `93bc552` |

---

## M009 — Product Form Polish

**Outcome:** Produktformularen er hurtigere og mere fejlfri at bruge. Merchants mister ikke data ved navigation. Varianter oprettes med ét enkelt CTA. SEO preview er live og kontekstuel. Fysiske produktmål (L×W×H) er tilgængelige — prerequisite for M010.

**PRD:** `.factory/context/PRD-product-form-polish.md`

**Sprints i dette milestone:** S017, S018

**Sprints in this milestone:**

| Sprint | Goal | Tasks | Status |
|--------|------|-------|--------|
| S017 | Unsaved state indicator + SEO lazy preview | T046, T048 | done |
| S018 | Variant UX + physical product toggle + dimensions | T047, T049 | done |

**Dependencies:** M008

**Definition of done:**
- [x] Unsaved state indicator på page title + `beforeunload` guard (T046 / S017 — PR #85)
- [x] Varianter: enkelt CTA → grid vises kun efter option er tilføjet (T047 / S018 — PR #86)
- [x] SEO preview: tom tilstand = hjælpetekst; fyldt tilstand = live snippet (T048 / S017 — PR #84)
- [x] "Physical product" toggle kollapser shipping-felter (T049 / S018 — PR #87)
- [x] Dimension-felter (L/W/H/weight) synlige og persisterede per variant (T049 / S018 — PR #87)
- [x] `pnpm react-doctor:admin-ui` 0 issues (S017–S018 PR CI)
- [ ] `/milestone-review M009` grøn (harness housekeeping)

**Merged to `development` (2026-06-10, S017):**

| PR | Task | Merge |
|----|------|-------|
| #84 | T048 SEO lazy preview + character counters | `622ad70` |
| #85 | T046 unsaved state indicator + beforeunload guard | `f71c460` |

**Merged to `development` (2026-06-10, S018):**

| PR | Task | Merge |
|----|------|-------|
| #86 | T047 progressive variant options CTA | `6d89f1b` |
| #87 | T049 physical product toggle + shipping dimensions | `b0ade41` |

---

## M010 — Fulfillment Intelligence

**Outcome:** Merchant definerer deres pakke-katalog (boks-størrelser, kuverter). Under ordrebehandling foreslår systemet den optimale emballage baseret på produktdimensioner. Valgt emballage auto-udfylder Shipmondo ved label-generering.

**PRD:** `.factory/context/PRD-fulfillment-intelligence.md`

**Sprints in this milestone:**

| Sprint | Goal | Tasks | Status |
|--------|------|-------|--------|
| S019 | packaging-module foundation | T050 | done |
| S020 | Settings packaging UI + fulfillment widget | T051, T052 | done |
| S021 | Shipmondo label autofill (HITL) | T053 | done |

**Dependencies:** M009 (produktdimensioner skal være i formularen)

**Definition of done:**
- [x] Merchant kan oprette og administrere pakke-katalog i Settings (T051 / PR #89)
- [x] Order fulfillment viser foreslået emballage med utilisation-indikator (T052 / PR #90)
- [x] Merchant kan acceptere eller override forslag (T052 — component state; persistence deferred to M011 OQ-01)
- [x] Shipmondo label-generering præ-udfylder dimensioner fra valgt emballage (T053 / PR #91; HITL + PR #93)
- [x] Zero cross-tenant packaging data (test-covered — packaging-module tenancy tests)
- [ ] `/milestone-review M010` grøn (harness housekeeping)

**Merged to `development` (2026-06-10):**

| PR | Task | Merge |
|----|------|-------|
| #88 | T050 packaging-module | merged |
| #89 | T051 packaging settings UI | merged |
| #90 | T052 fulfillment packaging widget | merged |
| #91 | T053 Shipmondo label autofill | merged |
| #93 | T053 follow-up local E2E fixes | `b891b26` |

---

## M011 — Fulfillment Packaging Persistence

**Outcome:** Merchant's confirmed packaging choice on an order fulfillment survives page reload and is available as the default for Shipmondo label generation — without touching Medusa core fulfillment entities.

**PRD:** `.factory/context/PRD-fulfillment-intelligence.md` (OQ-01)

**Sprints in this milestone:**

| Sprint | Goal | Tasks | Status |
|--------|------|-------|--------|
| S022 | Persist + restore confirmed packaging per fulfillment | T054, T055 | done |

**Dependencies:** M010 (packaging catalog, suggestion widget, label flow)

**Definition of done:**
- [x] `shipment_packaging` join table with RLS (`fulfillment_id`, `packaging_type_id`, `dimensions_snapshot_json`)
- [x] Admin API upsert/read per fulfillment
- [x] Order detail restores confirmed packaging on reload (override wins over fresh suggestion)
- [x] Generate label uses persisted `packaging_type_id` when present
- [x] Zero cross-tenant rows (integration test)
- [x] `packages/packaging-module/README.md` updated with field definitions + API

**Merged to `development`:** PR #94 (`2662cc9`), PR #95 (`115d3fa`) — 2026-06-10

---

---

## M013 — Admin Shell & Navigation

**Outcome:** Merchants can find any feature in ≤ 2 clicks. The sidebar groups features into clear domains (Orders, Products, Customers, Content, Settings). Settings has a landing page with sub-section cards. Breadcrumbs on all detail pages. Sidebar collapses to icon-only on medium viewports and to a drawer on mobile.

**PRD:** `.factory/context/PRD-admin-shell-navigation.md`

**Sprints in this milestone:** TBD — awaiting `/to-backlog`

**Dependencies:** M012 (Settings → Email must exist before navigation reorganisation)

**Definition of done:**
- [ ] Sidebar groups: Home, Orders, Products, Categories, Inventory, Customers, Content, Settings
- [ ] Settings landing page with cards for all sub-sections (General, Email, Shipping, Payments, Custom Data, SEO, Integrations, Store details)
- [ ] Breadcrumbs on all detail pages (Order #1234, Product name, etc.)
- [ ] Sidebar collapse persisted in localStorage; icon-only mode shows tooltips
- [ ] Mobile drawer at < 768px viewport
- [ ] `pnpm react-doctor:admin-ui` 0 issues
- [ ] `/milestone-review M013` grøn

---

## M014 — Platform Console

**Outcome:** MercFlow team has an internal operator tool at `console.mercflow.shop`. Operators can provision new tenants, monitor all BullMQ queues (with DLQ drill-down and manual retry), view cross-tenant email delivery health, check Hetzner/Neon/Redis system metrics, and see a full audit log of operator actions. Access restricted to `@mercflow.shop` Google accounts.

**PRD:** `.factory/context/PRD-platform-console.md`
**ADR:** ADR-010 (BullMQ event bus — covers queue observability foundation)

**Architecture:** Separate React + Vite app at `apps/platform-console/`. Backend `/platform/` API routes bypass tenant RLS.

**Sprints in this milestone:** TBD — awaiting `/to-backlog`

**Dependencies:** M013 (navigation patterns established), M012 (BullMQ + notification infrastructure active)

**Definition of done:**
- [ ] `apps/platform-console/` deploys to `console.mercflow.shop` with IP allowlist
- [ ] Google OAuth restricts access to `@mercflow.shop` domain
- [ ] Tenant list + provision form + suspend action functional
- [ ] All BullMQ queues visible with job counts, DLQ size, failed job detail, manual retry
- [ ] Cross-tenant email delivery history searchable by email / order ID
- [ ] System metrics: Hetzner CPU/RAM, Neon connections, Redis memory — refresh ≤ 30s
- [ ] `platform_audit_log` records all operator actions
- [ ] `/milestone-review M014` grøn

---

## M015 — Subscription System

**Outcome:** Merchants can offer product subscriptions (weekly/bi-weekly/monthly/quarterly) with automatic renewal via BullMQ + Stripe. A single-tier Customer Club is purchasable as a Stripe subscription — club members see member prices (per-product explicit price or fallback % discount). Merchants manage subscriptions and club configuration from Store Admin.

**PRD:** `.factory/context/PRD-subscription-system.md`

**Architecture:** New `packages/subscription-module` (DML). New `subscription-renewal` BullMQ queue in `apps/worker`. Pricing via Medusa `price_list` + `customer_group`.

**Sprints in this milestone:** TBD — awaiting `/to-backlog`

**Dependencies:** M014 (BullMQ + Stripe infrastructure patterns), M012 (notification emails for subscription events)

**Definition of done:**
- [ ] Customer can subscribe to a product on product page (interval selector)
- [ ] Renewal worker processes due subscriptions hourly; idempotency key prevents double-charge
- [ ] Merchant can pause/cancel/resume any subscription from Store Admin
- [ ] Club membership purchasable via Stripe; activates `club_members` customer group within 30s
- [ ] Per-product member price editable in Product → Pricing tab
- [ ] Club fallback discount % configurable in Settings → Subscriptions
- [ ] Stripe webhook HMAC verification on all subscription webhook handlers
- [ ] `packages/subscription-module/README.md` complete
- [ ] `/milestone-review M015` grøn

---

## Dependency graph

```mermaid
flowchart LR
  M000 --> M001
  M000 --> M003
  M000 --> M004
  M000 --> M005
  M001 --> M002
  M005 --> M006
  M006 --> M007
  M007 --> M008
  M008 --> M009
  M009 --> M010
  M010 --> M011
  M011 --> M012
  M012 --> M013
  M013 --> M014
  M014 --> M015
```

---

## M012 — Notification System

**Outcome:** Every order confirmation, shipping update, and cancellation is reliably delivered via Amazon SES from the merchant's own domain (`noreply@merchant.com`). Merchants configure sending domain (with DKIM/SPF records), email branding variables (logo, color, reply-to), and view delivery history with resend capability in admin.

**PRD:** `.factory/context/PRD-notification-system.md`
**ADR:** ADR-009

**Sprints i dette milestone:**

| Sprint | Goal | Tasks |
|--------|------|-------|
| S023 | notification-module foundation: models, migrations, RLS, service, admin API | T056 |
| S024 | SES domain identity (HITL) + BullMQ worker infrastructure | T057, T058 |
| S025 | order-confirmation template + subscriber + domain admin UI | T059, T061 |
| S026 | Remaining templates + branding UI + delivery history UI | T060, T062, T063 |

**Dependencies:** M011

**Infrastructure prerequisite (HITL):** MercFlow team verifies `mail.mercflow.com` in AWS SES as fallback sending domain before M012 ships. Tracked as OQ-04 in PRD.

**Definition of done:**
- [ ] Order confirmation email sent within 30s of `order.placed` (p95)
- [ ] Per-tenant SES domain identity setup flow works end-to-end (DNS records shown in admin)
- [ ] BullMQ retry + DLQ active; BetterStack alert on DLQ size > 0
- [ ] Idempotency: duplicate `order.placed` events never send duplicate emails
- [ ] Zero cross-tenant emails (integration test)
- [ ] Admin: domain setup tab, branding tab with preview, delivery history with resend
- [ ] `packages/notification-module/README.md` complete
- [ ] `/milestone-review M012` grøn
