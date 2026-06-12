# @mercflow/subscription-module

MercFlow Medusa v2 module for product subscriptions, renewal audit logs, Customer Club configuration, and admin lifecycle APIs (M015 foundation — T071).

## Responsibility

- DML models: `subscription`, `subscription_renewal_log`, `subscription_config`
- Tenant-scoped service layer with lifecycle methods (create, list, get, pause, cancel, resume, update renewal timestamp)
- Admin HTTP routes for listing, detail (with renewal log), pause, cancel, and resume
- PostgreSQL RLS via `app.tenant_id` (renewal log scoped through `subscription_id` join)

Does **not** belong here: BullMQ renewal worker (T072), subscription list admin UI (T073), per-product club pricing UI (T075).

## Field definitions — `subscription`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `customer_id` | text NOT NULL | Medusa customer FK |
| `product_id` | text NOT NULL | Medusa product FK |
| `variant_id` | text NOT NULL | Medusa variant FK |
| `interval` | enum NOT NULL default `monthly` | `weekly` \| `biweekly` \| `monthly` \| `quarterly` |
| `status` | enum NOT NULL default `active` | `active` \| `paused` \| `cancelled` \| `past_due` \| `pending_payment` |
| `stripe_subscription_id` | text nullable | Stripe Billing reference (optional v2 path) |
| `current_period_start` | timestamptz NOT NULL | Current billing period start |
| `current_period_end` | timestamptz NOT NULL | Current billing period end |
| `next_renewal_at` | timestamptz NOT NULL | Next scheduled renewal (worker reads this) |
| `cancelled_at` | timestamptz nullable | Set when status → `cancelled` |
| `pause_requested_at` | timestamptz nullable | Set when paused |
| `deleted_at` | timestamptz nullable | Soft delete |

## Field definitions — `subscription_renewal_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `subscription_id` | text NOT NULL | FK → `subscription.id` |
| `order_id` | text NOT NULL | Medusa order created for renewal |
| `amount` | numeric NOT NULL | Charged amount |
| `currency` | text NOT NULL | ISO currency code |
| `status` | enum NOT NULL default `success` | `success` \| `failed` \| `skipped` |
| `stripe_payment_intent_id` | text nullable | Stripe PaymentIntent id |
| `error_message` | text nullable | Failure detail |
| `deleted_at` | timestamptz nullable | Soft delete |

No direct `store_id` — RLS policy joins parent `subscription` on `store_id = app.tenant_id`.

## Field definitions — `subscription_config`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL UNIQUE | One config row per store; RLS |
| `club_enabled` | boolean NOT NULL default `false` | Customer Club toggle |
| `club_stripe_product_id` | text nullable | Stripe product for membership (T074) |
| `club_price_monthly` | numeric nullable | Monthly membership price |
| `club_price_annual` | numeric nullable | Annual membership price |
| `club_fallback_discount_pct` | numeric nullable | Fallback % off when no explicit member price |
| `club_name` | text nullable | Display name (e.g. "VIP Klub") |
| `deleted_at` | timestamptz nullable | Soft delete |

## Tenancy

RLS policies:

| Table | Policy | Scope |
|-------|--------|-------|
| `subscription` | `subscription_tenant_isolation` | `store_id = current_setting('app.tenant_id', true)` |
| `subscription_config` | `subscription_config_tenant_isolation` | `store_id = current_setting('app.tenant_id', true)` |
| `subscription_renewal_log` | `subscription_renewal_log_tenant_isolation` | EXISTS join on parent `subscription` |

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction (`tenant-scope.ts`).

## Service methods

- `createSubscription(storeId, input)` — create subscription row (checkout / worker use)
- `listSubscriptions(storeId, { status?, customer_id? }, { limit?, offset? })`
- `getSubscription(storeId, id)` — subscription + renewal logs
- `pauseSubscription(storeId, id, { pause_until? })` — active → paused
- `cancelSubscription(storeId, id)` — sets `cancelled_at`
- `resumeSubscription(storeId, id)` — paused → active; recalculates `next_renewal_at`
- `updateRenewalTimestamp(storeId, id, { next_renewal_at, ... })` — worker advance after renewal
- `getSubscriptionConfig(storeId)` / `getOrCreateSubscriptionConfig(storeId)` — per-store Customer Club config
- `upsertSubscriptionConfig(storeId, input, { scope, stripeSecretKey })` — save config and sync Stripe club product

## Admin API

All routes require `?store_id=` (or `MERCFLOW_DEFAULT_STORE_ID` in local dev).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/subscriptions` | List subscriptions (`?limit&offset&status&customer_id&store_id=`) |
| GET | `/admin/subscriptions/:id` | Detail with `renewal_logs` |
| POST | `/admin/subscriptions/:id/pause` | Pause active subscription |
| POST | `/admin/subscriptions/:id/cancel` | Cancel subscription |
| POST | `/admin/subscriptions/:id/resume` | Resume paused subscription |
| GET | `/admin/customers/:id/subscriptions` | Subscriptions for one customer |
| GET | `/admin/subscription-config` | Customer Club config (`club_enabled`, prices, fallback %) |
| PUT | `/admin/subscription-config` | Save config; creates/updates Stripe Product + Prices when enabled |

Store webhook (Stripe HMAC via `stripe.webhooks.constructEvent`):

| Method | Path | Description |
|--------|------|-------------|
| POST | `/store/club-membership/webhook` | `customer.subscription.created` → add to `club_members` group; `customer.subscription.deleted` → remove |

Pause body (optional, Zod-validated):

```json
{
  "pause_until": "2026-07-01T00:00:00.000Z"
}
```

List/detail responses include hydrated `customer_display` and `product_label` from Medusa core entities.

## Migration workflow

From repo root (with `DATABASE_URL` set):

```bash
pnpm --filter @mercflow/subscription-module db:migrate
pnpm migration:run
```

Generate after DML changes:

```bash
cd packages/subscription-module
pnpm db:generate
```

Revert last migration locally:

```bash
pnpm db:revert
```

## Local development

```bash
pnpm --filter @mercflow/subscription-module typecheck
pnpm --filter @mercflow/subscription-module test
```

RLS integration tests (`test/tenancy-rls-db.integration.test.ts`) run when `DATABASE_URL` is set and migrations have been applied.

## Module registration

Registered in `apps/backend/medusa-config.ts` as `@mercflow/subscription-module`. Admin routes are re-exported from `apps/backend/src/api/admin/subscriptions/`.
