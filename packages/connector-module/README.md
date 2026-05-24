# @mercflow/connector-module

MercFlow Medusa v2 module that persists **per-store connector credentials** (`connector_config`) and exposes admin HTTP routes for connector overview and configuration follow-ups.

## Responsibility

- DML models and migrations for `connector_config` + `connector_log`.
- Module service helpers for summarising connector availability, activation, and last connection tests.
- Admin API handlers (re-exported from `apps/backend` for Medusa route discovery).

## Field definitions (`connector_config`)

| Column                   | Type        | Notes |
|--------------------------|-------------|-------|
| `id`                     | text (pk)   | Medusa `model.id()` |
| `type`                   | text        | Stable slug: `shipmondo`, `stripe`, `plunk`, `gtm` |
| `credentials_encrypted` | text        | AES-GCM payload at rest (never returned from list routes) |
| `active`                 | boolean     | Whether the integration is switched on |
| `last_tested_at`        | timestamptz | Nullable — last successful connectivity check |

## Field definitions (`connector_log`)

| Column         | Type      | Notes                                      |
|----------------|-----------|--------------------------------------------|
| `id`           | text (pk) | Medusa `model.id()`                        |
| `connector_id` | text    | FK ➜ `connector_config.id`                 |
| `event`        | text      | Machine-readable event key                 |
| `payload_json` | jsonb     | Optional structured context                |

## API

| Method | Path                   | Purpose |
|--------|------------------------|---------|
| `GET`  | `/admin/connectors`    | List all known connector types with `{ type, active, lastTestedAt, configured }` |

## Migration workflow

See `migration(content-module)...` norms in workspace docs. Connector migrations live under `src/modules/connector/migrations/` and ship with descriptive decision logs.

## How to test in isolation

```bash
pnpm --filter @mercflow/connector-module typecheck
pnpm --filter @mercflow/connector-module test
```

## Does not belong here

Storefront checkout plugins, webhook receivers for arbitrary third parties, Guapo operational config, or Medusa core modifications.
