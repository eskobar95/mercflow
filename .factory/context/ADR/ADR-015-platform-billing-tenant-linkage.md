# ADR-015 — Platform Billing: Canonical Tenant↔Stripe Linkage

**Date:** 2026-06-13
**Status:** Accepted
**Deciders:** Nicklas Eskou, AI Factory (/align session June 2026)
**Related PRD:** PRD-platform-billing-retrofit.md (M020)

---

## Context

M019 shipped platform billing with a loose tenant↔Stripe linkage:

- Stripe Customer and Subscription only carried `invite_token_hash` in metadata at creation time
- `store_id` was written to Stripe Customer metadata during provisioning, but **not** to the Subscription
- Webhook handlers resolved tenant via `invite_token_hash` — not `store_id`
- No MercFlow-owned table indexed the relationship between `store_id` and Stripe billing objects
- Suspending a tenant from Platform Console did not cancel the Stripe subscription

This is a bootstrap that worked for M019's scope but must be corrected before the second tenant is onboarded — otherwise billing reconciliation requires manual Stripe Dashboard lookups, subscription continuations after suspension, and fragile webhook routing.

---

## Decision

### 1. `store_id` is the canonical billing key

`store_id` (Medusa Store ID) is written to **both** Stripe Customer metadata **and** Stripe Subscription metadata during provisioning, immediately after `store_id` is created. Webhooks resolve tenant by `subscription.metadata.store_id` (primary) → `customer.metadata.store_id` (fallback) → `invite_token_hash` (bootstrap fallback, narrow window only).

Stripe metadata fields set on both objects:
```
store_id       = "store_01…"
clerk_org_id   = "org_…"
mercflow_platform = "true"
```
Subscription additionally carries:
```
plan_tier      = "standard" | "pro"
billing_interval = "month" | "year"
```

### 2. `platform_tenant_billing` is MercFlow's authoritative billing index

A platform-level table (not Medusa DML) with PK `store_id`. Upserted during provisioning. Updated by webhooks. Never deleted (canceled tenants retain row with `subscription_status='canceled'`).

This table is the source of truth for Platform Console (fast reads, no per-row Stripe API calls for the list view).

### 3. Plans come from Stripe API, not env

`GET /platform/billing/plans?currency=xxx` fetches active prices from Stripe filtered by `mercflow_platform=true` metadata. No `STRIPE_PLATFORM_PRICE_ID` in env. The three platform env vars are: `STRIPE_PLATFORM_SECRET_KEY`, `STRIPE_PLATFORM_PUBLISHABLE_KEY`, `STRIPE_PLATFORM_WEBHOOK_SECRET`.

### 4. Suspend = store disable + API key revoke + Stripe subscription cancel (atomic from MercFlow's perspective)

All three happen in the same operator action. No state where a suspended store still has an active Stripe subscription.

---

## Options considered

### Option A — Keep `invite_token_hash` as primary webhook key, add `store_id` as secondary
Minimal change. Extend current webhook to also write `store_id` when present.

**Rejected:** Two lookup paths with different reliability. `invite_token_hash` becomes stale after provisioning but remains in metadata — risk of ambiguity. Does not address missing billing index or suspend incompleteness.

### Option B — `store_id` as primary, `platform_tenant_billing` table, plans from Stripe API (chosen)
Full retrofit. Single canonical key. Persistent index. Correct suspend.

**Chosen:** Consistent with MercFlow's multi-tenant model (everything keyed on `store_id`). Prevents drift as tenant count grows.

---

## Consequences

**Positive:**
- Webhook routing is unambiguous after provisioning
- Platform Console tenant list reads billing status without Stripe API calls
- Suspend is complete — no ghost subscriptions
- Adding a new plan/currency requires zero MercFlow code changes (Stripe Dashboard only)

**Negative / mitigations:**
- One-time provision job update to write both Customer + Subscription metadata. Backward-compatible — existing Guapo tenant (internal, no platform billing) is unaffected.
- `platform_tenant_billing` migration required before M020 ships.

---

## Scope

Applies to all MercFlow platform billing operations. Every Stripe platform event must be traceable to a `store_id` via Stripe metadata or `platform_tenant_billing`.

---

## Enforcement

```bash
# No STRIPE_PLATFORM_PRICE_ID in codebase
rg "STRIPE_PLATFORM_PRICE_ID" .
# Must return 0 results after M020

# platform_tenant_billing has a row for every non-internal provisioned tenant
# Verified by integration test in M020 sprint
```

---

## How to fix a violation

**If `STRIPE_PLATFORM_PRICE_ID` is found in code or env:**
→ Replace with `GET /platform/billing/plans` catalog fetch + `price_id` from request body (validated against Stripe).

**If a webhook cannot resolve `store_id`:**
→ Check that provision job step 7 ran `stripe.subscriptions.update()` with `store_id` in metadata. If missing (legacy), backfill via `stripe.subscriptions.update(sub_id, { metadata: { store_id } })` for that tenant.

**If a tenant row is missing from `platform_tenant_billing`:**
→ Backfill from Stripe: retrieve customer by `stripe_customer_id` from `platform_invite`, extract subscription, upsert row. Documented in `infra/RUNBOOK.md`.
