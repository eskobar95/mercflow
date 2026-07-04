# @mercflow/inventory-module

MercFlow Medusa v2 module for operational inventory extensions: internal order notes, pick lists, suppliers, and purchase orders.

## Responsibility

- Persist MercFlow-owned operational data (`mercflow_order_note`, `mercflow_supplier`, `mercflow_purchase_order`, lines, receipts, `mercflow_inventory_config`).
- Expose admin routes for order notes, pick lists, supplier CRUD, purchase order create/list/status/receive.
- Enforce `store_id` tenancy and PostgreSQL RLS on MercFlow tables (ADR-004, ADR-005).

Does **not** own Medusa core order, payment, fulfillment, or stock levels. Registers as Medusa module key `mercflow_inventory` (not `inventory`, which is reserved for `@medusajs/inventory`). Does **not** mutate Medusa stock unless a future task explicitly designs that behavior (receipt flow in S007).

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

## Field definitions

### `mercflow_order_note` (S008)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator |
| `order_id` | text NOT NULL | Medusa order id |
| `content` | text NOT NULL | Internal note body (max 4000 chars in service) |
| `created_by` | text NOT NULL | Admin actor id or label |

### `mercflow_supplier` (S006)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | |
| `store_id` | text NOT NULL | Tenant discriminator |
| `name` | text NOT NULL | |
| `contact_person` | text nullable | |
| `email` | text nullable | |
| `country` | text nullable | |
| `currency` | text nullable | ISO-style code, validated in API |

### `mercflow_purchase_order` (S006)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | |
| `store_id` | text NOT NULL | |
| `supplier_id` | text NOT NULL | FK to `mercflow_supplier` |
| `status` | text NOT NULL | `draft`, `ordered`, `partially_received`, `received`, `cancelled` |
| `expected_date` | timestamptz nullable | |
| `reference` | text nullable | |
| `notes` | text nullable | |

### `mercflow_purchase_order_line` (S006)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | |
| `store_id` | text NOT NULL | |
| `po_id` | text NOT NULL | Parent PO |
| `variant_id` | text NOT NULL | Medusa variant id |
| `ordered_qty` | numeric NOT NULL | Positive integer enforced in service |
| `unit_cost` | numeric NOT NULL | Non-negative |

### `mercflow_purchase_order_receipt` (S006 schema, S007 receive flow)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | |
| `store_id` | text NOT NULL | |
| `line_id` | text NOT NULL | PO line |
| `received_qty` | numeric NOT NULL | |
| `received_at` | timestamptz NOT NULL | |
| `notes` | text nullable | |

### `mercflow_inventory_config` (S006 scaffold, S007 dashboard)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text (PK) | |
| `store_id` | text NOT NULL | One row per store (unique index) |
| `low_stock_threshold` | numeric | Default 5 |
| `email_alerts_enabled` | boolean | Default false |

## Admin API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/orders/:id/notes` | List internal notes |
| POST | `/admin/orders/:id/notes` | Create note |
| DELETE | `/admin/orders/:id/notes/:noteId` | Soft-delete note |
| GET | `/admin/orders/pick-list?date=today` | Pick-list payload |
| GET | `/admin/suppliers` | List suppliers (tenant-scoped) |
| POST | `/admin/suppliers` | Create supplier |
| GET | `/admin/suppliers/:id` | Retrieve supplier |
| PATCH | `/admin/suppliers/:id` | Update supplier |
| DELETE | `/admin/suppliers/:id` | Soft-delete supplier |
| GET | `/admin/purchase-orders` | List POs with lines |
| POST | `/admin/purchase-orders` | Create draft PO with lines |
| PATCH | `/admin/purchase-orders/:id/status` | Status transition (e.g. draft → ordered) |
| GET | `/admin/purchase-orders/:id` | PO detail with line receipt totals and `stock_applied` (always `false` until a future stock-apply task) |
| POST | `/admin/purchase-orders/:id/receive` | Record receipt quantities per line; updates PO to `partially_received` or `received` |
| GET | `/admin/inventory-overview` | Variant stock overview (`stocked`, `reserved`, `available`, `incoming`) with search/filter/pagination |
| GET | `/admin/inventory-overview/:variantId/movements` | Movement history (PO receipts; Medusa sale/manual events deferred) |
| GET/PATCH | `/admin/inventory-config` | Read/update low-stock threshold per store |

**Receipt boundary (S007):** Receive creates `mercflow_purchase_order_receipt` rows only. It does **not** mutate Medusa inventory levels. The API and admin UI expose `stock_applied: false` so operators know stock is unchanged.

**Available (S007):** `available = stocked - reserved` is computed on each overview request (never cached). `incoming` sums open PO lines (`ordered` / `partially_received`) minus recorded receipts per variant.

All admin routes require `?store_id=` or `MERCFLOW_DEFAULT_STORE_ID` (see `resolveMercflowStoreId`).

Backend discovers handlers via `apps/backend/src/api/admin/...` re-exports from `@mercflow/inventory-module/mercflow-admin-*` integration entrypoints.

## Migration workflow

1. Change DML in `src/modules/inventory/models/`.
2. From `packages/inventory-module`: `pnpm db:generate` when DB is available, or add a hand-written migration with **MIGRATION DECISION LOG** at the top.
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
- Automatic Medusa stock changes on purchase order receipt (deferred; use explicit future stock-apply flow if needed).
