# @mercflow/metafield-module

MercFlow Medusa v2 module for tenant-defined metafield **definitions** and typed **values** on products and categories (M008).

## Responsibility

- Store metafield definitions per tenant (`metafield_definition`)
- Store typed metafield values per entity instance (`metafield_value`)
- Admin API for reading/writing values (definition CRUD routes are T038)
- RLS via `store_id` + `app.tenant_id` (ADR-008)

Does **not** belong here: content-module SEO/rich text, standard library seeds (T040), admin UI (T041+), store public API (later task).

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

## Admin API — values (T039)

All routes require Medusa admin JWT. Pass `?store_id=` or set `MERCFLOW_DEFAULT_STORE_ID` in dev.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/metafield-values?owner_type=&owner_id=&locale=` | List typed values with definition metadata |
| POST | `/admin/metafield-values/batch` | Transactional upsert (max 50 values) |
| DELETE | `/admin/metafield-values/:id` | Delete one value |

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

1. `Migration20260610120000CreateMetafieldDefinitions` — definitions table (T038 prerequisite)
2. `Migration20260610120100EnableRlsMetafieldDefinitions`
3. `Migration20260610120200CreateMetafieldValues`
4. `Migration20260610120300EnableRlsMetafieldValues`

Each file includes a MIGRATION DECISION LOG comment at the top.

## Tests

```bash
pnpm --filter @mercflow/metafield-module test
```

Covers typed column mapping, service list/tenant scoping, HTTP validation, and migration source assertions.

## Tenancy

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction. Values RLS policy: `store_id = current_setting('app.tenant_id', true)`.
