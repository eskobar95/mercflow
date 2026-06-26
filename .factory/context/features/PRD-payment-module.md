# PRD — Payment Module (M017)

> Version 1.0 — 2026-06-13
> Based on: /align session June 2026, CONTEXT.md
> Scope: MercFlow-owned payment abstraction layer — Stripe implementation, test/live mode, credential migration from connector-module

---

## Problem

MercFlow's current payment setup has three structural problems:

1. **No abstraction.** Stripe is called directly from `connector-module` — there is no interface separating MercFlow's payment logic from the Stripe SDK. Adding MobilePay or Klarna would require forking every payment touchpoint.

2. **Credential ownership is wrong.** `connector-module` was designed for "dumb" connectors (GTM, Shipmondo, Plunk). Stripe credentials live there today, but Stripe is not a connector — it is MercFlow's primary payment runtime. It needs its own module with explicit credential management, key rotation, and test/live scoping.

3. **No test/live mode toggle.** Merchants cannot switch between Stripe test and production keys from the admin. Changing keys requires a backend deploy. This makes onboarding and debugging harder and blocks the `subscription-module` from being testable per tenant.

The `subscription-module` (M015) calls Stripe directly to charge renewals. Once a second payment provider exists, or once test/live mode is introduced, the coupling breaks.

---

## Goals

1. A `payment-module` package implements `IPaymentProvider` — a stable interface for all payment operations.
2. `StripePaymentProvider` implements `IPaymentProvider` and is the first (and initially only) provider.
3. Per-tenant credentials table stores `test_*` + `live_*` keys and webhook secrets.
4. A `mode: "test" | "live"` toggle in Settings → Payments lets the merchant switch modes without redeploying.
5. `subscription-module` delegates all charge and subscription lifecycle calls to `payment-module`.
6. Stripe credentials are migrated out of `connector-module`. `connector-module` retains GTM, Plunk, Shipmondo.
7. Future providers (MobilePay, Klarna) can be added by implementing `IPaymentProvider` — no changes to `subscription-module` or admin UI.

---

## Non-goals (explicit)

- **MobilePay or Klarna implementation** — interface design only in v1; no second provider shipped.
- **Stripe Connect / platform billing** — that is M019 (Tenant Onboarding). This module handles per-store payment credentials, not MercFlow platform billing.
- **Storefront checkout flow changes** — checkout payment flow (Stripe Payment Element on the storefront) is not in scope. Only the credential management and subscription charge abstraction.
- **PCI scope changes** — card data never touches MercFlow servers. No change to tokenisation approach.
- **Dunning logic** — remains in `subscription-module` (status lifecycle) and Stripe's built-in retry.
- **Refund UI** — admin UI for refunds is a separate Order Management task (deferred).

---

## Architecture

### New package: `packages/payment-module`

Medusa DML module. Owns:

```
payment_provider_config
├── id
├── store_id                    (RLS scope)
├── provider                    enum: stripe | mobilepay | klarna
├── test_secret_key             text (encrypted at rest)
├── test_publishable_key        text
├── test_webhook_secret         text
├── live_secret_key             text (encrypted at rest)
├── live_publishable_key        text
├── live_webhook_secret         text
├── mode                        enum: test | live  (default: test)
├── created_at / updated_at
```

**Encryption:** Secret keys are encrypted before persistence using a server-side secret (`MERCFLOW_ENCRYPTION_KEY` env var). Keys are decrypted on read only within the module service — never returned raw to admin routes.

### `IPaymentProvider` interface

```typescript
interface IPaymentProvider {
  readonly providerKey: string

  // One-time checkout
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>
  capturePayment(params: CapturePaymentParams): Promise<PaymentResult>
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>

  // Recurring
  createSubscription(params: CreateSubscriptionParams): Promise<ProviderSubscription>
  chargeSubscription(params: ChargeSubscriptionParams): Promise<ChargeResult>
  pauseSubscription(subscriptionId: string): Promise<void>
  cancelSubscription(subscriptionId: string): Promise<void>

  // Webhooks
  handleWebhook(payload: Buffer, signature: string, secret: string): Promise<WebhookEvent>
  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean
}
```

### `StripePaymentProvider`

Implements `IPaymentProvider`. Reads active credentials from the module's credentials table for the current `store_id`. All Stripe SDK calls go through this class.

### Module service: `PaymentModuleService`

Extends `MedusaService`. Key methods:

- `getActiveProvider(storeId)` — returns the instantiated provider for the store's configured mode
- `upsertProviderConfig(storeId, provider, config)` — save/update credentials
- `setMode(storeId, mode)` — toggle test/live
- `getPublishableKey(storeId)` — returns publishable key for current mode (safe to return to admin UI)

### connector-module changes

- Remove `StripeConfig` model and all Stripe credential storage
- Remove `getStripeClient()` helper
- Retain: `GtmConfig`, `PlunkConfig`, `ShipmondoConfig`
- Migration: `down()` adds stripe columns back; `up()` removes them

### subscription-module changes

- Replace direct `Stripe` SDK calls with `PaymentModuleService.getActiveProvider(storeId)`
- BullMQ `charge-subscription` job resolves payment provider per store at job execution time

---

## User journeys

