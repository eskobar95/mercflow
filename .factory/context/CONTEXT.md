# CONTEXT — shared language

> Domain glossary for MercFlow. Updated during `/align`. Referenced by planning and harness skills.

---

## Planning intake (Notion)

**Meaning:** Notion (Issue Tracker: PRDs, Tasks, Sprints) is **read-only context** when planning or implementing in Factory. Use it to understand what humans have already planned — scope, priorities, MER-xx titles, sprint labels, PRD pages.

**Not:** The system of record during Factory execution. Do not block work on Notion Stage/Status updates, do not write back to Notion as part of `/to-prd`, `/to-backlog`, or `/run-sprint`, and do not treat missing Notion fields as blockers if Factory planning files are complete.

**Procedure:** At plan start, skim Notion (or a user-pasted export) once → distill into `.factory/context/PRD.md` + `.factory/planning/*` → all further work follows Factory commands only.

**Traceability (optional):** In `tasks.md`, note `Notion: MER-xx` or PRD URL in the task context block for human lookup. Factory task IDs (T001…) remain canonical for branches and harness.

---

## Factory execution layer

**Meaning:** After intake, **Factory owns the plan and the run**: `.factory/context/` (PRD, TECHSPEC, CONTEXT, ADR), `.factory/planning/` (milestones, sprints, tasks), `.factory/specs/`, harness `/run-sprint`, worktrees, PRs to `development`.

**Not:** A mirror that must stay in sync with Notion in real time.

**Flow:** `/align` → `/to-prd` (from Notion + repo docs) → `/to-backlog` → `/run-sprint S00x`. Legacy `/start-task <notion-url>` may still **fetch** Notion for context, but implementation follows Factory task files when they exist.

---

## Multi-tenant model (MercFlow)

**Meaning:** SaaS platform — one shared Medusa instance + one Neon database. Multiple shops (tenants) share the same backend. Row-level isolation via `store_id` on every MercFlow module table. Each tenant has their own admin access and their own storefront frontend (built with a MercFlow starter template).

**Not:** One Medusa instance per shop. Not Neon branching per tenant. Not Medusa core tables being isolated by MercFlow (Medusa uses its own sales-channel/region model for core entities).

**Tenant discriminator:** Medusa `store` entity ID (`store_id`). Every MercFlow-owned table has `store_id NOT NULL` + index. Every service method filters by `store_id`. Public routes (`/sitemap.xml`, `/robots.txt`, `/feed/*`) scope by `Host` header → store mapping.

**Constraint for all agents:** Every new module table must include `store_id` from day one AND enable RLS with a `store_id` policy (see ADR-005). Every service query must filter by `store_id`. Before closing any Batch 2 task: `rg "store_id" packages/*/src/models/` must match that model. Batch 1 tables need a backfill migration + RLS before Batch 2 ships.

**Starter template:** Deferred to Batch 3. Not in Batch 2 scope. Each tenant brings their own frontend and connects via `publishable_api_key` to the shared MercFlow backend.

**PayloadCMS (Guapo-specific):** Guapo uses PayloadCMS (`payload` schema in Supabase) as their current storefront CMS — ~150 tables for pages, articles, navigation, brands, homepage blocks, etc. This is Guapo-specific and NOT managed by MercFlow modules. Payload → MercFlow content-module migration is out of scope for Batch 2. Never add `store_id` or RLS to `payload.*` tables as part of MercFlow M0.

**Guapo store_id:** `store_01KG0VBTT0714XV2CCTEBRVC47` — use this for all M0 backfill migrations.

**See:** ADR-004

---

## Batch 1 (done on `development`)

**Meaning:** Admin UI redesign, page-based navigation, content-module (product/category rich text + SEO, articles, pages, globals, media), connector-module, subscription read-only view, design tokens, i18n content flow.

**Not:** Batch 2 SEO ops, feeds, POs, or inventory dashboard.

**Status (2026-06-04):** Foundation merged; no open PRs blocking Batch 2 planning. Sprint calendar in Notion lags actual delivery — ignore calendar dates for capacity; use Factory sprints (S001…) instead.

---

## Batch 2 (current focus)

**Meaning:** SEO infrastructure (redirects, sitemap, robots, JSON-LD, OG, canonical, Nordic slugs), Google Shopping feed, inventory/PO/supplier flows, improved order admin — per `.cursor/docs/PRD-batch2.md`.

**Not:** Payments (Batch 3), GLS labels, blog/page builder, dark mode, Amazon/Pricerunner feeds.

**Modules:** `seo-module`, `feed-module`, `inventory-module` (see ADR-003). Implementation order follows PRD-batch2 §5 (slug before redirects/feed).

---

## SEO module

**Meaning:** `@mercflow/seo-module` — redirects table, sitemap/robots config, slug utility, public `GET /sitemap.xml` and `GET /robots.txt`.

