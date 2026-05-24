# @mercflow/connector-module

MercFlow Medusa v2 module that persists **per-store connector credentials** (`connector_config`) and exposes admin HTTP routes for connector overview and configuration follow-ups.

## Responsibility

- DML models and migrations for `connector_config` + `connector_log`.
- Module service helpers for summarising connector availability, activation, last connection tests, **Stripe-specific** behaviours (credential save, Stripe API test, catalogue sync to Stripe Prices, payment-intent summaries, storefront VAT hint), and **Plunk-specific** credential storage and connectivity probes.
- Admin and store HTTP handlers (`/admin/connectors`, `/admin/connectors/stripe/*`, `/admin/connectors/plunk/*`, `/store/connectors/stripe/vat`), re-exported from `apps/backend` for Medusa route discovery.

## Field definitions (`connector_config`)

| Column                     | Type        | Notes |
|----------------------------|-------------|-------|
| `id`                       | text (pk)   | Medusa `model.id()` |
| `type`                     | text        | Stable slug: `shipmondo`, `stripe`, `plunk`, `gtm` |
| `credentials_encrypted`    | text        | AES-GCM payload at rest (never returned decrypted from overview routes except server-side Stripe calls) |
| `active`                   | boolean     | Whether the integration is switched on |
| `last_tested_at`           | timestamptz | Nullable — timestamp of last connectivity probe run |
| `vat_mode`                 | text        | Stripe storefront hint: `inclusive` \| `exclusive` — exposed at `GET /store/connectors/stripe/vat` |
| `secret_key_last4`         | text        | Nullable — last four chars of Stripe secret key for masked admin previews only |
| `publishable_key_last4`    | text        | Nullable — last four chars of publishable key preview |
| `webhook_secret_last4`     | text        | Nullable — last four chars of webhook secret preview |
| `connection_status`        | text        | Nullable — `ok` / `error` after the last outbound probe |
| `last_test_message`        | text        | Nullable — human-readable (non-sensitive) probe summary |

## Field definitions (`connector_log`)

| Column         | Type      | Notes                                      |
|----------------|-----------|--------------------------------------------|
| `id`           | text (pk) | Medusa `model.id()`                        |
| `connector_id` | text    | FK ➜ `connector_config.id`                 |
| `event`        | text      | Machine-readable event key                 |
| `payload_json` | jsonb     | Optional structured context                |

## Runtime helpers

- `@mercflow/connector-module/resolve-stripe-secret-key` — `mercflowResolveStripeSecretKey(scope)` returns the Stripe secret key from encrypted config when configured, falling back to `STRIPE_API_KEY` / `STRIPE_SECRET_KEY`.
- `@mercflow/connector-module/mercflow-plunk-runtime-credentials` — `resolvePlunkSecretApiKeyWithFallback(container)` returns `sk_*` from encrypted config when configured, falling back to `PLUNK_SECRET_KEY` for deployments that still rely on env injection.

## API

### Connector overview

| Method | Path                               | Purpose |
|--------|------------------------------------|---------|
| `GET`  | `/admin/connectors`                | Overview: `{ connectors: [{ type, active, configured, lastTestedAt, connectionHealth }] }` |

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
| `GET`  | `/store/connectors/stripe/vat`        | `{ data: { vat_mode } }` where `vat_mode` is `inclusive` or `exclusive` |

### Plunk (`type = plunk`)

| Method | Path                               | Purpose |
|--------|------------------------------------|---------|
| `GET`  | `/admin/connectors/plunk`         | Masked credential summary + probe metadata |
| `PATCH`| `/admin/connectors/plunk`         | Upsert encrypted Plunk credential JSON |
| `POST` | `/admin/connectors/plunk/test`    | Connectivity probe (`/v1/track` by default or `/v1/send` when `test_email` is provided) |

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

See `migration(content-module)...` norms in workspace docs. Connector migrations live under `src/modules/connector/migrations/` and ship with descriptive decision logs.

## How to test in isolation

```bash
pnpm --filter @mercflow/connector-module typecheck
pnpm --filter @mercflow/connector-module test
```

## Does not belong here

Storefront checkout plugins, webhook receivers for arbitrary third parties, Guapo operational config, or Medusa core modifications.