### J001 — Merchant configures Stripe credentials for the first time

**Actor:** Merchant-admin (first time, just onboarded)
**Goal:** Connect Stripe so the store can take payments

**Steps:**
1. Store Admin → Settings → Payments
2. Section: "Stripe" — status: Not configured
3. Two tabs: "Test" / "Live" — Test is active by default
4. Merchant enters: Secret key (`sk_test_…`), Publishable key (`pk_test_…`), Webhook secret (`whsec_…`)
5. MercFlow shows webhook endpoint URL to register in Stripe Dashboard: `https://[domain]/webhooks/stripe`
6. Save → credentials encrypted + persisted. Mode stays "test".
7. Status badge → "Test mode — connected"

**Acceptance:** `payment_provider_config` row created with encrypted test keys. Publishable key returned to admin UI (not secret key). Mode is `test`.

---

### J002 — Merchant switches to live mode before launch

**Actor:** Merchant-admin
**Goal:** Go live with real Stripe payments

**Steps:**
1. Settings → Payments → "Live" tab
2. Enters live keys (`sk_live_…`, `pk_live_…`, `whsec_live_…`)
3. Saves live credentials
4. Clicks "Activate live mode" toggle
5. Confirmation: "Switching to live mode will process real payments"
6. Confirms → mode updated to `live`
7. Badge → "Live mode — active"

**Acceptance:** `mode` updated to `live`. BullMQ workers pick up mode on next job. Test credentials preserved (not deleted). Webhook endpoint uses live `whsec_live_*` for HMAC validation.

---

### J003 — Subscription renewal job charges via payment-module

**Actor:** BullMQ `charge-subscription` worker (automated)
**Goal:** Charge a customer's due subscription renewal

**Steps:**
1. Renewal job fires; reads `store_id` from subscription record
2. Calls `PaymentModuleService.getActiveProvider(storeId)` → resolves `StripePaymentProvider` in live mode
3. Calls `provider.chargeSubscription(params)` → Stripe PaymentIntent created
4. On success: order confirmed, `next_renewal_at` advanced, renewal log entry written
5. On failure: `past_due` status, `handle-renewal-failure` job enqueued

**Acceptance:** No direct Stripe SDK import in `subscription-module`. Provider is resolved at runtime per store. Idempotency key on charge: `sub_{subscription_id}_{renewal_date}`.

---

### J004 — Platform adds MobilePay as a payment provider (future)

**Actor:** Platform engineer (MercFlow team)
**Goal:** Ship MobilePay support without touching subscription-module or admin UI form logic

**Steps:**
1. Create `MobilePayPaymentProvider implements IPaymentProvider` in `payment-module`
2. Add `mobilepay` to `payment_provider_config.provider` enum (migration)
3. Add MobilePay credential fields to the config table (migration)
4. Settings → Payments automatically shows a MobilePay tab (driven by registered providers)
5. `subscription-module` unchanged; `getActiveProvider()` resolves MobilePay when configured

**Acceptance:** `subscription-module` has no MobilePay-specific code. Admin UI form renders from provider registration, not hardcoded tabs.

---

## Deliverables

| Area | Deliverable |
|------|-------------|
| `packages/payment-module` | `IPaymentProvider` interface, `StripePaymentProvider`, `payment_provider_config` DML model, `PaymentModuleService`, migrations |
| `packages/connector-module` | Remove Stripe config model + helper; migration `down()` preserves rollback path |
| `packages/subscription-module` | Replace direct Stripe SDK calls with `payment-module` service; update BullMQ job handlers |
| `apps/backend` | Register `payment-module` in `medusa-config.ts`; Stripe webhook route uses `payment-module` HMAC validation |
| `packages/admin-ui` | Settings → Payments page: provider config form, test/live tabs, mode toggle, status badge |
| `packages/payment-module` | `README.md` with field definitions, API reference, encryption notes, webhook setup guide |

---

## Success metrics

| Metric | Target |
|--------|--------|
| Mode toggle round-trip (DB write + worker picks up) | < 5s |
| Webhook HMAC verification | 100% (never bypass) |
| Direct Stripe SDK imports in `subscription-module` | 0 after migration |
| Test/live key rotation requires no backend deploy | Yes |
| `pnpm test` for payment-module service methods | ≥ 80% coverage |

---

## Open questions

| # | Question | Decision |
|---|----------|----------|
| OQ-01 | Encryption at rest for secret keys — AES-256-GCM via `MERCFLOW_ENCRYPTION_KEY` env var, or defer to Hetzner infra-level encryption? | **AES-256-GCM** in the module service. Env var `MERCFLOW_ENCRYPTION_KEY` (32-byte hex) required at startup. Keys encrypted before `INSERT`, decrypted on read — never returned to API callers. |
| OQ-02 | Should `payment-module` also handle one-time checkout (Stripe Payment Element), or only subscription charges in v1? | **Subscription charges only in v1.** One-time checkout currently handled by Medusa's payment provider. Checkout abstraction deferred to v2. |
| OQ-03 | Webhook endpoint — `/webhooks/stripe` or per-mode endpoints? | **Single endpoint** `/webhooks/stripe`. Module service reads mode-appropriate `webhook_secret` per `store_id` (resolved from `Host` header). |
