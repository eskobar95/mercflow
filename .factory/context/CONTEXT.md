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

**Meaning:** SaaS platform — one shared Medusa instance + one Neon database. Multiple shops (tenants) share the same backend. Row-level isolation via `store_id` on **all tables** — both MercFlow module tables and Medusa core tables (via the fork). Each tenant has their own admin access and their own storefront frontend.

**Not:** One Medusa instance per shop. Not Neon branching per tenant.

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

**Meaning:** A commerce platform built on a **fork of Medusa v2.14.1**. MercFlow owns the full codebase — core tables, migrations, module services, admin UI. MercFlow-specific logic lives in `packages/` (modules) and `apps/backend`. Medusa upstream updates are cherry-picked manually.

**Not:** A Medusa distribution that wraps an unmodified upstream. Not a Guapo-specific product — Guapo is the first internal tenant only.

**Why fork (ADR-007):** Multi-tenant RLS requires `store_id` on Medusa core tables (`product`, `order`, `customer`, etc.), and we want direct access to modify Medusa's workflows, services, and notification layer for multi-tenant reliability. A June 2026 POC confirmed the RLS mechanism works end-to-end.

**Fork structure:** Medusa source packages added as pnpm workspace packages inside the existing MercFlow monorepo (`packages/medusa-core/` or similar). `apps/backend` points to local workspace packages instead of npm. No separate repository.

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

## Compute hosting (Hetzner)

**Meaning:** MercFlow's production compute runs on a **Hetzner VPS**. The backend, workers, Redis, Traefik, and Portainer all live here. Docker Compose is the deployment unit.

**Not:** Railway (referenced as a planning artefact in ADR-005 — superseded by ADR-006). Not a managed cloud (GCP/AWS/Azure). Not per-tenant VMs.

**Database:** Neon (managed PostgreSQL, separate from Hetzner) — see ADR-004. Neon connects to Hetzner via allowed-IP policy (interim) → Neon Private Link (target).

**See:** ADR-006

---

## Infrastructure stack (production)

**Meaning:** The set of services that make up the MercFlow production environment on Hetzner:

