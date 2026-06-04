# @mercflow/feed-module

MercFlow Medusa v2 module for shopping feed configuration and XML generation (Google Shopping in Batch 2).

## Responsibility

- Own `mercflow_feed_config` per tenant (`store_id`): storefront base URL, excluded products/categories, default item condition.
- Expose `FeedConfigService.get(storeId)` and `FeedConfigService.update(storeId, config)` for admin and feed generation slices.
- Serve `GET /feed/google-shopping.xml` (Google Shopping RSS/XML, tenant-scoped by Host, cached with catalogue invalidation).

## Does not belong here

- SEO redirects, sitemap, or robots — `@mercflow/seo-module`.
- Product rich text, SEO fields on entities — `@mercflow/content-module`.
- Hardcoded storefront URLs or Guapo-specific feed presets.

## Tenancy

- Table `mercflow_feed_config` has `store_id` (text, NOT NULL, unique per active row).
- PostgreSQL RLS policy `tenant_isolation` is enabled in `Migration20260604230000CreateMercflowFeedConfig` (ADR-005).
- Services set `app.store_id` per transaction via `FeedConfigService.withTenant(storeId, fn)` (`tenant-scope.ts`).

## Field definitions (`mercflow_feed_config`)

| Column | Type | Notes |
|--------|------|--------|
| `store_id` | text NOT NULL | Medusa store id (tenant discriminator) |
| `storefront_url` | text nullable | Base URL for feed `link` fields (no trailing slash enforced here) |
| `excluded_product_ids` | jsonb | Array of Medusa product ids excluded from feed |
| `excluded_category_ids` | jsonb | Array of category ids excluded from feed |
| `default_condition` | text | Google Shopping condition (default `new`) |

## Module key

Registered as `mercflow_feed` in `apps/backend/medusa-config.ts`.

## Public feed route

| Route | Content-Type | Tenancy |
| --- | --- | --- |
| `GET /feed/google-shopping.xml` | `application/xml` | `Host` → `store_id` via `mercflow_feed_config.storefront_url` (see `tenant-resolver.ts`). Optional `X-Store-Id` for local testing. Fail closed → `404`. |

Feed field mapping (T018): `id` = variant SKU; `title` = product title; `description` = `seo_description` → product description; `link` = `storefront_url` + handle; `image_link` = content gallery / OG / thumbnail; `price` = variant price + currency; `availability` from inventory; `brand` from `brand` tables when present.

Cache: in-memory per `store_id` (60s TTL). Invalidated on `product.created` / `product.updated` / `product.deleted` subscribers in `apps/backend`.

Env (see `.env.example`): `MERCFLOW_FEED_HOST_MAP`, `MERCFLOW_TENANT_STORE_IDS`, `MERCFLOW_FEED_PUBLIC_BASE_URL` (optional public feed base override), `MERCFLOW_DEFAULT_STORE_ID` (admin routes).

## Admin API routes

| Route | Methods | Notes |
| --- | --- | --- |
| `/admin/feed-config` | GET, PUT | Feed config + overview stats (`store_id` query, `X-Store-Id`, or `MERCFLOW_DEFAULT_STORE_ID`) |
| `/admin/feed/validate` | GET | Validation report for published catalogue (`?locale=` optional) |

PUT body (strict): `storefront_url`, `excluded_product_ids`, `excluded_category_ids`, `default_condition`.

## Local development

```bash
pnpm install
pnpm --filter @mercflow/feed-module typecheck
pnpm --filter @mercflow/feed-module test
```

Migrations (from package directory, with `DATABASE_URL` set):

```bash
pnpm --filter @mercflow/feed-module db:migrate
pnpm --filter @mercflow/feed-module db:rollback
```

## Migration workflow

1. Change DML in `src/modules/feed/models/`.
2. Run `pnpm --filter @mercflow/feed-module db:generate` when tooling is available, or add a hand-written migration with a **MIGRATION DECISION LOG** and reversible `down()`.
3. Apply via backend: `pnpm migration:run` from repo root.
4. Committed migration files are immutable — add a new migration for further schema changes.
