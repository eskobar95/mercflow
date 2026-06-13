# PRD — Platform Billing Retrofit (M020)

> Version 1.0 — 2026-06-13
> Based on: /align session June 2026, CONTEXT.md
> Scope: Retrofit M019 platform billing — plan picker, `platform_tenant_billing` table, stram Stripe↔tenant linkage, Console billing panel

---

## Problem

M019 shipped platform billing as a v1 bootstrap: one price ID in env, webhooks resolved tenant by `invite_token_hash`, no persistent billing record per tenant, and no plan visibility in Platform Console. Four concrete problems:

1. **`STRIPE_PLATFORM_PRICE_ID` in env** — one hardcoded plan. Changing price requires a redeploy. No Standard/Pro choice. No monthly/annual toggle. No multi-currency.

2. **Tenant↔Stripe linkage is loose.** Stripe Customer and Subscription are created with `invite_token_hash` in metadata. `store_id` is written to Stripe metadata only during provisioning — and only on the Customer, not the Subscription. Webhook handlers resolve tenant via `invite_token_hash`, not `store_id`. After provisioning, the primary key (`store_id`) is not the lookup key in Stripe. This breaks if an invite is reused, a provisioning step retries, or a future webhook arrives without the hash.

3. **No `platform_tenant_billing` record.** MercFlow has no authoritative index of which Stripe customer/subscription belongs to which tenant. Platform Console cannot show plan, status, or billing info without querying Stripe directly per tenant. There is no fast way to answer "which tenants have a lapsed subscription?"

4. **Suspend is incomplete.** Suspending a tenant from Platform Console disables the store and revokes API keys — but does not cancel the Stripe subscription. The merchant continues to be billed.

---

## Goals

1. Remove `STRIPE_PLATFORM_PRICE_ID` from env entirely. Plans and prices are read from Stripe at runtime.
2. Signup Step 5 shows a plan picker: Standard / Pro × Monthly / Annual × merchant's currency. Amounts come from Stripe — never hardcoded in MercFlow.
3. Multi-currency: Stripe Prices use currency options (advanced pricing) or per-currency Price objects. MercFlow resolves the correct price for the merchant's currency.
4. `platform_tenant_billing` table is the authoritative billing index: `store_id` → Stripe IDs, plan tier/interval/currency, subscription status, timestamps.
5. Stripe Customer **and** Subscription metadata are updated with `store_id` + `clerk_org_id` immediately during provisioning (step 7 in the provision job).
6. All webhooks (`subscription.updated`, `subscription.deleted`, `invoice.payment_failed`) resolve tenant by `store_id` in Stripe metadata (primary). `invite_token_hash` is bootstrap-only fallback for the narrow window between billing setup and provisioning completion.
7. Platform Console Tenant detail shows plan, interval, currency, subscription status, MRR (from Stripe), and a direct link to the Stripe Dashboard customer page.
8. Platform Console Suspend action cancels the Stripe subscription in the same operation as disabling the store.

---

## Non-goals (explicit)

- **Plan upgrade/downgrade self-service for merchants** — operator-assisted only in v1. No merchant-facing billing portal in Store Admin.
- **Dunning UI** — Stripe handles payment retry. MercFlow only mirrors status from webhooks.
- **Usage-based or metered billing** — flat-rate subscriptions only in v1.
- **Free plan / trial periods** — internal tenants use the operator override flag (no billing step). No public trial.
- **Proration on mid-cycle plan changes** — Stripe handles proration; Platform Console shows what Stripe decides.
- **Invoice history UI** — Stripe Dashboard link covers this. No invoice list in Platform Console v1.
- **Storefront payment (per-tenant payment-module)** — separate system; not in scope here.

---

## Architecture

### Stripe catalog (source of truth = Stripe Dashboard)

```
Stripe Products (metadata: mercflow_platform=true, mercflow_tier=standard|pro)
  MercFlow Standard
    Prices (metadata: mercflow_platform=true, mercflow_interval=month|year)
      Standard Monthly DKK — price_xxx (currency: dkk, interval: month)
      Standard Annual DKK  — price_yyy (currency: dkk, interval: year)
      Standard Monthly EUR — price_zzz (currency: eur, interval: month)
      …
  MercFlow Pro
    Prices
      Pro Monthly DKK — price_aaa
      …
```

MercFlow never stores amounts. `GET /platform/billing/plans?currency=dkk` fetches active prices from Stripe API, filters by `mercflow_platform=true` metadata, groups by tier + interval.