| Component | Role |
|---|---|
| Docker Compose | Reproducible deployment unit for all services |
| Traefik | Reverse proxy, SSL (Let's Encrypt), per-tenant domain routing |
| Redis | Medusa event bus + rate-limiting counters (ADR-005) |
| Neon | Managed PostgreSQL — row-level isolated, shared across tenants |
| Sentry | Error tracking, tagged by `store_id` (tenant) |
| BetterStack | Log aggregation + uptime checks per tenant domain |
| Hetzner Object Storage (S3) | Media assets + automated daily pg_dump backups |
| Portainer CE | Container dashboard — no SSH required for ops |

**Not:** Per-tenant Docker stacks. Not a Kubernetes cluster. Not Railway. Not self-hosted PostgreSQL.

**See:** ADR-006

---

## Tenant onboarding (MVP)

**Meaning:** **Assisted onboarding** — MercFlow team runs a provisioning script for each new customer. The script accepts `shop_name`, `domain`, `admin_email` and creates: Medusa Store, Sales Channel, Publishable API Key, Admin user. Credentials are sent manually to the customer.

**Not:** Self-service signup. Not Stripe billing (post-MVP). Not an onboarding UI in the admin. Not automatic — a human triggers it.

**Target time:** Under 5 minutes per new tenant.

**Post-MVP:** Self-service signup page + automated provisioning + Stripe subscription billing. Tracked as a separate PRD (not yet written).

---

## Storefront kit (deferred)

**Meaning:** A Next.js template repo that tenants (or MercFlow team on their behalf) deploy to Cloudflare Pages / Vercel. Connects to the shared Medusa backend via `publishable_api_key`. Each tenant gets their own deployment with their own domain.

**Not:** In scope until the production infrastructure (ADR-006) and tenant onboarding MVP are complete.

**Status:** Deferred — post-infrastructure. No code to be written until backend infra is stable.

---

## Metafields

**Meaning:** Dynamic, tenant-defined custom fields on MercFlow entities (initially categories and products). A tenant-admin creates definitions (name, type, namespace) in their admin. MercFlow ships pre-defined "standard definitions" per industry vertical (skincare, fashion, etc.) that a tenant can activate as a starting point — identical to Shopify's metafield standard definitions model.

**Types to support (initial):** text, number, boolean, date, list (of text), reference (to product/category). Rich text as a separate type once base is stable.

**Not:** Fixed fields hardcoded by MercFlow per entity. Not content-module's `description_rich` / `seo_title` (those are MercFlow-owned structural fields, not tenant-defined). Not a full CMS schema builder — definitions are flat key-value extensions, not nested content types.

**Entities in scope (initial):** `product_category`, `product`. Customer/order metafields deferred.

**Guapo legacy note:** The `brand` and `product_product_brand_brand` tables in Neon are Guapo-specific legacy tables copied from an old Medusa extension — not a MercFlow module. They will be superseded by the metafield system (brand as a single-select or reference metafield on products). Do not model brand as a first-class MercFlow entity.

**Standard definitions:** MercFlow maintains a curated library of definitions per vertical (skincare: `skin_type`, `active_ingredients`, `spf`; fashion: `material`, `fit_type`, `wash_instructions`). Tenant can activate, ignore, or extend with own definitions.

**Storage:** Definitions table (per tenant) + values table (per entity instance). Both scoped by `store_id` with RLS.

**See:** ADR-007 (fork), content-module (structural fields are separate)

---

## Notification system (MercFlow-owned)

**Meaning:** `@mercflow/notification-module` — MercFlow's own transactional email stack built on Amazon SES. Each tenant gets a **per-tenant SES domain identity** (`noreply@merchant.com`). Medusa event subscribers enqueue BullMQ jobs (`mercflow:notifications`). A notification worker renders React Email templates with per-tenant variables (logo, brand color, store name) and calls SES. Delivery logged to `email_deliveries` table with status and SES message ID.

**Not:** Medusa's `notification-module` or `notification-provider` pattern. Not Resend (SaaS) or Postmark. Not marketing/bulk email — transactional only. Not per-tenant sub-accounts in AWS — one SES account, one domain identity per tenant.

**Templates (v1):** `order-confirmation`, `shipping-update`, `order-cancellation`, `customer-welcome` — all React Email (JSX → HTML). MercFlow owns template structure; merchants configure variables only.

**Fallback:** Before tenant domain is verified (DNS propagation), emails sent from `noreply@mail.mercflow.shop` with admin warning. Never queued and held — order confirmations must send immediately.

**Retry:** BullMQ — 3 attempts, exponential backoff (30s → 5m → 30m). Permanently failed jobs → dead-letter queue `mercflow:notifications:dead`. BetterStack alert on DLQ size > 0.

**Idempotency:** Job ID = `{tenantId}:{templateKey}:{entityId}` — duplicate events never send duplicate emails.

**Admin:** Settings → Email — domain setup (DNS records), branding variables (logo, color, reply-to), delivery history with resend.

**See:** ADR-009, PRD-notification-system.md (M012)

---

## Subscription system (two types)

**Meaning:** MercFlow manages two distinct subscription models, both backed by Stripe and handled in `subscription-module`:

1. **Product subscriptions** — recurring purchase of a specific product on a schedule (weekly, monthly). Customer signs up on storefront; MercFlow handles renewal scheduling via BullMQ (`mercflow:subscriptions` queue) and triggers Stripe charges.

2. **Membership club (single tier)** — customer pays a monthly/annual Stripe subscription to become a "club member". Members get: (a) per-product member price configured by admin, (b) fallback % discount for products without a specific member price. Implemented via Medusa `customer_group` ("Klub-medlemmer") + Medusa `price_list`. `subscription-module` manages Stripe subscription status and syncs Medusa customer group membership.

**Club pricing model:** Two-level lookup — (1) specific member price per variant (Medusa price list entry), (2) fallback tenant-level % discount if no specific price is set, (3) listepris if no fallback configured.

**Not:** Medusa's built-in "subscription" concept (does not exist in v2 meaningfully). Not multiple membership tiers (v1 is single tier only). Not the current `subscription-module` read-only admin view (that is v1 scaffolding — will be expanded). Not a billing engine — Stripe handles payments, MercFlow records state.

**Current state:** `@mercflow/subscription-module` exists with `subscription` table — read-only admin view. Full subscription logic (scheduling, renewal, member pricing) is not yet implemented. Planned as M015.

---

## Discount system (MercFlow-rebuilt)

**Meaning:** A Shopify-inspired discount admin UI built on top of Medusa's `promotion` module API. MercFlow owns the UI and form logic — the underlying discount engine is Medusa's promotion data model (not rewritten). Goal: non-technical merchants can create and manage discounts without touching code.

**Four discount types (v1):**
1. **Product discount** — % or fixed amount on specific products or collections
2. **Order discount** — % or fixed amount on the total order
3. **Buy X, get Y** — buy N items/amount from product set, get M items at % / fixed / free
4. **Free shipping** — waive shipping cost, optionally scoped to countries, optionally exclude above a price threshold

**Two methods per type:** Coupon code (merchant-entered or random-generated) vs. Automatic (applies without code at checkout).

**Conditions:** Min purchase amount, min item count, eligible customers (all / specific segments), usage limits (total + per customer), active date range, combination rules (stacks with product / order / shipping discounts).

**Navigation:** Top-level nav item "Discounts" — same level as Orders and Products.

**Not:** A new discount engine — Medusa's promotion API handles execution. Not Medusa's default promotion admin UI (that stays hidden). Not Buy X Get Y with complex nested rule trees (v1 is one-level).

**Reference:** Shopify Discounts UI (screenshots, June 2026 align session).

---

## Payment module (MercFlow-owned)

**Meaning:** `@mercflow/payment-module` — MercFlow's own payment abstraction layer. Owns payment provider credentials, defines `IPaymentProvider` interface, and handles checkout sessions, captures, refunds, and subscription charges. All payment operations go through this module — not directly through provider SDKs.

**Architecture:**
- `IPaymentProvider` interface: `createCheckoutSession`, `capturePayment`, `refundPayment`, `createSubscription`, `chargeSubscription`, `pauseSubscription`, `cancelSubscription`, `handleWebhook`
- Stripe implements `IPaymentProvider` (first provider)
- Future providers (MobilePay, Klarna) implement the same interface — no changes to subscription-module or admin UI when adding a provider
- `subscription-module` calls `payment-module` for charge execution; scheduling and state machine remain in `subscription-module`

**Credentials model:** `payment-module` owns its own credentials table (separate from `connector-module`). Per tenant, per provider:
- `test_secret_key`, `test_publishable_key`, `test_webhook_secret`
- `live_secret_key`, `live_publishable_key`, `live_webhook_secret`
- `mode: "test" | "live"` — merchant-controlled toggle in Settings → Payments

**Test/live mode:** Per-tenant toggle in Settings → Payments. Merchant can switch between test and live. BullMQ workers read mode per tenant when processing subscription jobs. Webhook endpoints validate against the correct secret per mode.

**Stripe migration:** Stripe credentials currently in `connector-module` are migrated to `payment-module`. `connector-module` retains GTM, Plunk, Shipmondo, and future non-payment connectors.

**Not:** Medusa's `@medusajs/payment-stripe` or `IPaymentProvider` pattern (MercFlow owns this independently of Medusa's provider system — Option B). Not a billing engine — Stripe handles money movement, `payment-module` handles provider abstraction and credential management.

