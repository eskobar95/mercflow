# PRD — Discount System (M018)

> Version 1.0 — 2026-06-13
> Based on: /align session June 2026, CONTEXT.md, Shopify Discounts UI (screenshots June 2026)
> Scope: Shopify-inspired discount admin UI on top of Medusa's promotion engine

---

## Problem

Medusa v2 ships a promotion engine that is technically complete but practically unusable for most merchants:

1. **Incomprehensible UI.** Medusa's promotion admin uses abstract rule builder terminology ("condition sets", "rules", "operator"). A non-technical merchant cannot create a simple "10% off all products" discount without guidance.

2. **Missing merchant mental model.** Shopify's experience proves merchants think in four categories: product discount, order discount, buy X get Y, free shipping. Medusa's promotion UI does not map to these categories.

3. **Hard-coded workarounds.** Free shipping over a threshold was hardcoded for Guapo — a direct result of the promotion UI being too complex to configure correctly. This must never happen again.

4. **No top-level access.** Discounts are buried in Medusa's settings. For most merchants, discounts are a primary workflow item — on the same level as Orders and Products.

---

## Goals

1. "Discounts" is a top-level nav item in Store Admin — same level as Orders, Products, Customers.
2. Merchant can create and manage discounts using a Shopify-like form — no knowledge of Medusa's promotion API required.
3. Four discount types are fully supported: Product discount, Order discount, Buy X get Y, Free shipping.
4. Each type supports two methods: Coupon code (merchant enters or random-generates) and Automatic (no code needed at checkout).
5. Rich condition support: min purchase, min quantity, customer eligibility, usage limits (total + per customer), date range, combination rules.
6. Free shipping supports: country scope, price threshold exclusion (free shipping only if order < X).
7. Merchant can activate, deactivate, and delete discounts. Discount list shows status, usage, and expiry at a glance.
8. Medusa's `promotion` module handles execution — MercFlow wraps and extends the admin surface only.

---

## Non-goals (explicit)

- **Custom discount execution engine** — Medusa's promotion API is used. MercFlow does not rewrite discount math.
- **Multi-code / unique code generation** — single coupon code per discount in v1. Bulk code generation deferred.
- **Automatic discount stacking rules beyond "can combine with X"** — v1 has a simple "combine with: [product discounts | order discounts | shipping discounts]" toggle set.
- **Buy X get Y with complex nested conditions** — v1: buy N items/amount from set A, get M items from set B at %/fixed/free. No nested rule trees.
- **Discount analytics / performance dashboard** — usage count only. Conversion funnel analytics deferred.
- **Medusa's default promotion admin UI** — it is hidden (not shown in MercFlow's navigation). MercFlow owns the full discount UI.
- **Subscription discounts** — recurring subscription pricing is in `subscription-module` (member pricing). Not in scope here.

---

## Discount types (v1)

### Type 1 — Product discount

Reduce price on specific products, collections, or all products.

| Field | Description |
|-------|-------------|
| Value | % off or fixed amount off |
| Applies to | All products \| Specific collections \| Specific products |
| Method | Coupon code or Automatic |

### Type 2 — Order discount

Reduce the total order amount.

| Field | Description |
|-------|-------------|
| Value | % off or fixed amount off |
| Applies to | Order total |
| Method | Coupon code or Automatic |

### Type 3 — Buy X, get Y

Buy a quantity or amount from a set, get items from another set at a discounted price.

| Field | Description |
|-------|-------------|
| Customer buys | Minimum quantity N _or_ minimum spend amount |
| From | Any products \| Specific collections \| Specific products |
| Customer gets | Quantity M at % off \| fixed amount off \| free |
| From | Any products \| Specific collections \| Specific products |
| Maximum uses | Optional cap on how many times the "get" can apply per order |
| Method | Coupon code or Automatic |

### Type 4 — Free shipping

Waive shipping cost for the order.

| Field | Description |
|-------|-------------|
| Countries | All \| Specific countries |
| Exclude above | Optional: do not apply if order exceeds X DKK (prevents free shipping on large orders) |
| Method | Coupon code or Automatic |

---

## Shared conditions (all types)

| Condition | Description |
|-----------|-------------|
| Minimum purchase amount | Discount only applies if order ≥ X |
| Minimum quantity | Discount only applies if order has ≥ N items |
| Customer eligibility | All customers \| Specific customer segments \| Specific customers |
| Usage limit (total) | Discount deactivates after N total uses |
| Usage limit (per customer) | Max N uses per individual customer |
| Active dates | Start date + optional end date/time |
| Combination rules | "Can be combined with: [product discounts] [order discounts] [shipping discounts]" |

---

## Architecture

### Medusa promotion API mapping

MercFlow's discount form translates to Medusa's `promotion` data model on save. The admin UI owns the form vocabulary; Medusa owns execution.

```
MercFlow form              →   Medusa promotion concept
─────────────────────────────────────────────────────────
Discount type (4 types)    →   promotion.type
Coupon code                →   promotion.code (campaign code)
Automatic                  →   promotion.is_automatic = true
Product scope              →   promotion.application.conditions (item rules)
Min purchase amount        →   promotion.application.min_amount
Min quantity               →   promotion.application.min_quantity
Usage limit total          →   promotion.usage_limit
Usage limit per customer   →   promotion.customer_limit (custom via extension if needed)
Date range                 →   campaign.start_at / campaign.end_at
Combination flags          →   promotion.combine_type (default: each → sum)
```