### `platform_tenant_billing` table (platform-level, not Medusa DML)

```sql
platform_tenant_billing
├── store_id              text PRIMARY KEY   -- canonical tenant ID
├── clerk_org_id          text NOT NULL
├── stripe_customer_id    text NOT NULL UNIQUE
├── stripe_subscription_id text NOT NULL UNIQUE
├── stripe_price_id       text NOT NULL      -- active price at signup
├── plan_tier             text NOT NULL      -- 'standard' | 'pro'
├── billing_interval      text NOT NULL      -- 'month' | 'year'
├── billing_currency      text NOT NULL      -- ISO 3-letter, e.g. 'dkk'
├── subscription_status   text NOT NULL      -- mirrors Stripe: 'active' | 'past_due' | 'canceled' | 'trialing'
├── current_period_end    timestamptz        -- from Stripe webhook
├── created_at            timestamptz NOT NULL DEFAULT NOW()
├── updated_at            timestamptz NOT NULL DEFAULT NOW()
```

Upserted during provisioning. Updated by webhooks. Never deleted — canceled tenants keep a row with `subscription_status = 'canceled'`.

### Provision job changes (step 7)

After Clerk org is created (`store_id` + `clerk_org_id` are available):

```
stripe.customers.update(stripeCustomerId, {
  metadata: { store_id, clerk_org_id, mercflow_platform: 'true' }
})
stripe.subscriptions.update(stripeSubscriptionId, {
  metadata: { store_id, clerk_org_id, plan_tier, billing_interval }
})
// upsert platform_tenant_billing
```

### Webhook changes

Resolve tenant order of priority:
1. `subscription.metadata.store_id` (primary — available after provisioning)
2. `customer.metadata.store_id` (fallback — set slightly before subscription)
3. `invite_token_hash` in metadata (bootstrap fallback — only valid pre-provisioning)

### `GET /platform/billing/plans` route

```
GET /platform/billing/plans?currency=dkk

Response:
{
  plans: [
    {
      tier: "standard",
      name: "MercFlow Standard",
      interval: "month",
      currency: "dkk",
      amount: 29900,          // from Stripe price unit_amount
      price_id: "price_xxx"
    },
    { tier: "standard", interval: "year", currency: "dkk", amount: 299000, price_id: "price_yyy" },
    { tier: "pro",       interval: "month", currency: "dkk", amount: 59900, price_id: "price_aaa" },
    …
  ]
}
```

Amounts are read from Stripe at request time. Response cached in memory for 60s (TTL configurable).

### `POST /platform/signup/billing/setup` change

Accepts `{ price_id, invite_token, email, store_name }`. Backend validates `price_id` is an active MercFlow platform price before creating subscription. Removes `STRIPE_PLATFORM_PRICE_ID` env lookup.

---

## User journeys

### J001 — Merchant picks a plan at signup

**Actor:** Merchant (invited)
**Goal:** Choose Standard Monthly in DKK during signup

**Steps:**
1. Signup Step 3: merchant selects Denmark → currency auto-set to DKK
2. Signup Step 5: plan picker loads — shows 2 tiers × 2 intervals in DKK with Stripe-sourced amounts
3. Merchant selects "Standard — 299 DKK/month"
4. Merchant enters card in Stripe Payment Element
5. Submits → backend validates `price_id` → creates Stripe Customer + Subscription
6. Provisioning job runs → writes `store_id` + `clerk_org_id` to Stripe metadata → upserts `platform_tenant_billing`

**Acceptance:** `platform_tenant_billing` row exists with `plan_tier=standard`, `billing_interval=month`, `billing_currency=dkk`, `subscription_status=active` after provisioning.

---

### J002 — Operator views billing status in Platform Console

**Actor:** MercFlow operator
**Goal:** Confirm a new tenant is on an active paid plan

**Steps:**
1. Platform Console → Tenants → click tenant row
2. Billing panel shows: Standard, Monthly, DKK, Active, renews [date]
3. "View in Stripe" link → opens Stripe Dashboard customer page directly
4. Operator can see MRR, upcoming invoice, payment method

**Acceptance:** Panel reads from `platform_tenant_billing` (fast). "View in Stripe" constructs URL from `stripe_customer_id`. No Stripe API call needed to render panel — only for the live link.

---

### J003 — Webhook updates billing status on payment failure

**Actor:** Stripe webhook (`invoice.payment_failed`)
**Goal:** Mirror `past_due` status into MercFlow without operator action

