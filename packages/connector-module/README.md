# @mercflow/connector-module

MercFlow Medusa v2 module for **connector configuration** and **audit-style logs**: credentials are stored only as AES-256-GCM ciphertext (random IV per encryption). Connector-specific APIs and admin UI are out of scope for this package until those slices land.

## Responsibilities

- **Data**: `connector_config` (per integration type) and `connector_log` (events with JSON payload).
- **Services**: `EncryptionService` (Node.js `crypto` only) and `ConnectorConfigService` (encrypt on save, decrypt on read).
- **Migrations**: generated/maintained alongside DML models; see migration workflow below.

## Field definitions

### `connector_config`

| Field | Type | Notes |
|------|------|--------|
| `id` | text (PK) | Medusa `model.id()` |
| `type` | enum | `shipmondo`, `stripe`, `plunk`, `gtm` — unique among non-deleted rows |
| `credentials_encrypted` | text | AES-256-GCM payload (`mf1:` + base64(iv \| tag \| ciphertext)); never plaintext |
| `active` | boolean | Default `true` |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | Managed by Medusa DML |

### `connector_log`

| Field | Type | Notes |
|------|------|--------|
| `id` | text (PK) | Medusa `model.id()` |
| `connector_id` | text (FK) | References `connector_config.id` |
| `event` | text | Event name / category |
| `payload_json` | jsonb nullable | Structured payload |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | Managed by Medusa DML |

## Environment

| Variable | Required when module is loaded | Description |
|----------|-------------------------------|-------------|
| `MERCFLOW_CONNECTOR_ENCRYPTION_KEY` | **Yes** (for production use of encryption) | **Only** MercFlow-documented env var for this area: a **64-character hex string** encoding **32 bytes** (AES-256 key). Example: `openssl rand -hex 32`. If missing, `EncryptionService` throws a descriptive `MedusaError` at construction (typically when the module service first loads). |

Do not commit real keys. Document the variable name in `.env.example` only.

## API routes

| Method & path | Description |
|---|---|
| `GET /admin/connectors` | Lists all four MercFlow connector types with `{ type, active, lastTestedAt, configured }`. Reads `connector_config` without decrypting credentials. |

`lastTestedAt` is `null` until connection-test persistence ships in a future slice.

There is currently no dedicated Zod schema for this endpoint (GET, no query or body).

## How to run / test locally

```bash
pnpm --filter @mercflow/connector-module typecheck
pnpm --filter @mercflow/connector-module test
```

From the package directory, after configuring `DATABASE_URL` for a **local** Postgres instance:

```bash
pnpm db:migrate
pnpm db:revert   # revert last batch — verify migrations are reversible in dev
```

`db:generate` is run via `@medusajs/cli` against the package `medusa-config.ts` when models change (requires a reachable DB for the CLI in some setups).

## Migration workflow

1. Update DML models under `src/modules/connector/models/`.
2. Run `pnpm db:generate connector` from this package (same pattern as other MercFlow modules), **or** if the CLI cannot reach Postgres in your environment, align new SQL with DML and add a migration file with the standard **MIGRATION DECISION LOG** header.
3. Run `pnpm db:migrate` against a local database and confirm tables/constraints.
4. Commit model + migration together; use commit type `migration(connector-module): …` per repo conventions.

## What does **not** belong here

- Store-specific or Guapo-only credentials, URLs, or workflows.
- Admin UI (lives in `packages/admin-ui`).
- Connector business logic (Shipmondo, Stripe, etc.) — separate modules/tasks when introduced.
