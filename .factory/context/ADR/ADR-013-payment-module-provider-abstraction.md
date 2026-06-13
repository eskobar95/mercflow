# ADR-013 — Payment Module Provider Abstraction

**Date:** 2026-06-13
**Status:** Accepted
**Deciders:** Nicklas Eskou, AI Factory (/align session June 2026)
**Related PRD:** PRD-payment-module.md (M017)

---

## Context

MercFlow needs to process payments for checkout and recurring subscription charges. Until M017, Stripe is called directly from `connector-module` with no abstraction. This creates three problems:

1. Adding a second payment provider (MobilePay, Klarna) requires changes in `subscription-module`, `connector-module`, and admin UI simultaneously.
2. Credentials for payment providers have different lifecycle and security requirements (test/live mode, key rotation, HMAC secrets) compared to non-payment connectors (GTM tag IDs, Shipmondo API keys).
3. `subscription-module` cannot be tested safely per tenant without a test/live mode toggle.

---

## Decision

Create a new `packages/payment-module` that owns:
- `IPaymentProvider` interface (all payment operations)
- `StripePaymentProvider` (first implementation)
- `payment_provider_config` DML model (credentials + mode per tenant)
- `PaymentModuleService` (resolves active provider, manages credentials)

Remove Stripe credential storage from `connector-module`. `connector-module` retains non-payment connectors (GTM, Plunk, Shipmondo).

`subscription-module` calls `payment-module` for charge execution. No direct Stripe SDK imports remain in `subscription-module` after M017.

---

## Options considered

### Option A — Keep Stripe in `connector-module`, add interface layer there
Add `IPaymentProvider` to `connector-module` and extract Stripe behind it. No new package.

**Rejected:** `connector-module`'s purpose is shallow credential storage for dumb connectors. Adding a full payment abstraction layer, credential encryption, mode toggling, and webhook HMAC management to it would make it the wrong abstraction. Module responsibility would be split between "connect external services" and "be a payment runtime".

### Option B — New `payment-module` (chosen)
Own package with explicit responsibility: payment abstraction, credential management, provider resolution.

**Chosen:** Clear module boundary. `connector-module` stays focused. Future providers are additive (no existing code changes). Credential encryption lives in one place.

---

## Consequences

**Positive:**
- Adding MobilePay or Klarna is `implements IPaymentProvider` — no `subscription-module` or admin UI changes.
- Credential encryption (`AES-256-GCM`) lives in one module — not spread across `connector-module`.
- Test/live mode is per-tenant and admin-controllable without backend deploy.
- `subscription-module` has a stable dependency on `payment-module` interface, not on Stripe SDK version.

**Negative / mitigations:**
- One-time migration: Stripe credentials move from `connector-module` to `payment-module`. A migration with clear `down()` handles rollback. All existing data preserved.
- New package to maintain. Offset by the fact that it replaces Stripe code scattered across modules.

---

## Scope

Applies to all future payment provider integrations in MercFlow. Any code that processes a payment, creates a Stripe object, or validates a payment webhook must go through `payment-module`.

**Out of scope:** Medusa's built-in `IPaymentProvider` pattern (for storefront checkout via Medusa payment sessions). MercFlow's `payment-module` is for subscription charges and platform billing. Storefront checkout payment delegation is a separate concern (deferred to v2).

---

## Enforcement

```bash
# No direct Stripe SDK imports outside payment-module
rg "from ['\"]stripe['\"]" packages/ --glob "!packages/payment-module/**"
# Should return 0 results after M017 migration
```

CI: add this check to `security.yml` after M017 ships.

---

## How to fix a violation

If `rg "from 'stripe'"` returns results outside `packages/payment-module/`:

1. Move the Stripe logic to `StripePaymentProvider` in `payment-module`.
2. Call `PaymentModuleService.getActiveProvider(storeId)` in the calling module.
3. Use the `IPaymentProvider` method instead of the Stripe SDK method directly.
