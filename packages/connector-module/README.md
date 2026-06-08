# @mercflow/connector-module

MercFlow Medusa v2 module that persists **per-store connector credentials** (`connector_config`), audit rows (`connector_log`), and exposes admin/store HTTP handlers for configuring integrations such as Shipmondo and Stripe.

## Responsibility

- DML models and migrations for `connector_config` + `connector_log`.
- AES-256-GCM encryption for stored credentials (`MERCFLOW_CONNECTOR_ENCRYPTION_KEY`), `mf1:`-prefixed ciphertext.
- Module service helpers for summarising connector availability, activation, last connection tests, **Shipmondo** persistence and connectivity probes, **Stripe-specific** behaviours (credential save, Stripe API test, catalogue sync to Stripe Prices, payment-intent summaries, storefront VAT hint), **Plunk-specific** credential storage and connectivity probes, and **GTM-specific** container ID persistence for storefront injection.
- Admin and store HTTP handlers (`/admin/connectors`, `/admin/connectors/shipmondo/*`, `/admin/connectors/stripe/*`, `/admin/connectors/plunk/*`, `/admin/connectors/gtm`, `/v1/store/connectors/shipmondo/active`, `/v1/store/connectors/shipmondo/rules`, `/v1/store/connectors/stripe/vat`, `/v1/store/connectors/gtm`), re-exported from `apps/backend` for Medusa route discovery.

## Field definitions (`connector_config`)

| Column                     | Type        | Notes |
|----------------------------|-------------|-------|
| `id`                       | text (pk)   | Medusa `model.id()` |
| `type`                     | text        | Stable slug: `shipmondo`, `stripe`, `plunk`, `gtm` |
| `credentials_encrypted`    | text        | `mf1:`-prefixed AES-GCM payload at rest (e.g. `{ "container_id": "GTM-…" }` for `gtm`); never returned decrypted from admin overview routes except server-side connector calls |
| `active`                   | boolean     | Whether the integration is switched on — storefront Shipmondo gate reads this together with configured credentials |
| `last_tested_at`           | timestamptz | Nullable — timestamp of last connectivity probe run |
| `vat_mode`                 | text        | Stripe storefront hint: `inclusive` \| `exclusive` — exposed at `GET /v1/store/connectors/stripe/vat` |
| `secret_key_last4`         | text        | Nullable — last four chars of Stripe secret key for masked admin previews only |
| `publishable_key_last4`    | text        | Nullable — last four chars of publishable key preview |
| `webhook_secret_last4`     | text        | Nullable — last four chars of webhook secret preview |
| `connection_status`        | text        | Nullable — `ok` / `error` after the last outbound probe |
| `last_test_message`        | text        | Nullable — human-readable (non-sensitive) probe summary |
| `rules_json`               | jsonb       | Nullable — integration-specific **non-secret** settings. Shipmondo persists `{ "markup_amount_minor": number, "free_shipping_threshold_minor": number, "enabled_carrier_codes": string[] }` where `enabled_carrier_codes` stores Shipmondo `product_code` values that remain selectable at checkout. |

## Field definitions (`connector_log`)

| Column         | Type      | Notes                                                                 |
|----------------|-----------|-----------------------------------------------------------------------|
| `id`           | text (pk) | Medusa `model.id()`                                                   |
| `connector_id` | text    | Matches `connector_config.id`                                         |
| `event`        | text      | Machine-readable keys such as `connection_test_pass` or `stripe.sync_products.complete` |
| `payload_json` | jsonb     | Safe metadata (`summary`, optional `http_status`, `success`)       |

## Runtime helpers

