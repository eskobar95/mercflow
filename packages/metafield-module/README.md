# @mercflow/metafield-module

MercFlow Medusa v2 module for tenant-defined metafield **definitions** and typed **values** on products and categories (M008).

## Responsibility

- Store metafield definitions per tenant (`metafield_definition`)
- Store typed metafield values per entity instance (`metafield_value`)
- Admin API for reading/writing values (definition CRUD routes are T038)
- Store API for storefront metafield reads (T044)
- RLS via `store_id` + `app.tenant_id` (ADR-008)

Does **not** belong here: content-module SEO/rich text, admin UI (T041+).

## Standard library (T040)

Library seeds live in `metafield_definitions` with `store_id = NULL`, `is_standard = true`, and namespace `mercflow_library`. Vertical is stored in `validations.vertical` (`skincare` | `fashion`).

Activation copies library rows into tenant-owned definitions with `namespace = mercflow_standard`, `is_standard = false`, and the caller's `store_id`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/metafield-definitions/standard-library?vertical=skincare` | List library definitions for a vertical |
| POST | `/admin/metafield-definitions/activate-standard` | Copy selected (or all) library defs for a vertical |

### Activate body

```json
{
  "vertical": "skincare",
  "definition_ids": ["mfd_lib_skincare_material"]
}
```

Omit `definition_ids` to activate every library definition for the vertical that is not already present under `mercflow_standard`.

## Service methods (library)

- `listStandardLibrary({ vertical, storeId, ownerType?, limit?, offset? })`
- `activateStandardDefinitions(storeId, { vertical, definitionIds? })`

## Field definitions — `metafield_definition`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text nullable | NULL for library seeds; tenant ID otherwise |
| `owner_type` | text NOT NULL | `product` \| `category` |
| `namespace` | text NOT NULL | `custom`, `mercflow_library`, `mercflow_standard`, … |
| `key` | text NOT NULL | Stable key within namespace |
| `type` | text NOT NULL | ValueType enum |
| `is_primary` | boolean | Primary form field vs chip |
| `is_standard` | boolean | Library seed marker |
| `validations` | jsonb nullable | Type rules; library vertical in `validations.vertical` |

Unique: `(store_id, owner_type, namespace, key)`.

## Field definitions — `metafield_value`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `definition_id` | text NOT NULL | FK → `metafield_definition.id` |
| `owner_id` | text NOT NULL | Product or category ID |
| `owner_type` | text NOT NULL | `product` \| `category` |
| `value_text` | text nullable | text, url, color, date, date_time |
| `value_json` | jsonb nullable | json, list.*, rich_text |
| `value_number` | numeric nullable | number_integer, number_decimal |
| `value_boolean` | boolean nullable | boolean |
| `locale` | text NOT NULL default `en` | Unique with definition + owner |

Unique: `(store_id, definition_id, owner_id, locale)`.

Typed column mapping follows ADR-008 — exactly one column populated per row.

## Admin API — definitions filter (T043)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/metafield-definitions?owner_type=&category_id=` | List tenant definitions. When `category_id` is set (product listings), returns only definitions whose `category_constraint_id` matches the category or an ancestor. |

## Admin API — values (T039)

All routes require Medusa admin JWT. Pass `?store_id=` or set `MERCFLOW_DEFAULT_STORE_ID` in dev.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/metafield-values?owner_type=&owner_id=&locale=` | List typed values with definition metadata |
| POST | `/admin/metafield-values/batch` | Transactional upsert (max 50 values) |
| DELETE | `/admin/metafield-values/:id` | Delete one value |

## Store API — metafields (T044)

Authenticated via Medusa publishable API key (`x-publishable-api-key`). Tenant is resolved from the key's sales channel → store binding.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/store/metafields?owner_type=product\|category&owner_id=&locale=` | Typed metafield values for the authenticated tenant |

Legacy unversioned `/store/metafields` redirects with **301** to `/v1/store/metafields` (T032).

### Store list response shape

```json
{
  "metafields": [
    {
      "namespace": "custom",
      "key": "active_ingredients",
      "value": "Niacinamide 10%, Zinc 1%",
      "type": "multi_line_text"
    }
  ],
  "count": 1
}
```

### List response shape

```json
{
  "metafield_values": [
    {
      "id": "mfv_…",
      "namespace": "custom",
      "key": "spf_level",
      "name": "SPF Level",
      "type": "number_integer",
      "value": 30,
      "locale": "en"
    }
  ],
  "count": 1
}
```

### Batch upsert body

```json
{
  "values": [
    {
      "definition_id": "mfd_…",
      "owner_id": "prod_…",
      "owner_type": "product",
      "locale": "en",
      "value": 30
    }
  ]
}
```

## Service methods (values)

- `upsertValue(storeId, input)` — upsert by unique constraint
- `batchUpsertValues(storeId, inputs[])` — all-or-nothing transaction
- `deleteValue(storeId, id)`
- `listValues(storeId, { ownerType, ownerId, locale? })` — joins definition metadata; returns typed `value`

## Migration workflow

From repo root (requires `DATABASE_URL`):

```bash
pnpm --filter @mercflow/metafield-module db:migrate
pnpm migration:run   # runs all modules via backend
pnpm --filter @mercflow/metafield-module db:rollback
```

Migrations (in order):

1. `Migration20260610120000CreateMetafieldDefinitions` — definitions table (T038)
2. `Migration20260610120200CreateMetafieldValues`
3. `Migration20260610120300EnableRlsMetafieldValues`
4. `Migration20260610120400SeedStandardLibraryDefinitions` — skincare + fashion library seeds (T040)

Each file includes a MIGRATION DECISION LOG comment at the top.

## Tests

```bash
pnpm --filter @mercflow/metafield-module test
```

Covers typed column mapping, service list/tenant scoping, HTTP validation, and migration source assertions.

## Tenancy

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction. Values RLS policy: `store_id = current_setting('app.tenant_id', true)`.