**Not:** Product `seo_title` / `description_rich` (content-module). Not shopping XML (feed-module).

---

## Feed module

**Meaning:** `@mercflow/feed-module` — `mercflow_feed_config`, `GET /feed/google-shopping.xml`, admin validation report.

**Not:** Meta/Google OAuth or Merchant Center UI — only feed output and admin config.

---

## Inventory module

**Meaning:** `@mercflow/inventory-module` — suppliers, purchase orders, receipts, inventory dashboard aggregates, low-stock thresholds.

**Not:** Medusa core order fulfillment engine. PO **receipt** may update Medusa stock only when the implementing task explicitly designs that behavior; UI must show MercFlow PO history vs Medusa stock clearly.

---

## Medusa core vs MercFlow content

**Meaning:** Titles, handles, slugs (Medusa), translations, and Medusa description fields → Medusa admin/APIs. Rich text, MercFlow SEO fields, gallery, category banner → content-module Content tab.

**Not:** Duplicating the same semantic field in two systems.

**Locales:** From store/Medusa (`GET /admin/locales`); autosave before locale switch in content UI.

---

## Factory sprint ID

**Meaning:** Harness sprint labels in `.factory/planning/sprints.md` — `S001`, `S002`, … — independent of Notion sprint names/dates.

**Not:** The same as Notion "Sprint 2" calendar. Map optionally in task context (`Notion sprint: …`).

---

## Public storefront routes (Batch 2)

**Meaning:** Backend-served routes consumed by storefront: sitemap, robots, feed XML, JSON-LD/metadata APIs. Must return correct status codes, content types, and cache headers.

**Not:** Implemented only in admin-ui without backend routes.

---

## MercFlow

**Meaning:** An opinionated Medusa v2 distribution built from MercFlow-owned packages and app-level integration points. Not a fork of Medusa — it wraps it.

**Not:** A standalone e-commerce platform or a Guapo-specific product. Guapo is the first internal validation case only.

**Example scenario:** When a new connector (Stripe, Shipmondo) is added, it belongs in `packages/connector-module`, not in `apps/backend`.

---

## Content module

**Meaning:** `@mercflow/content-module` — the MercFlow-owned Medusa module responsible for CMS data: product/category rich text + SEO, articles, pages, page blocks, redirects, globals, media, product attributes.

**Not:** Medusa's own product title/description/slug fields. Those stay in Medusa core UI and APIs.

**Example scenario:** `description_rich` is a content-module field. `title` and `handle` are Medusa core fields. Never duplicate them.

---

## Connector module

**Meaning:** `@mercflow/connector-module` — stores encrypted third-party credentials and config (Stripe, Shipmondo, Plunk, GTM). Exposes admin + store routes for each connector.

**Not:** A payment provider or shipping carrier implementation. It stores and manages config; checkout wiring belongs in the storefront.

---

## Subscription module

**Meaning:** `@mercflow/subscription-module` — new Medusa module (emerged in Sprint 3, MER-43) for `subscription` table: customer subscriptions with status, cycle, renewal, discount. Read-only admin view only in v1; no state machine changes.

**Not:** A billing engine. MercFlow records the subscription state; Stripe handles payments.

---

## Development branch

**Meaning:** The active integration branch. All feature PRs must target `development`. Only Tech Lead promotes `development → staging → main`.

**Not:** A branch agents merge to directly. Always PR → development.

---

## Sprint plan vs. actual velocity

**Meaning:** The sprint calendar (Sprint 1: 17 May – 7 Jun, Sprint 2: 8 Jun – 5 Jul, Sprint 3: 6 Jul – 16 Aug, Sprint 4: 17 Aug – 13 Sep) was created as a planning artifact. Actual agent velocity has been significantly higher — Sprint 2 and Sprint 3 tasks were completed during Sprint 1.

**Not:** A hard deadline. Sprints are time-boxes for planning, not fixed delivery windows.

**Implication:** Sprint task assignments should be re-evaluated when planning next sprint to avoid sprint-calendar drift.

---

## Vertical slice

**Meaning:** One unit of deliverable work that cuts through DB → Service → API → UI → Tests for a single user-facing outcome. Always committed per layer, always reviewed as a whole slice.

**Not:** A horizontal layer task ("add all DB migrations first, then all services"). Horizontal layers cause merge blockers.

---

## Hooks (Cursor agent hooks)

**Meaning:** Fail-closed shell guards before agent commands: branch policy (`guard-branches.sh`) and secret patterns (`guard-secrets.sh`). Scripts live under `.factory/kit/hooks/`; wire via Cursor Settings → Hooks (or symlink `.cursor/hooks` → kit when not conflicting with a tracked `.cursor/hooks` tree on `development`).

**Not:** Optional in production agent runs — if hooks are configured, scripts must exist and be executable (`chmod +x`).

---

<!-- Add terms below during /align sessions -->
