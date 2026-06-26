# PRD — Subscription System (M015)

> Version 1.0 — 2026-06-11
> Based on: /align session June 2026, CONTEXT.md, Shopify subscription/membership analysis
> Scope: Product subscriptions + single-tier Customer Club with member pricing

---

## Problem

MercFlow merchants selling consumables (supplements, coffee, skincare) and community-driven brands have two recurring revenue needs that Medusa v2 does not cover:

1. **Product subscriptions** — customers sign up to receive a product on a recurring schedule (weekly, bi-weekly, monthly). Medusa has no subscription object, no recurring charge mechanic, and no subscription status lifecycle.

2. **Customer Club / membership** — merchants want a single-tier "members club": customers pay a monthly/annual membership fee, and in return see lower prices on products. The pricing model has two levels:
   - Per-product explicit member price (e.g., "Coffee Beans — member price: 89 DKK, regular: 120 DKK")
   - Fallback: if no explicit member price exists, apply a configurable percentage discount (e.g., 10% off for all club members)

Medusa's `price_list` + `customer_group` can represent the club's price tier, but the subscription lifecycle, renewal processing, and dunning are entirely absent.

---

## Goals

1. A customer can subscribe to a product (choose interval) at checkout or from the product page.
2. Subscriptions renew automatically via BullMQ (Stripe Billing or charge-per-renewal).
3. A merchant can view, pause, cancel, and resume any customer's subscription from Store Admin.
4. Club membership is purchasable as a standalone Stripe subscription — activation grants the customer group membership.
5. Club members see member prices on applicable products throughout the storefront.
6. Merchant can configure: club membership price (Stripe product), fallback discount %, and per-product member price.
7. All subscription events (created, renewed, failed, cancelled) flow through BullMQ and trigger notification emails (M012).

---

## Non-goals (explicit)

- **Multi-tier memberships** (Bronze/Silver/Gold) — single tier only in v1.
- **Free trial periods** — deferred.
- **Volume discounts / tiered pricing beyond club/non-club** — handled by M016 (Discount System Rebuild).
- **Subscription upsell at checkout** (Shopify-style add subscription to one-time buy) — deferred to v2.
- **Gift subscriptions** — deferred.
- **Dunning emails** — v1 uses Stripe's built-in retry. MercFlow dunning in v2.
- **Subscription boxes / curation** — out of scope.
- **Physical product subscriptions with shipping** — v1 focuses on digital/consumable. Shipping address handling is identical to regular orders; no special packing logic.

---

## Pricing model (Customer Club)

```
For any product in a club-enabled store:

1. If a product has a `club_member_price` set:
   → Use club_member_price (stored on MercFlow price list tied to the club customer_group)

2. Else if store has a fallback_discount_pct configured:
   → Apply (regular_price × (1 - fallback_discount_pct / 100))

3. Else:
   → Show regular price (product is not discounted for club members)
```

