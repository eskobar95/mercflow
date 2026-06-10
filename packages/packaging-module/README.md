# @mercflow/packaging-module

MercFlow Medusa v2 module for tenant-scoped packaging catalogs, fulfillment packaging persistence, and order packaging suggestions (M010/M011).

## Responsibility

- Store packaging types per tenant (`packaging_types`)
- Persist confirmed packaging per fulfillment (`shipment_packaging`) with dimension snapshot
- CRUD service for catalog management
- `suggestPackaging()` greedy volume/weight algorithm for fulfillment
- Admin API for catalog CRUD, `/suggest`, and fulfillment shipment packaging

Does **not** belong here: admin UI (T051/T052/T055), Shipmondo label injection (connector-module).

## Field definitions — `packaging_types`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `name` | text NOT NULL | Display name, unique per store |
| `type` | enum NOT NULL | `box` \| `envelope` \| `bag` \| `tube` \| `other` |
| `length_mm` | int NOT NULL | Outer length in millimeters |
| `width_mm` | int NOT NULL | Outer width in millimeters |
| `height_mm` | int NOT NULL | Outer height in millimeters |
| `max_weight_g` | int NOT NULL | Max gross weight in grams |
| `is_active` | boolean NOT NULL default `true` | Included in suggestions when true |
| `deleted_at` | timestamptz nullable | Soft delete |

Unique: `(store_id, name)` where `deleted_at IS NULL`.

## Field definitions — `shipment_packaging`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Medusa `model.id()` |
| `store_id` | text NOT NULL | Tenant discriminator; RLS |
| `fulfillment_id` | text NOT NULL | Medusa fulfillment id; unique per store |
| `packaging_type_id` | text NOT NULL | FK to live `packaging_types.id` at write time |
| `dimensions_snapshot_json` | jsonb NOT NULL | `{ name, length_mm, width_mm, height_mm, max_weight_g }` captured at upsert |
| `deleted_at` | timestamptz nullable | Soft delete (explicit clear) |

Unique: `(store_id, fulfillment_id)` where `deleted_at IS NULL`.

The snapshot preserves dimensions used for label generation even if the catalog entry is later edited or deleted.

Dimensions are stored in **mm** (integer). Weight is stored in **g** (integer). Medusa variant shipping fields (`length`, `width`, `height`, `weight`) use the same units.

## Tenancy

RLS policies `packaging_types_tenant_isolation` and `shipment_packaging_tenant_isolation`:

```sql
store_id = current_setting('app.tenant_id', true)
```

Module services call `withTenant(storeId, fn)` which sets `app.tenant_id` per transaction (`tenant-scope.ts`).

## Service methods

- `createPackagingType(storeId, input)`
- `updatePackagingType(storeId, id, input)`
- `deletePackagingType(storeId, id)` — soft delete
- `listPackagingTypes(storeId, { limit?, offset?, includeDeleted? })`
- `retrievePackagingType(storeId, id)`
- `suggestPackaging(storeId, items, loadVariantDimensions)` → `{ suggested, total_volume_mm3, total_weight_g }`
- `retrieveShipmentPackaging(storeId, fulfillmentId)` → row or `null`
- `upsertShipmentPackaging({ storeId, fulfillmentId, packagingTypeId })` — snapshots live catalog dimensions at write time
- `deleteShipmentPackaging(storeId, fulfillmentId)` — soft clear

### Suggestion algorithm (v1)

```
totalVolumeMm3 = sum(variant L×W×H × qty) × 1.2
totalWeightG   = sum(variant weight_g × qty)
candidates     = active catalog entries where volume ≥ totalVolumeMm3 AND max_weight_g ≥ totalWeightG
return         = smallest candidate by volume (or null)
```

## Admin API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/packaging-types` | List catalog (`?store_id=`, pagination) |
| POST | `/admin/packaging-types` | Create packaging type |
| GET | `/admin/packaging-types/:id` | Retrieve one |
| PUT | `/admin/packaging-types/:id` | Update |
| DELETE | `/admin/packaging-types/:id` | Soft delete |
| POST | `/admin/packaging-types/suggest` | Suggest packaging for line items |
| GET | `/admin/fulfillments/:fulfillment_id/shipment-packaging` | Retrieve persisted packaging for fulfillment |
| PUT | `/admin/fulfillments/:fulfillment_id/shipment-packaging` | Upsert confirmed packaging (snapshots dimensions) |

### Shipment packaging PUT body

```json
{
  "packaging_type_id": "pkg_01ABC"
}
```

### Shipment packaging response

```json
{
  "shipment_packaging": {
    "id": "sp_01...",
    "fulfillment_id": "ful_01...",
    "packaging_type_id": "pkg_01...",
    "dimensions_snapshot_json": {
      "name": "Small box",
      "length_mm": 200,
      "width_mm": 150,
      "height_mm": 100,
      "max_weight_g": 1000
    }
  }
}
```

### Suggest body

```json
{
  "items": [
    { "variant_id": "variant_01ABC", "quantity": 2 }
  ]
}
```

### Suggest response

```json
{
  "suggested": { "id": "pkg_01...", "name": "Small box", "...": "..." },
  "total_volume_mm3": 384000,
  "total_weight_g": 500
}
```

All mutating admin routes require `?store_id=` or `MERCFLOW_DEFAULT_STORE_ID` in dev.

## Migration workflow

From repo root after `DATABASE_URL` is set:

```bash
pnpm --filter @mercflow/packaging-module db:migrate
pnpm migration:run
```

Rollback module migration:

```bash
pnpm --filter @mercflow/packaging-module db:rollback
```

Migration files live in `src/modules/packaging/migrations/` and include a decision log comment at the top.

## Tests

```bash
pnpm --filter @mercflow/packaging-module test
pnpm --filter @mercflow/packaging-module typecheck
```

- Unit: `test/suggest-packaging.test.ts` — algorithm with mock variants
- Unit: `test/dimensions-snapshot.test.ts` — snapshot JSON shape from catalog row
- Unit: `test/upsert-shipment-packaging.test.ts` — upsert + unknown type rejection
- Migration: `test/packaging-types-migration.test.ts`, `test/shipment-packaging-migration.test.ts` — RLS policy shape
- Integration (requires `DATABASE_URL`): `test/tenancy-rls-db.integration.test.ts` — zero cross-tenant rows for both tables

## Registration

Registered in `apps/backend/medusa-config.ts` as `@mercflow/packaging-module`.