---

## Tenant onboarding (invitation-based self-service)

**Meaning:** MercFlow uses an invitation-based onboarding model. Full self-service infrastructure exists (signup flow, Stripe platform billing, auto-provisioning) but access is controlled via invite links issued from Platform Console. Not public.

**Flow:**
1. Operator opens Platform Console → "Invite tenant" → enters merchant email
2. System generates a time-limited invite link and sends it to the merchant
3. Merchant follows link → signup flow: account creation (Clerk), store details, domain input, Stripe billing setup
4. Auto-provisioning triggers: Medusa Store, Sales Channel, Publishable API Key, Admin user created
5. Traefik domain routing added automatically for merchant's custom domain
6. Merchant lands in Store Admin — onboarded

**Gate to public:** When ready, remove the invitation check — the underlying system is already full self-service. Platform Console becomes an override tool rather than a gate.

**Platform billing:** Stripe subscription for the MercFlow platform fee. Merchant enters card during signup. Billing managed per tenant in Platform Console.

**Platform billing env (only these three):**
- `STRIPE_PLATFORM_SECRET_KEY` — MercFlow's Stripe account (platform billing, not per-tenant store payments)
- `STRIPE_PLATFORM_PUBLISHABLE_KEY` — Payment Element on signup Step 5
- `STRIPE_PLATFORM_WEBHOOK_SECRET` — HMAC for platform subscription webhooks