This two-level lookup is handled in the storefront price resolution layer (storefront calls Medusa's pricing API with `customer_group_id` included in context). No MercFlow-specific pricing engine needed — Medusa's price lists handle case 1; a storefront-level calculation handles case 2.

---

## Architecture

### New module: `packages/subscription-module`

Medusa DML module owning:

```
subscription
├── id
├── store_id            (RLS scope)
├── customer_id         text (FK → Medusa customer)
├── product_id          text (FK → Medusa product)
├── variant_id          text (FK → Medusa variant)
├── interval            enum: weekly | biweekly | monthly | quarterly
├── status              enum: active | paused | cancelled | past_due | pending_payment
├── stripe_subscription_id  text (nullable — for Stripe Billing approach)
├── current_period_start  timestamp
├── current_period_end    timestamp
├── next_renewal_at       timestamp
├── cancelled_at          timestamp (nullable)
├── pause_requested_at    timestamp (nullable)
├── created_at / updated_at (Medusa DML manages)

subscription_renewal_log
├── id
├── subscription_id     FK → subscription
├── order_id            text (FK → Medusa order created for renewal)
├── amount              numeric
├── currency            text
├── status              enum: success | failed | skipped
├── stripe_payment_intent_id  text (nullable)
├── error_message       text (nullable)
├── created_at
```

**Medusa integration points:**
- `customer_group` — `club_members` group created per store on club setup
- `price_list` — `club_members` price list linked to the customer group; stores per-product member prices
- `product` (forked) — no new field needed; member prices live in Medusa price list

**Store configuration** (stored in `store` or a new `subscription_config` row per store):
```
subscription_config
├── id
├── store_id
├── club_enabled          boolean
├── club_stripe_product_id  text (Stripe product for club membership)
├── club_price_monthly    numeric
├── club_price_annual     numeric
├── club_fallback_discount_pct  numeric (0–100)
├── club_name             text (e.g. "VIP Klub", "Coffee Club")
```

### BullMQ queues

`subscription-renewal` queue — worker in `apps/worker/`:
- Job: `process-due-renewals` — cron every hour; finds `next_renewal_at <= now()` and `status = active`
- Job: `charge-subscription` — creates a Medusa order + Stripe PaymentIntent for the renewal
- Job: `handle-renewal-failure` — marks `past_due`, emits event → notification email (M012)
- Job: `handle-club-membership-created` — adds customer to `club_members` group

---

## User journeys

### J001 — Customer subscribes to a product at checkout

**Actor:** Store customer
**Goal:** Receive coffee beans every 2 weeks automatically

**Steps:**
1. Customer views product page — sees "Subscribe & Save" toggle (if store has subscriptions enabled)
2. Toggles to Subscribe — selects interval: Every 2 weeks
3. Adds to cart (subscription line item tagged with interval metadata)
4. Checkout completes normally — Stripe charges full amount for first order
5. MercFlow creates `subscription` record with `next_renewal_at = now + 14 days`
6. Customer receives order confirmation email + "Subscription started" email (M012)

**Acceptance:** Subscription visible in customer's account page. `next_renewal_at` set correctly. First order created normally in Medusa.

---

### J002 — Renewal worker processes a due subscription

**Actor:** BullMQ subscription-renewal worker
**Goal:** Automatically charge and fulfil renewal for an active subscription

**Steps:**
1. Cron job fires at :00 every hour
2. Worker queries `subscription` where `next_renewal_at <= now()` and `status = active`
3. For each: creates a Medusa draft order for the variant + creates Stripe PaymentIntent
4. On Stripe success: order confirmed, `next_renewal_at` advanced by interval, `subscription_renewal_log` entry created
5. Notification email sent: "Your order is on the way" (M012)
6. On Stripe failure: status → `past_due`, retry after 3 days (Stripe's built-in retry), notification email: "Payment failed" (M012)

**Acceptance:** Idempotency key on Stripe PaymentIntent (subscription_id + renewal date). Duplicate job execution does not double-charge. Renewal log entry per attempt.

---

### J003 — Merchant views and manages subscriptions

**Actor:** Merchant-admin
**Goal:** Find a specific customer's subscription after they emailed asking to pause

**Steps:**
1. Store Admin → Subscriptions (new section under Customers or Orders)
2. Search by customer email or subscription ID
3. Row shows: customer, product, interval, status (Active), next renewal
4. Click row → Subscription detail: renewal log, billing history
5. Click "Pause" → pause until (optional date picker) or indefinitely
6. Status → Paused; customer receives "Subscription paused" email (M012)

**Acceptance:** Pause stops next renewal (next_renewal_at not advanced while paused). Resume reactivates with next_renewal_at recalculated from resume date.

---

### J004 — Customer joins the Club membership

**Actor:** Store customer
**Goal:** Join the coffee brand's "Kaffeklubben" to get 10% off all products

**Steps:**
1. Customer visits Club landing page (merchant-created CMS page or dedicated `/club` route)
2. Sees: "89 DKK/month — member prices on all products"
3. Clicks "Become a member" → Stripe Checkout for recurring monthly subscription
4. On success: Stripe webhook → MercFlow adds customer to `club_members` customer_group
5. Customer sees member prices immediately on next product page visit
6. Welcome email sent: "Welcome to Kaffeklubben" (M012)

**Acceptance:** Customer group membership applied within 30s of Stripe webhook. Stripe webhook verified with HMAC. Member prices visible in storefront pricing context.

---

### J005 — Merchant configures Club membership

**Actor:** Merchant-admin
**Goal:** Set up the club: name, monthly price, fallback discount

**Steps:**
1. Store Admin → Settings → Subscriptions (or Customer Club)
2. Toggle: "Enable Customer Club"
3. Form: Club name, monthly price (DKK), annual price (DKK), fallback discount (%)
4. Save → MercFlow creates/updates Stripe Product + Price + `subscription_config` record
5. Club enabled — "Become a member" CTA available via storefront SDK

**Acceptance:** Stripe product created via API. `subscription_config` record saved. Changing fallback discount takes effect immediately (no migration needed — it's config).

---

### J006 — Merchant sets per-product member price

**Actor:** Merchant-admin
**Goal:** Give club members a specific discounted price on their flagship product

**Steps:**
1. Store Admin → Products → select product → Pricing tab
2. New section: "Club member price" (only visible if club is enabled for the store)
3. Enter: 89 DKK (compared to regular 120 DKK)
4. Save → MercFlow upserts Medusa price list entry for this variant + `club_members` customer group
5. Club members see 89 DKK; non-members see 120 DKK on the storefront

**Acceptance:** Price list entry created correctly. Medusa's pricing API returns correct price when called with club customer_group context. Non-members unaffected.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `packages/subscription-module` | DML models (`subscription`, `subscription_renewal_log`, `subscription_config`), service, migrations |
| `apps/worker` | `subscription-renewal` queue workers (cron + charge + failure handler) |
| `apps/backend` | Webhook handler for Stripe subscription events (membership), `/admin/subscriptions` routes |
| `packages/admin-ui` | Subscription list + detail page (M013 navigation puts it under Customers or Orders) |
| `packages/admin-ui` | Club configuration in Settings → Subscriptions |
| `packages/admin-ui` | Per-product member price field in Product → Pricing tab |
| `packages/admin-ui` | Renewal log view on subscription detail |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Renewal processed within 1h of `next_renewal_at` | ≥ 99% |
| Duplicate charge rate | 0% (idempotency key) |
| Club member price visible in storefront within 30s of Stripe webhook | ≥ 99% |
| Stripe webhook HMAC verification passing | 100% |
| `pnpm test` for subscription-module | ≥ 80% coverage on service methods |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Stripe Billing vs. manual PaymentIntent per renewal? | **Manual PaymentIntent** per renewal (more control, no dependency on Stripe Billing subscription object). Stripe Billing as v2 option if payment method changes (e.g. SEPA debit). |
| OQ-02 | Where does the "Subscribe & Save" UI live — on product page or at checkout? | **Product page** (toggle before add-to-cart) in v1. Checkout upsell deferred. |
| OQ-03 | Customer account page for managing subscriptions — part of M015 or storefront SDK? | **Store Admin-only in v1** (merchant manages on customer's behalf). Self-service portal for customer in v2. |
| OQ-04 | How does club membership cancellation work (customer wants to leave)? | **Stripe portal** (Stripe Customer Portal for subscription management) in v1. No custom MercFlow cancellation flow. |