- `@mercflow/connector-module/resolve-stripe-secret-key` — `mercflowResolveStripeSecretKey(scope)` returns the Stripe secret key from encrypted config when configured, falling back to `STRIPE_API_KEY` / `STRIPE_SECRET_KEY`.
- `@mercflow/connector-module/mercflow-plunk-runtime-credentials` — `resolvePlunkSecretApiKeyWithFallback(container)` returns `sk_*` from encrypted config when configured, falling back to `PLUNK_SECRET_KEY` for deployments that still rely on env injection.
- `@mercflow/connector-module/mercflow-shipmondo-runtime-credentials` — `resolveShipmondoCredentialsWithFallback(container)` returns `{ api_user, api_key, shipping_module_key? }` from encrypted `connector_config` when persisted, falling back to `SHIPMONDO_API_USER` / `SHIPMONDO_API_KEY` when the connector row is absent or not yet migrated.

## HTTP API

### Connector overview

| Method | Path                               | Purpose |
|--------|------------------------------------|---------|
| `GET`  | `/admin/connectors`                | Overview: `{ connectors: [{ type, active, configured, lastTestedAt, connectionHealth }] }` |

### Shipmondo admin surface

| Method | Path                                | Purpose |
|--------|-------------------------------------|---------|
| `GET`  | `/admin/connectors/shipmondo`       | Returns `{ data: ShipmondoAdminGetDto }` (camelCase, **never exposes plaintext secrets), including `shippingRules` read from `rules_json`. |
| `PATCH`| `/admin/connectors/shipmondo`       | Zod-validated credential + `active` updates; AES encrypts payloads at rest. |
| `POST` | `/admin/connectors/shipmondo/test` | Calls Shipmondo's public shipments endpoint via Basic auth → `{ success, message?, error? }`. |
| `GET`  | `/admin/connectors/shipmondo/carriers` | Proxies `GET https://app.shipmondo.com/api/public/v3/products` (default `country_code=DK`, override via `country_code` query) → `{ data: [{ productCode, carrierCode?, name, basePriceMinor }] }`. |
| `PATCH`| `/admin/connectors/shipmondo/rules` | Persists non-secret `{ markupAmountMinor, freeShippingThresholdMinor, enabledCarrierCodes[] }` into `rules_json` (stored keys remain snake_case in the DB payload). |

### Shipmondo storefront gate

| Method | Path                                 | Purpose |
|--------|--------------------------------------|---------|
| `GET`  | `/v1/store/connectors/shipmondo/active` | `{ data: { active } }` — Shipmondo is only advertised when ciphertext exists **and** the operator toggle stays on. |
| `GET`  | `/v1/store/connectors/shipmondo/rules` | `{ data: { active, markupAmountMinor, freeShippingThresholdMinor, enabledCarrierCodes } }` — public read model so storefront checkout calculators can honour connector pricing without ENV secrets. Duplicate `active` guard mirrors the activation endpoint for defensive consumers. |

> **Checkout integration:** register `@mercflow/connector-module/mercflow-shipmondo-fulfillment-provider` under the Fulfillment module `providers` option (see `apps/backend/medusa-config.ts`). Create **calculated** shipping options whose `data` includes:
> - `mercflow_shipmondo_product_code` — Shipmondo `product_code` from the carrier catalogue
> - `mercflow_shipmondo_base_price_minor` — baseline retail price in minor units (e.g. DKK øre) taken from the catalogue `basePriceMinor`
>
> At quote time Medusa runs `calculateShippingOptionsPricesWorkflow`, which invokes the MercFlow Shipmondo fulfillment provider so checkout honours `rules_json` markup, free-shipping threshold, and enabled product codes. Composer integrations can still import `@mercflow/connector-module/mercflow-shipmondo-checkout-pricing` for the same pure calculator (`calculateShipmondoCheckoutShippingMinor`).

> **Operational note:** External apps that previously depended on raw `SHIPMONDO_API_*` secrets should migrate to these APIs so deployments no longer mandate environment variables once credentials are persisted.

### Stripe (`type = stripe`)

Admin responses use `{ data: ... }`. Credentials are stored encrypted (`credentials_encrypted`); admin reads return **masked** previews built from `*_last4` fields.