**Steps:**
1. Stripe fires `invoice.payment_failed` — subscription transitions to `past_due`
2. MercFlow webhook handler resolves tenant via `subscription.metadata.store_id`
3. Updates `platform_tenant_billing.subscription_status = 'past_due'` + `updated_at`
4. Writes `platform_audit_log` entry: `action=billing_status_changed`, `entity_id=store_id`
5. Platform Console Tenant list shows status badge "Past due" (red)

**Acceptance:** `platform_tenant_billing` updated within 30s of Stripe event. `platform_audit_log` has entry. No operator action required.

---

### J004 — Operator suspends a tenant (billing + access in one action)

**Actor:** MercFlow operator
**Goal:** Suspend a tenant who has not paid after Stripe retries exhausted

**Steps:**
1. Platform Console → Tenant detail → "Suspend tenant"
2. Confirm dialog: "This will disable the store, revoke API keys, and cancel the Stripe subscription."
3. Operator confirms → backend:
   a. `stripe.subscriptions.cancel(subscription_id)` — immediate
   b. Disables Medusa `store.is_disabled = true`
   c. Revokes publishable API keys
   d. Updates `platform_tenant_billing.subscription_status = 'canceled'`
   e. Writes `platform_audit_log` entry
4. Tenant detail shows "Canceled" status badge

**Acceptance:** Stripe subscription canceled before function returns. Store inaccessible immediately. Audit log has operator email + action.

---

### J005 — Operator adds a new plan in Stripe Dashboard (no MercFlow deploy)

**Actor:** MercFlow operator (Stripe Dashboard)
**Goal:** Add Pro Annual EUR plan

**Steps:**
1. Operator opens Stripe Dashboard → Products → MercFlow Pro → Add Price
2. Sets: EUR, annual, amount, metadata: `mercflow_platform=true`, `mercflow_interval=year`
3. New signups from EUR-currency stores will see the new option within 60s (cache TTL)

**Acceptance:** No MercFlow code change or deploy required. Plan appears in signup Step 5 for EUR merchants.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `apps/backend` | `platform_tenant_billing` migration + raw SQL helpers |
| `apps/backend` | `GET /platform/billing/plans` route (Stripe catalog fetch + metadata filter + 60s cache) |
| `apps/backend` | Update `POST /platform/signup/billing/setup` — accept `price_id`, validate against Stripe, remove env price lookup |
| `apps/backend` | Provision job step 7 — write `store_id` + `clerk_org_id` to Stripe Customer + Subscription metadata + upsert `platform_tenant_billing` |
| `apps/backend` | Webhook handler — resolve tenant by `store_id` (primary), update `platform_tenant_billing` on all relevant events |
| `apps/backend` | Suspend action — cancel Stripe subscription as part of suspend operation |
| `apps/backend/.env.example` | Remove `STRIPE_PLATFORM_PRICE_ID` |
| `apps/platform-console` | Signup Step 5 — plan picker (tier cards + monthly/annual toggle) before Payment Element |
| `apps/platform-console` | Tenant detail billing panel — plan, interval, currency, status, current period end, Stripe Dashboard link |

---

## Success metrics

| Metric | Target |
|--------|--------|
| `STRIPE_PLATFORM_PRICE_ID` in codebase | 0 occurrences post-retrofit |
| Webhooks that fail to resolve `store_id` from Stripe metadata (after provisioning) | 0 |
| `platform_tenant_billing` row missing for any provisioned tenant | 0 |
| Suspend action leaves active Stripe subscription | 0 |
| Plan picker loads with correct amounts from Stripe | ✓ (smoke test) |
| `pnpm typecheck` + `pnpm test` | green |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Currency options on one Price vs. separate Price per currency? | **Separate Price objects per currency** — simpler to filter via metadata. Currency options are harder to query via API. Operator creates one Price per currency per tier/interval in Stripe Dashboard. |
| OQ-02 | Cache duration for `GET /platform/billing/plans`? | **60s in-memory TTL** per currency. Acceptable latency for signup (not a hot path). Operator can restart backend to force refresh if a new plan must appear immediately. |
| OQ-03 | What happens if `store_id` is not yet in Stripe metadata when a webhook arrives (narrow provisioning window)? | **Fallback to `invite_token_hash`** for events where `subscription.metadata.store_id` is absent. Log a warning. After provisioning completes, all future webhooks will resolve by `store_id`. |
