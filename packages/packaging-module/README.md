# @mercflow/packaging-module

MercFlow Medusa v2 module for tenant-scoped packaging catalogs and order packaging suggestions (M010).

## Responsibility

- Store packaging types per tenant (`packaging_types`)
- CRUD service for catalog management
- `suggestPackaging()` greedy volume/weight algorithm for fulfillment
- Admin API for catalog CRUD and `/suggest`

Does **not** belong here: admin UI (T051/T052), Shipmondo label injection (connector-module).

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

Dimensions are stored in **mm** (integer). Weight is stored in **g** (integer). Medusa variant shipping fields (`length`, `width`, `height`, `weight`) use the same units.

## Tenancy

RLS policy `packaging_types_tenant_isolation`:

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
- Migration: `test/packaging-types-migration.test.ts` — RLS policy shape
- Integration (requires `DATABASE_URL`): `test/tenancy-rls-db.integration.test.ts` — zero cross-tenant rows

## Registration

Registered in `apps/backend/medusa-config.ts` as `@mercflow/packaging-module`.