| Method  | Path                                    | Purpose |
|---------|-----------------------------------------|---------|
| `GET`   | `/admin/connectors/stripe`              | Stripe connector summary: `configured`, `active`, `vat_mode`, masked keys, `last_tested_at` |
| `PATCH` | `/admin/connectors/stripe`             | Upsert Stripe keys / webhook secret and optional `vat_mode` / `active` (Zod-validated body) |
| `POST`  | `/admin/connectors/stripe/test`         | Validates configured secret key against Stripe API |
| `POST`  | `/admin/connectors/stripe/sync-products` | Full MercFlow catalogue → Stripe Products + Prices (idempotent via `metadata.medusa_product_id` / `medusa_variant_id`). Created prices set Stripe `tax_behavior` from persisted `vat_mode` (`inclusive` / `exclusive`). Product-only price rows use metadata `medusa_variant_id = __product_only`. |
| `GET`   | `/admin/connectors/stripe/payments`     | Recent Stripe PaymentIntents overview (`limit` query, default `20`, max `50`) |

Storefront VAT hint (unauthenticated catalog/checkout integrations may read this; enforce your own auth if needed):

| Method | Path                                  | Purpose |
|--------|---------------------------------------|---------|
| `GET`  | `/v1/store/connectors/stripe/vat`        | `{ data: { vat_mode } }` where `vat_mode` is `inclusive` or `exclusive` |

### Plunk (`type = plunk`)

| Method | Path                               | Purpose |
|--------|------------------------------------|---------|
| `GET`  | `/admin/connectors/plunk`         | Masked credential summary + probe metadata |
| `PATCH`| `/admin/connectors/plunk`         | Upsert encrypted Plunk credential JSON |
| `POST` | `/admin/connectors/plunk/test`    | Connectivity probe (`/v1/track` by default or `/v1/send` when `test_email` is provided) |

### GTM (`type = gtm`)

| Method | Path                      | Purpose |
|--------|---------------------------|---------|
| `GET`  | `/admin/connectors/gtm`   | `{ container_id: string \| null }` for the storefront GTM container identifier |
| `PATCH`| `/admin/connectors/gtm`   | Persists `{ container_id }` (`GTM-` + alphanumeric; case-insensitive input, stored uppercase) encrypted like other connectors |
| `GET`  | `/v1/store/connectors/gtm`   | Public read of `{ container_id }` for storefront injection (`AUTHENTICATE=false` route flag) |

### Runtime Stripe secret resolution (payment providers)

MercFlow backends can resolve the Stripe secret key **without** relying on `STRIPE_SECRET_KEY` / `STRIPE_API_KEY` when the Stripe connector row is configured:

```ts
import { mercflowResolveStripeSecretKey } from "@mercflow/connector-module/resolve-stripe-secret-key"

const secret = await mercflowResolveStripeSecretKey(scope)
```

Resolution order matches `ConnectorModuleService.resolveStripeSecretKeyOrNull()` — env keys first when set, otherwise decrypted connector credentials.

Backend apps should set `MERCFLOW_CONNECTOR_ENCRYPTION_KEY` in `.env` (see `apps/backend/.env.example`).

### Route re-exports in `apps/backend`

Medusa discovers HTTP routes under `apps/backend/src/api/`. Thin re-exports from `@mercflow/connector-module/mercflow-*` wrap the implementations in this package — keep those files in sync when adding routes.

## Migration workflow

See workspace migration conventions. Connector migrations ship under `src/modules/connector/migrations/` **with descriptive decision-log headers**.

## Local testing

```bash
pnpm install
pnpm --filter @mercflow/connector-module typecheck
pnpm --filter @mercflow/connector-module test
```

Ensure `MERCFLOW_CONNECTOR_ENCRYPTION_KEY` (64 hex chars) is present wherever the module runs locally — see `apps/backend/.env.example`.

## Scope boundaries

This package does **not** own storefront themes, unrelated carrier pricing rules, or Medusa core modifications.