No `STRIPE_PLATFORM_PRICE_ID` — plans and prices are read from Stripe at runtime, not hardcoded in env.

**Stripe catalog model (source of truth = Stripe Dashboard):**
- **Products:** `Standard` and `Pro` — each a Stripe Product with metadata `mercflow_platform=true`, `mercflow_tier=standard|pro`
- **Prices:** per Product, one or more Prices per billing interval (`month` | `year`). Metadata: `mercflow_platform=true`, `mercflow_interval=month|year`
- **Multi-currency:** use Stripe's per-price currency model — either separate Price objects per currency (metadata `currency=dkk|eur|…`) or Stripe **currency options** on a Price (fixed amounts per currency defined in Dashboard). MercFlow never stores amounts — only resolves the correct `price_id` for the merchant's chosen currency + tier + interval.

**Signup billing flow (Step 5):**
1. Currency comes from Step 3 (store country/currency)
2. `GET /platform/billing/plans?currency=dkk` — backend lists active Standard/Pro × Monthly/Annual for that currency (fetched from Stripe API, filtered by metadata)
3. Merchant picks tier + interval → UI shows Stripe-resolved amount
4. `POST /platform/signup/billing/setup { price_id }` — backend validates `price_id` is an active platform price in Stripe before creating subscription
5. Payment Element confirms first invoice → provisioning continues

**Not:** Hardcoded plan amounts in MercFlow code or env. Not duplicating Stripe's product catalog in a MercFlow DB table in v1 — Stripe API is the catalog. Not the same Stripe account as per-tenant `payment-module` credentials (merchant store checkout).

**Tenant ↔ Stripe linkage (canonical — not a loose sync):**

MercFlow's tenant discriminator is **`store_id`** (Medusa Store ID). Clerk org maps 1:1 via JWT `org_id` → `store_id`. Platform billing must be keyed on `store_id` from day one — not only on `invite_token_hash`.

| System | Identifier | Role |
|--------|------------|------|
| Medusa | `store_id` | Canonical tenant ID — RLS, provisioning, audit log |
| Clerk | `organization_id` | Store Admin auth workspace — maps to `store_id` |
| Stripe Customer | `cus_…` | Platform billing customer — metadata **`store_id`** + **`clerk_org_id`** |
| Stripe Subscription | `sub_…` | Active plan — metadata **`store_id`** + tier/interval refs |