Where Medusa's promotion API does not natively support a condition (e.g. per-customer limit), MercFlow adds a lightweight check in the admin route handler or storefront middleware — never by modifying Medusa core promotion execution.

### No new module

No new package is created. Discount admin routes live in `apps/backend/src/api/admin/discounts/` (MercFlow custom routes wrapping Medusa's `/admin/promotions` API). The admin UI is a set of new pages in `packages/admin-ui`.

### Admin routes

```
GET    /admin/discounts          List (wraps Medusa promotion list + enrichment)
POST   /admin/discounts          Create (translates form → promotion create)
GET    /admin/discounts/:id      Single
PATCH  /admin/discounts/:id      Update
DELETE /admin/discounts/:id      Delete
POST   /admin/discounts/:id/activate
POST   /admin/discounts/:id/deactivate
```

All routes validate with Zod. All routes enforce `store_id` from JWT.

---

## User journeys

### J001 — Merchant creates a 10% off sitewide coupon code

**Actor:** Merchant-admin
**Goal:** Run a weekend promotion — 10% off everything with code WEEKEND10

**Steps:**
1. Store Admin → Discounts → "Create discount"
2. Selects type: "Order discount"
3. Method: "Discount code" — enters "WEEKEND10" (or clicks generate)
4. Value: 10%, applies to: order total
5. Conditions: no minimum, all customers, usage limit: 500 total, limit per customer: 1
6. Dates: start Saturday 00:00, end Sunday 23:59
7. Combination: cannot combine with other discounts (default)
8. Save + Activate → discount live, status badge: "Active"
9. List view shows: WEEKEND10 | Order | Code | Active | 0/500 uses | Expires Sunday

**Acceptance:** Medusa `promotion` record created with correct rules. Code works at storefront checkout. Auto-deactivates after 500 uses or Sunday 23:59.

---

### J002 — Merchant creates automatic free shipping on orders over 500 DKK

**Actor:** Merchant-admin
**Goal:** Replace the previous hardcoded free-shipping hack with a proper discount rule

**Steps:**
1. Store Admin → Discounts → "Create discount"
2. Type: "Free shipping"
3. Method: "Automatic"
4. Countries: Denmark, Sweden, Norway
5. Conditions: minimum purchase amount: 500 DKK
6. No date restriction, no usage limit
7. Save + Activate → automatic discount active immediately

**Acceptance:** Checkout applies free shipping automatically for qualifying Scandinavian orders. No code required. No hardcoding in backend.

---

### J003 — Merchant creates a buy-2-get-1-free on a product collection

**Actor:** Merchant-admin
**Goal:** Run a "buy 2 coffees, get 1 free" bundle promotion

**Steps:**
1. Store Admin → Discounts → "Create discount"
2. Type: "Buy X, get Y"
3. Customer buys: minimum quantity 2, from: collection "Coffee Beans"
4. Customer gets: quantity 1, free (100% off), from: collection "Coffee Beans"
5. Maximum uses per order: 1 (can only trigger once per order)
6. Method: Automatic
7. Active dates: none (runs indefinitely until deactivated)
8. Save + Activate

**Acceptance:** Discount applied at checkout when 2+ coffee beans in cart. Third coffee is free. Does not apply twice if 4 in cart (max uses: 1).

---

### J004 — Merchant deactivates an expired campaign discount

**Actor:** Merchant-admin
**Goal:** Clean up past promotions

**Steps:**
1. Store Admin → Discounts → list
2. Filter: Status = Expired
3. Selects discount → detail view → "Deactivate" or sees already auto-deactivated by end date
4. Optionally: deletes the discount record

**Acceptance:** Deactivated discounts no longer apply at checkout. Usage count preserved for reference.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `packages/admin-ui` | Top-level "Discounts" nav item |
| `packages/admin-ui` | Discount list page: name, type, method, status badge, usage, expiry |
| `packages/admin-ui` | Discount create/edit form — type selector → form variant per type |
| `packages/admin-ui` | Shared conditions section (min purchase, customer eligibility, usage limits, dates, combinations) |
| `packages/admin-ui` | Coupon code input with "Generate" button |
| `apps/backend` | Admin discount routes wrapping Medusa's promotion API + Zod validation |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Merchant can create free shipping with threshold in < 2 minutes | Yes (no technical knowledge required) |
| Hardcoded free-shipping logic anywhere in codebase | 0 after migration |
| `pnpm react-doctor:admin-ui` issues introduced | 0 |
| Direct Medusa promotion admin visible in MercFlow nav | 0 (hidden) |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Per-customer usage limit — Medusa supports this natively? | **TBD during implementation.** If Medusa's `customer_limit` exists on `promotion`, use it. If not, MercFlow adds a lightweight check on the admin side (not execution side). |
| OQ-02 | Country-scoped free shipping — is this a Medusa promotion condition or a shipping zone concept? | **Medusa `FulfillmentSet` / shipping zones** handle country-scoped shipping rates. Free shipping discount applies to the shipping line item; country scoping handled by which shipping options are available. Verify mapping during T-implementation. |
| OQ-03 | Should "Discounts" be in the sidebar under a parent group, or truly top-level like Orders? | **Top-level nav item** — same level as Orders, Products, Customers. Confirmed in /align session. |
