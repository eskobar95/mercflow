# @mercflow/inventory-module

MercFlow Medusa v2 module for operational inventory extensions. Batch 2 slice S008 ships internal order notes and pick-list admin APIs; suppliers and purchase orders follow in later sprints.

## Responsibility

- Persist MercFlow-owned operational data (`mercflow_order_note`, future PO/supplier tables).
- Expose admin routes for order notes and printable pick-list payloads.
- Enforce `store_id` tenancy and PostgreSQL RLS on MercFlow tables (ADR-004, ADR-005).

Does **not** own Medusa core order, payment, or fulfillment records. Does **not** mutate Medusa stock unless a future task explicitly designs that behavior.

## Run and test in isolation

```bash
cd packages/inventory-module
pnpm install
pnpm typecheck
pnpm test
```

Migrations (from monorepo root after backend registers this module):

```bash
pnpm migration:run
```

## Field definitions (S008)

### `mercflow_order_note`

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator |
| `order_id` | text NOT NULL | Medusa order id |
| `content` | text NOT NULL | Internal note body (max 4000 chars in service) |
| `created_by` | text NOT NULL | Admin actor id or label |
| `created_at` / `updated_at` / `deleted_at` | timestamptz | Medusa DML managed |

## Admin API (S008)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/orders/:id/notes` | List internal notes for an order (tenant-scoped) |
| POST | `/admin/orders/:id/notes` | Create internal note `{ content, created_by? }` |
| DELETE | `/admin/orders/:id/notes/:noteId` | Soft-delete a note |
| GET | `/admin/orders/pick-list?date=today` | Pick-list rows for ready-to-ship orders (optional `store_id` query) |

Notes are never exposed on storefront routes.

## Migration workflow

1. Change DML in `src/modules/inventory/models/`.
2. From `packages/inventory-module`: `pnpm db:generate` (when DB available) or add a hand-written migration with a **MIGRATION DECISION LOG** at the top.
3. Run `pnpm migration:run` from the monorepo root.
4. Roll back locally with `pnpm --filter @mercflow/inventory-module db:rollback` when needed.

Committed migration files are immutable; add a new migration for later schema changes.

## Conventions

- Resolve `store_id` via `?store_id=` on admin routes or `MERCFLOW_DEFAULT_STORE_ID` in server env for single-tenant dev.
- Use `MedusaError` in the service layer; validate request bodies with Zod in route handlers.
- Use `withTenant(storeId, …)` for all reads/writes so RLS policies apply.

## Out of scope (this package)

- SEO, feeds, CMS content (other MercFlow modules).
- Shipping label generation or carrier APIs.
- Automatic Medusa stock changes on purchase order receipt (unless a dedicated task adds it).