**`platform_tenant_billing` table (MercFlow-owned, platform-level):**
- `store_id` (PK) — tenant discriminator
- `clerk_org_id`
- `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`
- `plan_tier` (`standard` \| `pro`), `billing_interval` (`month` \| `year`), `billing_currency`
- `subscription_status` (mirrored from Stripe webhooks — `active`, `past_due`, `canceled`, …)
- `updated_at`

This is MercFlow's **authoritative index** for operator UI and access control. Stripe remains the billing engine; MercFlow never stores amounts — only IDs and status.

**Lifecycle (no manual sync button):**
1. Signup billing setup → Stripe Customer + Subscription created with `invite_token_hash` in metadata (store does not exist yet)
2. Provisioning creates `store_id` + Clerk org → **immediately** updates Stripe Customer + Subscription metadata with `store_id` + `clerk_org_id`; upserts `platform_tenant_billing`
3. Webhooks (`subscription.updated`, `subscription.deleted`, `invoice.payment_failed`) resolve tenant by **`store_id` in metadata** (primary) — update `platform_tenant_billing`, suspend on cancel, audit log every event with `store_id`
4. Platform Console reads `platform_tenant_billing` + live Stripe retrieve for detail — shows plan, status, links; suspend action cancels subscription via Stripe API then disables store

**Control surfaces:**
- **Platform Console → Tenant detail:** plan (Standard/Pro), interval, currency, subscription status, Stripe dashboard link
- **Platform Console → Suspend:** disables store + revokes API keys + cancels Stripe subscription (single operator action)
- **`platform_audit_log`:** every billing/provision event logged with `entity_id = store_id`

**Not:** Finding tenant only via `invite_token_hash` after provisioning (bootstrap fallback only). Not a "Sync with Stripe" button — webhooks + provisioning writes keep state current. Not storing plan prices in MercFlow DB.

---

## Shipping abstraction layer

**Meaning:** MercFlow provides a unified shipping provider interface in `connector-module`. Shipmondo is the current implementation. New carriers (GLS, PostNord, etc.) implement the same interface. Tenant-admin configures which carrier is active per store.

**Not:** A direct Medusa fulfillment-provider-per-carrier pattern where each carrier is registered separately in `medusa-config.ts`. MercFlow wraps this behind a single `mercflow-shipping` provider that delegates to the configured carrier.

---

## Platform Console (operator tool)

