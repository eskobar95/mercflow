# @mercflow/seo-module

MercFlow Medusa v2 module for Batch 2 SEO infrastructure: per-tenant SEO config, Nordic slug strategy, 301 redirects, tenant Host resolution, `sitemap.xml`, and `robots.txt`.

## Responsibility

- Owns `mercflow_seo_config`, `mercflow_redirect`, `mercflow_sitemap_config`, and `mercflow_robots_config` (tenant-scoped via `store_id` + PostgreSQL RLS).
- Public routes: `GET /sitemap.xml`, `GET /robots.txt` (tenant from `Host` → `mercflow_seo_config.storefront_url`, 60s resolver cache).
- Shared middleware: `mercflow-public-tenant-middleware` for `/sitemap.xml`, `/robots.txt`, `/feed/*`.
- Exports pure slug utility (`@mercflow/seo-module/slug`) for admin preview and other packages.
- Admin routes: `GET|PUT /admin/seo-config`, `GET|POST /admin/redirects`, `DELETE /admin/redirects/:id`.
- Redirect middleware (`mercflow-redirect-middleware`) for storefront path 301 responses.
- Auto redirects upsert on `(from_path, store_id)` so repeat handle changes do not violate uniqueness.
- `product.created` / `product_category.created` subscribers apply the saved slug strategy to new handles and seed `metadata.mercflow_prev_handle` for the first rename redirect.

Does **not** own product/category rich text or CMS redirects in `content-module` (`cms_redirect`).

## Field definitions

### `mercflow_seo_config`

| Column | Type | Notes |
|--------|------|--------|
| `store_id` | text | Medusa store id; unique per row |
| `storefront_url` | text | Public storefront origin (nullable) |
| `slug_strategy` | text | `nordic` (ø→oe) or `omit` (ø→o) |
| `org_name` | text | Organization name for JSON-LD (nullable) |
| `org_logo_url` | text | Logo URL (nullable) |
| `org_social_urls` | jsonb | Social profile URLs (nullable) |

### `mercflow_redirect`

| Column | Type | Notes |
|--------|------|--------|
| `store_id` | text | Tenant discriminator |
| `from_path` | text | Unique per `(from_path, store_id)` |
| `to_path` | text | Destination path |
| `type` | text | `auto` or `manual` |

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/seo-config` | Read (or create default) SEO config for tenant |
| PUT | `/admin/seo-config` | Update slug strategy and org/storefront fields |
| GET | `/admin/redirects` | List redirects with `has_chain_warning` |
| POST | `/admin/redirects` | Create manual redirect |
| DELETE | `/admin/redirects/:id` | Delete redirect |
| GET | `/admin/sitemap-config` | Read sitemap config |
| PUT | `/admin/sitemap-config` | Update priorities, changefreq, exclusions |
| GET | `/admin/sitemap/preview` | Preview generated XML |
| POST | `/admin/sitemap/regenerate` | Invalidate cache and warm sitemap |
| GET | `/admin/robots-config` | Read robots config + preview |
| PUT | `/admin/robots-config` | Update structured or freetext robots rules |

### `mercflow_sitemap_config`

| Column | Type | Notes |
|--------|------|--------|
| `store_id` | text | Unique per tenant |
| `page_type_settings` | jsonb | `product` / `category` / `page` priority + changefreq |
| `excluded_product_ids` | jsonb | Product ids omitted from sitemap |
| `excluded_category_ids` | jsonb | Category ids omitted from sitemap |
| `excluded_page_ids` | jsonb | CMS page ids omitted from sitemap |

### `mercflow_robots_config`

| Column | Type | Notes |
|--------|------|--------|
| `store_id` | text | Unique per tenant |
| `structured_rules` | jsonb | Allow/disallow per user-agent |
| `freetext_override` | text | When set, replaces structured output |
| `change_history` | jsonb | Last 10 change summaries |

Tenant resolution for admin: query `store_id`, header `X-Store-Id`, or env `MERCFLOW_DEFAULT_STORE_ID`.

## Run and test

```bash
cd packages/seo-module
pnpm typecheck
pnpm test
```

Migrations run via backend:

```bash
pnpm --filter @mercflow/backend db:migrate
```

Rollback module migrations (local):

```bash
cd packages/seo-module && pnpm db:rollback
```

## Migration workflow

1. Change DML models under `src/modules/seo/models/`.
2. Add a new migration file with **MIGRATION DECISION LOG** (never edit committed migrations).
3. Run `pnpm --filter @mercflow/backend db:migrate` against local PostgreSQL.
4. Commit with type `migration(seo-module): …`.
