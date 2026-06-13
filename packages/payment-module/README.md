# @mercflow/payment-module

MercFlow Medusa v2 module for payment provider abstraction, per-tenant credential storage, test/live mode, and Stripe implementation (M017 foundation — T079).

## Responsibility

- `IPaymentProvider` interface — stable contract for checkout, capture, refund, subscription charges, and webhooks
- `StripePaymentProvider` — first implementation; reads mode-scoped credentials per store
- `payment_provider_config` DML model — encrypted secret keys, publishable keys, webhook secrets, mode toggle
- `PaymentModuleService` — credential upsert, mode switching, active provider resolution
- PostgreSQL RLS via `app.tenant_id`

Does **not** belong here: admin Settings → Payments UI (T082), Stripe credential migration from `connector-module` (T080), subscription-module charge delegation (T081), storefront checkout Payment Element (deferred v2).

## Field definitions — `payment_provider_config`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `provider` | enum NOT NULL default `stripe` | `stripe` \| `mobilepay` \| `klarna` |
| `test_secret_key` | text nullable | AES-256-GCM encrypted (`sk_test_*`); never returned via API |
| `test_publishable_key` | text nullable | Safe for admin UI |
| `test_webhook_secret` | text nullable | Stripe `whsec_*` for test mode |
| `live_secret_key` | text nullable | AES-256-GCM encrypted (`sk_live_*`); never returned via API |
| `live_publishable_key` | text nullable | Safe for admin UI |
| `live_webhook_secret` | text nullable | Stripe `whsec_*` for live mode |
| `mode` | enum NOT NULL default `test` | `test` \| `live` — active credential set |
| `deleted_at` | timestamptz nullable | Soft delete |

Unique index: one row per `(store_id, provider)`.

## Tenancy

| Table | Policy | Scope |
|-------|--------|-------|
| `payment_provider_config` | `payment_provider_config_tenant_isolation` | `store_id = current_setting('app.tenant_id', true)` |

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction (`tenant-scope.ts`).

## Encryption

Secret keys (`test_secret_key`, `live_secret_key`) are encrypted at rest with **AES-256-GCM** before `INSERT`/`UPDATE`.

| Setting | Value |
|---------|-------|
| Env var | `MERCFLOW_ENCRYPTION_KEY` |
| Format | 64-character hex string (32 bytes) |
| Ciphertext prefix | `mf1:` + base64(iv \|\| authTag \|\| ciphertext) |
| Startup | Module registration fails if env var missing (skipped under Vitest) |

Decryption happens only inside `PaymentModuleService.getActiveProvider()` — secret keys are never included in public config responses.

Generate a local key:

```bash
openssl rand -hex 32
```

## Service methods

| Method | Description |
|--------|-------------|
| `getActiveProvider(storeId, provider?)` | Returns instantiated `IPaymentProvider` with decrypted credentials for current mode |
| `upsertProviderConfig(storeId, input)` | Create/update credentials; encrypts secret keys on write |
| `setMode(storeId, mode, provider?)` | Toggle `test` / `live` without redeploy |
| `getPublishableKey(storeId, provider?)` | Returns publishable key for active mode (safe for admin UI) |
| `getProviderConfig(storeId, provider?)` | Public config snapshot (no secret keys) |
| `verifyWebhookSignature(payload, signature, secret)` | Stripe HMAC verification helper |

## `IPaymentProvider` methods

| Method | v1 status |
|--------|-----------|
| `chargeSubscription` | Implemented (Stripe PaymentIntent, off-session) |
| `handleWebhook` / `verifyWebhookSignature` | Implemented |
| `createCheckoutSession`, `capturePayment`, `refundPayment` | Throws `PaymentNotImplementedError` (checkout deferred v2) |
| `createSubscription`, `pauseSubscription`, `cancelSubscription` | Throws `PaymentNotImplementedError` (lifecycle in later tasks) |

## Webhook setup

Register a single endpoint in the Stripe Dashboard:

```
https://[store-domain]/webhooks/stripe
```

The module resolves the mode-appropriate `webhook_secret` per `store_id` (from `Host` header on public routes — wired in T080). HMAC validation must never be bypassed.

## Module registration

Registered in `apps/backend/medusa-config.ts`:

```ts
{
  resolve: "@mercflow/payment-module",
}
```

Resolve from Medusa container:

```ts
import { PAYMENT_MODULE } from "@mercflow/payment-module"
import type PaymentModuleService from "@mercflow/payment-module"

const paymentService = container.resolve(PAYMENT_MODULE) as PaymentModuleService
const provider = await paymentService.getActiveProvider(storeId)
await provider.chargeSubscription({ ... })
```

## Migration workflow

```bash
# From repo root (runs all module migrations via backend)
pnpm migration:run

# Package-local (requires DATABASE_URL)
pnpm --filter @mercflow/payment-module db:migrate
pnpm --filter @mercflow/payment-module db:revert
```

Migrations:

| File | Purpose |
|------|---------|
| `Migration20260613120000CreatePaymentProviderConfig.ts` | Table + RLS policy |

Every migration includes a decision log comment and reversible `down()`.

## Run and test in isolation

```bash
pnpm --filter @mercflow/payment-module typecheck
pnpm --filter @mercflow/payment-module test
```

RLS integration tests (`test/tenancy-rls-db.integration.test.ts`) require `DATABASE_URL` and a migrated database; they skip automatically when unavailable.

## Related ADRs / PRDs

- ADR-013 — Payment module provider abstraction
- PRD-payment-module.md — M017 scope, user journeys, encryption decision (OQ-01)