**Meaning:** A separate internal React + Vite application (`apps/platform-console/`) for the MercFlow team only — not accessible to tenants. Deployed at `console.mercflow.shop` (not public). Auth via Google OAuth (MercFlow team's Google Workspace). Bypasses tenant RLS to give cross-tenant visibility.

**Sections (v1):** Tenant management (list, provision, suspend), BullMQ queue monitor (all queues: notifications, subscriptions, feed-invalidation, webhooks, sitemap), email delivery overview across tenants, SES domain status per tenant, system health (Hetzner, Neon, Redis), Sentry error feed grouped by `store_id`, audit log.

**Not:** Part of Store Admin. Not accessible to merchants. Not built in Next.js (no SSR/SEO needed). Not a Medusa admin-ui extension — completely separate codebase and auth.

**See:** M014 (planned)

---

## Store Admin

**Meaning:** The per-tenant admin UI (`packages/admin-ui`) that merchants use to manage their store — products, orders, customers, settings. Accessed at `admin.{tenant-domain}` or via a tenant-specific URL. Auth via Medusa admin JWT. Only sees data for the authenticated tenant's `store_id`.

**Not:** The Platform Console. Not a super-admin interface. Tenants cannot see other tenants' data.

---

## BullMQ event bus (MercFlow platform-wide)

**Meaning:** MercFlow replaces Medusa's default Redis event bus with a custom BullMQ-based event bus module (`packages/mercflow-event-bus/`) that implements Medusa's `IEventBusService` interface. All Medusa events (`order.placed`, `product.updated`, etc.) become BullMQ jobs — with retry, DLQ, and full observability in Platform Console.

**Queue naming convention:**
- `mercflow:notifications` — transactional emails
- `mercflow:subscriptions` — renewal checks, Stripe charges
- `mercflow:feed-invalidation` — Google Shopping XML regeneration
- `mercflow:sitemap` — sitemap cache invalidation
- `mercflow:webhooks` — Stripe + Shipmondo HMAC-verified processing

**Not:** Medusa's default `@medusajs/event-bus-redis` (fire-and-forget pubsub). Not a separate message broker (Kafka, RabbitMQ) — BullMQ on existing Redis is sufficient.

**Worker:** Runs as a separate process `apps/worker/` — independent from the HTTP server. Same codebase, different entrypoint. Enables independent scaling of job processing.

**See:** ADR-010 (to be written), T058 (M012 — first implementation)

---

## Admin Shell & Navigation (M013)

**Meaning:** Structured sidebar navigation in Store Admin that organises all features into a clear hierarchy. Mirrors Shopify's admin navigation model: Orders, Products (Products, Categories, Inventory), Customers, Settings (General, Email, Shipping, Custom Data, Payments, Integrations). Settings sub-sections link to all MercFlow module settings pages.

**Not:** A redesign of individual pages — only navigation structure and settings organisation. Not the Platform Console navigation (separate system).

**See:** M013 (planned — next after M012)

---

## Settings — MercFlow Store Admin

**Meaning:** The `/settings` section of Store Admin. A full MercFlow-owned UI that wraps Medusa-core APIs and MercFlow module APIs in MercFlow's own design system and UX patterns. Merchants never see raw Medusa pages — all settings live inside MercFlow admin.

**Navigation model:** Persistent secondary sidebar sub-navigation (Model A — Shopify/Linear pattern). Clicking "Settings" in the main nav opens a settings shell with:
- Left: grouped sub-nav (always visible while in settings)
- Right: the active settings page content

**Sidebar grouping:**

```
Settings
├── Butik
│   ├── Generelt          (store name, address, currency, timezone)
│   └── Politikker        (privacy, returns, terms, shipping policy, legal notice)
├── Salg
│   ├── Betalinger        (payment providers — Stripe, MobilePay config surfaces here)
│   ├── Skatter og told   (Medusa tax regions + global tax settings)
│   └── Kasse             (checkout contact method, marketing consent, abandoned cart)
├── Forsendelse
│   ├── Leveringsprofiler (Medusa shipping profiles + zones)
│   └── Fragtlabels       (Shipmondo config surfaces here)
├── Kunder
│   ├── Kundekonti        (login visibility, self-service returns toggle, store credit)
│   └── Returregler       (return window, conditions)
├── Kommunikation
│   ├── Email             (sender domain, DNS/DMARC, branding, delivery log)
│   └── Notifikationer    (email templates, staff notifications, webhooks)
├── Team
│   └── Brugere og roller (Clerk-based staff management)
├── Apps
│   └── Oversigt          (all connected apps with status — global view)
│       (Stripe, Shipmondo, Plunk, GTM configure contextually in relevant sections above)
└── Udviklere
    └── Custom Data       (metafield definitions for products, variants, categories)
```

**Apps model:** Two-level. A global `/settings/apps` overview page lists all installed/connected apps with status (connected / error / not configured). Configuring an app happens contextually within the relevant Settings section (e.g. Stripe lives under Betalinger, Shipmondo under Fragtlabels). The Apps overview links to the contextual config location.

**Landing page:** `/settings` auto-redirects to `/settings/general`. No settings overview page. Every settings route renders a concrete settings page directly.

**Not:** A page that links to Medusa's own admin pages. Not a flat list (Shopify's flat nav). Not the Platform Console settings. No settings "home" or dashboard page.

**Priority (build order):** Kritiske gaps first — Butik (Generelt + Politikker), Kommunikation (Email + Notifikationer), then Salg, Forsendelse, Kunder, Apps, Udviklere.

**See:** M016 (settings architecture PRD), M013 (navigation shell), M012 (notification-module — feeds Email + Notifikationer pages)

---

## Security hardening gate (M021)

**Meaning:** A mandatory gate milestone that must ship before the first external (paying) tenant is onboarded. It has two layers: (1) MercFlow-owned code gaps — Zod validation on all platform API routes, rate limiting on invite/signup/billing endpoints, sanitize the `innerHTML` in `previewPlainText.ts`; (2) transitive CVEs — upgrade `tsx` to resolve the high-severity `esbuild` binary-integrity CVE, address remaining moderate CVEs where a safe upgrade path exists. Gate passes when `pnpm audit --audit-level=high` returns 0.

**CVE landscape (June 2026 audit):**
- All CVEs are in transitive dependencies — no MercFlow-owned package is directly vulnerable
- 1 high: `esbuild <0.28.1` via `tsx → postcss-load-config` (build-tool chain, not runtime)
- 10 moderate: `vite`, `vitest`, `react-router`, `qs`, `ajv`, `ws`, `uuid`, `brace-expansion`, `prismjs`, `i18next-http-backend`
- Fix strategy: bump `tsx` to latest; bump `vite`/`vitest` to latest; for Medusa-fork transitive deps (ajv, ws, qs) — upgrade the parent dep where possible, else add `pnpm.overrides` as a last resort

**Platform API route validation gap:**
- 20 out of 20 `/platform/*` routes have no Zod validation (discovered June 2026 audit)
- Every POST/PATCH route must validate body; every parameterised route must validate params
- Use a shared `validateBody(schema)` helper to avoid duplication across routes

**Rate limiting:**
- No rate limiting exists anywhere in the codebase (June 2026)
- Priority endpoints for limiting: `/platform/invites` (POST), `/platform/signup/*`, `/platform/billing/plans`, auth-adjacent routes
- Implementation: Medusa middleware layer or Express-compatible rate-limit middleware at the route group level

**Not:** Blocking development of M022 (Settings) — both milestones run in parallel. Not a full penetration test — this is the minimum bar for first external tenant. Not about Platform Console auth (already handled by Clerk/Google OAuth).

**See:** M021 PRD (to be written), ADR-015 (tenant billing linkage)

---

## Settings completion (M022)

**Meaning:** All Settings pages that were created as placeholders in M016 are now fully functional. A new tenant can configure everything needed to open their store without operator assistance.

**Day-1 required pages (blocking for first external tenant):**
- **General** — store name, contact email, address, timezone, default currency (wraps Medusa store config API)
- **Domains** — view active domain (set during provisioning), request domain change (operator action)
- **Payments** — already functional (M017: Stripe test/live toggle) — verify UI complete
- **Shipping** — shipping zones + flat/weight-based rates; Shipmondo credentials + enable/disable (wraps `connector-module`)
- **Taxes** — tax regions + rates (wraps Medusa tax API)
- **Team** — invite team members by email, assign admin/staff role, revoke access (Clerk org member management)
- **Notifications** — per-tenant email branding: logo, color, reply-to, from name (notification-module branding fields)
- **Apps** — connector config pages: GTM (tag ID), Plunk (API key), Shipmondo (API key + sender) — already exists in connector-module, verify UI is complete and polished
- **Developers** — view publishable API key (created during provisioning), view/revoke webhook endpoints

**Not:** Building new backend modules — all backend exists. This is primarily admin UI wiring existing APIs to settings pages. Not the Platform Console settings. Not Medusa's native settings pages — MercFlow owns these entirely.

**See:** M016 (settings shell + navigation), PRD-settings-architecture.md, M022 PRD (to be written)

---

<!-- Add terms below during /align sessions -->
