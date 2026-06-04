# @mercflow/content-module

MercFlow Medusa v2 custom module: native content fields (rich description, SEO, media gallery) for products and product categories, CMS pages/articles/redirects, and supporting tables — implemented with Medusa DML, module services, and admin API routes.

## Conventions

- Data models are defined only with Medusa DML (`model.define`). No hand-written MikroORM entity classes.
- `created_at`, `updated_at`, and `deleted_at` are provided by the framework; do not add them in DML.
- Business rules (e.g. max length for `seo_description`, 160 characters; `seo_title`, 255 characters) are enforced in the service layer and mirrored in Zod for HTTP input; use `MedusaError` in services, not raw `Error`.
- Migration files may be hand-authored when a live Postgres URL is unavailable for `medusa db:generate`; they must stay in sync with DML and include a **MIGRATION DECISION LOG** comment. After commit, a migration file is immutable; schema changes need a new migration.
- Exported DML models are re-exported from `src/models/index.ts` for consumers and tests.

## Field definitions

Table and column names follow DML; PostgreSQL types follow Medusa’s mapping unless a task explicitly requires a database-level type (e.g. `varchar(255)` for `seo_title`).

**Tenancy:** Every MercFlow content table includes `store_id` (text, NOT NULL, indexed) — Medusa store ID for the tenant. Locale/slug/scope uniqueness is scoped per `store_id` (see `Migration20260604120000AddStoreIdTenancy`). PostgreSQL RLS with policy `tenant_isolation` is enabled on all T001 tables (`Migration20260604220000EnableRlsTenantIsolation`). Module services set `app.store_id` per transaction via `ContentModuleService.withTenant(storeId, fn)` (see `tenant-scope.ts`); pass `{ storeId }` on reads/writes that must respect RLS when the DB role is subject to policies.

### ProductContent (`product_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | Medusa `model.id().primaryKey()` |
| `store_id` | text | Tenant discriminator; indexed |
| `product_id` | text | Reference to `product.id`; indexed |
| `locale` | text | BCP-47 locale code (same as Medusa admin) |
| `body_json` | jsonb, nullable | TipTap JSON for this locale |
| `seo_title` | varchar(255), nullable | |
| `seo_description` | varchar(160), nullable | |
| `og_image_url` | text, nullable | OG/social image URL for this row |
| `status` | `draft` \| `published` | |
| `version` | integer, default `1` | |
| | | Unique `(product_id, locale, store_id)` |

### CategoryContent (`category_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `category_id` | text | Reference to `product_category.id`; indexed |
| `locale` | text | |
| `body_json` | jsonb, nullable | TipTap JSON |
| `seo_title` | varchar(255), nullable | |
| `seo_description` | varchar(160), nullable | |
| `og_image_url` | text, nullable | |
| `banner_image_url` | text, nullable | Hero/banner image URL |
| `status` | `draft` \| `published` | |
| `version` | integer, default `1` | |
| | | Unique `(category_id, locale, store_id)` |

### Article (`article`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `slug` | text | Unique per `(locale, store_id)` |
| `title` | text | |
| `body_json` | jsonb, nullable | |
| `locale` | text | |
| `status` | `draft` \| `published` | |
| `published_at` | timestamptz, nullable | |

### Page (`page`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `slug` | text | Unique per `(locale, store_id)` among rows with `deleted_at` null (partial index in migration) |
| `title` | text | |
| `page_type` | `homepage` \| `landing` \| `content` | |
| `status` | `draft` \| `published` | |
| `locale` | text | |

### PageVersion (`page_version`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `page_id` | text | FK → `page.id` |
| `version` | integer | |
| `status` | `draft` \| `published` | |
| `published_at` | timestamptz, nullable | |

### PageBlock (`page_block`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `page_version_id` | text | FK → `page_version.id` |
| `sort_order` | integer | |
| `block_type` | text | |
| `data_json` | jsonb, nullable | Align field names with Payload `sectionBlocks` when migrating |

### CmsGlobal (`cms_global`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `scope` | text | Unique per `(scope, store_id)` |
| `data_json` | jsonb, nullable | |

### CmsRedirect (`cms_redirect`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `from_path` | text | Unique per `(from_path, store_id)` |
| `to_path` | text | Destination path |

### MediaAsset (`media_asset`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `url` | text | |
| `alt` | text, nullable | |
| `mime_type` | text, nullable | |
| `width` | integer, nullable | |
| `height` | integer, nullable | |

### ProductAttribute (`product_attribute`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `handle` | text | Unique per `(handle, store_id)` |
| `label` | text | |
| `value_type` | `text` \| `number` \| `boolean` | |

### ProductAttrLink (`product_attr_link`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `store_id` | text | Tenant discriminator; indexed |
| `product_id` | text | |
| `attribute_id` | text | FK → `product_attribute.id` |
| `value_text` | text, nullable | |
| | | Unique `(product_id, attribute_id, store_id)` |

## Localization

- Admin product/category content routes use `?locale=<code>`; default is `en` when omitted.
- **Storage:** one row per `(entity_id, locale, store_id)` with `body_json` holding TipTap JSON for that locale (no JSON locale map in a single column).
- **Legacy API mapping:** `description_rich` in HTTP bodies maps to `body_json`. `seo_og_image_id` maps to `og_image_url`; `banner_image_id` maps to `banner_image_url`. `media_gallery` is accepted but not stored until a gallery model exists (`null` on read).

## Layout

- `src/modules/content/models/` — DML definitions
- `src/models/index.ts` — barrel export of all DML models
- `src/modules/content/migrations/` — migrations (decision log on each file)
- `src/modules/content/service.ts` — `MedusaService` and custom methods (retrieve/upsert per locale)
- `src/modules/content/index.ts` — `Module("content", …)` export
- `src/api/admin/.../content/route.ts` — admin HTTP route implementations (Medusa file-based API)
- `src/integrations/mercflow-*-content-api.ts` — thin re-exports of those routes for `apps/backend` (see below)
- `medusa-config.ts` — optional local harness in this package only (CLI: `db:generate`, experiments). **Prefer** `apps/backend` for running the full app and migrations in day-to-day dev.

## Registering the module in an app

From the consuming Medusa app (`medusa-config`):

```ts
modules: [
  {
    resolve: "@mercflow/content-module",
  },
  // or a relative path to this package in a monorepo
],
```

### MercFlow `apps/backend` (canonical)

The monorepo includes `@mercflow/backend` under `apps/backend`, which registers this module and exposes the admin content API. Medusa only loads `src/api` from the **process working directory** of the running app, so route **handlers** live in this package, while `apps/backend` contains **thin re-exports**:

- `apps/backend/src/api/admin/products/[id]/content/route.ts` re-exports `GET` / `POST` from `@mercflow/content-module/mercflow-product-content-api`
- `apps/backend/src/api/admin/product-content/route.ts` re-exports `POST` from `@mercflow/content-module/mercflow-admin-product-content-post-route`
- `apps/backend/src/api/admin/product-content/[id]/route.ts` re-exports `GET` / `PATCH` from `@mercflow/content-module/mercflow-admin-product-content-read-route`
- `apps/backend/src/api/store/product-content/[handle]/route.ts` re-exports `GET` from `@mercflow/content-module/mercflow-store-product-content-read-route`
- `apps/backend/src/api/admin/category-content/route.ts` re-exports `POST` from `@mercflow/content-module/mercflow-admin-category-content-post-route`
- `apps/backend/src/api/admin/category-content/[id]/route.ts` re-exports `GET` / `PATCH` from `@mercflow/content-module/mercflow-admin-category-content-read-route`
- `apps/backend/src/api/store/category-content/[handle]/route.ts` re-exports `GET` from `@mercflow/content-module/mercflow-store-category-content-read-route`
- `apps/backend/src/api/admin/articles/route.ts` re-exports `GET` / `POST` from `@mercflow/content-module/mercflow-admin-articles-route`
- `apps/backend/src/api/admin/articles/[id]/route.ts` re-exports `GET` / `PATCH` / `DELETE` from `@mercflow/content-module/mercflow-admin-articles-id-route`
- `apps/backend/src/api/store/articles/route.ts` re-exports `GET` from `@mercflow/content-module/mercflow-store-articles-route`
- `apps/backend/src/api/store/articles/[slug]/route.ts` re-exports `GET` from `@mercflow/content-module/mercflow-store-articles-slug-route`
- `apps/backend/src/api/admin/pages/route.ts` re-exports `GET` / `POST` from `@mercflow/content-module/mercflow-admin-pages-api`
- `apps/backend/src/api/admin/pages/[id]/route.ts` re-exports `GET` / `PATCH` / `DELETE` from `@mercflow/content-module/mercflow-admin-pages-id-api`
- `apps/backend/src/api/store/pages/[slug]/route.ts` re-exports `GET` from `@mercflow/content-module/mercflow-store-pages-read-route`
- `apps/backend/src/api/admin/product-categories/[id]/content/route.ts` re-exports from `@mercflow/content-module/mercflow-category-content-api`

Run the server from `apps/backend` (see that package’s README). Do not duplicate handler logic in the app.

## Admin API

All routes are under the **admin** prefix, require an authenticated admin session (or Medusa’s usual admin auth), and return JSON. Validation errors return **400** with `{ "message", "issues" }` (Zod). Missing entities return **404** via `MedusaError` / framework handling.

| Method | Path | Query | Body (POST/PATCH) |
| --- | --- | --- | --- |
| `GET` | `/admin/product-content/:id` | `locale` (optional, default `en`) | — |
| `POST` | `/admin/product-content` | `locale` | `product_id`, plus optional CMS fields (`description_rich`, `seo_*`, …) via strict Zod |
| `PATCH` | `/admin/product-content/:id` | — | Same optional fields — **`PATCH` `:id` is `product_content.id`**, unlike `GET` which expects **`product.id`** (see overload note below). |
| `GET` | `/admin/category-content/:id` | `locale` (optional, default `en`) | — |
| `POST` | `/admin/category-content` | `locale` | `category_id`, plus optional CMS fields (`description_rich`, `seo_*`, `banner_image_id?`) via strict Zod |
| `PATCH` | `/admin/category-content/:id` | — | Same optional fields — **`PATCH` `:id` is `category_content.id`**, unlike `GET` which expects **`product_category.id`**. |
| `GET` | `/admin/articles` | `locale` (optional filter) | — |
| `POST` | `/admin/articles` | — | `title` (required), optional `slug`, `body_json`, `locale` (default `en`), `status`, `published_at` (ISO datetime or null) — strict Zod |
| `GET` | `/admin/articles/:id` | — | — |
| `PATCH` | `/admin/articles/:id` | — | Partial article fields (same keys as `POST` body except all optional) |
| `DELETE` | `/admin/articles/:id` | — | Soft-deletes the article row |
| `POST` | `/admin/products/:id/content` | `locale` (optional, default `en`) | `description_rich?`, `seo_title?`, `seo_description?`, `seo_og_image_id?`, `media_gallery?` (see Zod in `http-schemas.ts`) |
| `GET` | `/admin/product-categories/:id/content` | `locale` (optional, default `en`) | — |
| `POST` | `/admin/product-categories/:id/content` | `locale` (optional, default `en`) | same as product, plus `banner_image_id?` for categories |
| `GET` | `/admin/pages` | `locale`, `limit`, `offset` (optional; defaults `en`, `50`, `0`) | — |
| `POST` | `/admin/pages` | — | `title`, `slug`, `page_type` (`homepage` \| `landing` \| `content`), `status` (`draft` \| `published`), `locale` |
| `GET` | `/admin/pages/:id` | — | — |
| `PATCH` | `/admin/pages/:id` | — | optional `title`, `slug`, `page_type`, `status` |
| `DELETE` | `/admin/pages/:id` | — | soft-deletes the page |

> **Overload note:** `/admin/product-content/:id` maps two semantics — `GET` treats `:id` as **`product.id`**, whereas `PATCH` treats `:id` as **`product_content.id`**. The same applies to **`/admin/category-content/:id`**: **`GET`** uses **`product_category.id`**; **`PATCH`** uses **`category_content.id`**.

**MercFlow read / mutation payloads (`GET/POST/PATCH /admin/product-content…`, `POST` collection, plus `GET /store/product-content/:handle`):** plain JSON **`{ id, product_id, locale, version, body_json, seo_title, seo_description, og_image_url, status }`** (no `{ content: … }` wrapper). **`version`** increments on each successful **`upsert`**. **`og_image_url`** echoes absolute **`http(s)`** URLs or resolves uploads via **`FILE`** when the stored identifier matches a Media module record. **`status`** duplicates **`product.status`** on admin reads. Returns **404** when prerequisites fail (**400** on invalid query/body validation).

**MercFlow flat category CMS (`GET/POST/PATCH /admin/category-content…`, plus `GET /store/category-content/:handle`):** same pattern as products with **`category_id`**, **`banner_image_url`**, and **`status`** mirroring Medusa category listing visibility (`published` when `is_active` and not `is_internal`, otherwise `draft`) on admin reads. Storefront reads require a **published** CMS row (`category_content.status = published`).

For **nested legacy edits**, keep using **`POST /admin/products/:id/content`**; `{ "content": { … } }` responses stay unchanged.

**Response shape (GET/POST on `/admin/products/:id/content` and category equivalent):** `{ "content": { ... } }` where `content` includes `id`, `product_id` or `category_id`, `locale`, resolved localized fields, and `null` for missing optional values. `GET` returns `{ "content": null }` when no row exists yet.

**Limits:** `seo_description` must be at most **160** characters for the value being written for the active locale (enforced in Zod and the service). `seo_title` must be at most **255** characters.

**CMS pages (`/admin/pages…`):** `GET /admin/pages` returns `{ pages, count, limit, offset }` where each **`page`** includes Medusa timestamps and **`block_count`** (blocks on the highest `page_version` for that page). `POST` / `GET` / `PATCH` / `DELETE` use **`page.id`** as the path `:id`. When **`slug`** changes on `PATCH`, a **`cms_redirect`** row is written with **`from_path`** `/pages/{oldSlug}` and **`to_path`** `/pages/{newSlug}` in the **same database transaction** as the row update.

## Store API (public CMS read)

| Method | Path | Query | Notes |
| --- | --- | --- | --- |
| `GET` | `/store/product-content/:handle` | `locale` (optional, default `en`) | No admin auth required. **Published** products only. Same JSON shape as the MercFlow CMS admin read/mutation payloads above (**404** if handle unknown, unpublished, or no CMS row). |
| `GET` | `/store/category-content/:handle` | `locale` (optional, default `en`) | No admin auth required. Listed categories (`is_active` and not `is_internal`) only. **`category_content.status` must be `published`**. Flat MercFlow category CMS payload (**404** otherwise). |
| `GET` | `/store/articles` | `locale` (optional, default `en`) | Public list of **published** articles only (`{ articles: [...] }` with id, slug, title, published_at, locale). |
| `GET` | `/store/articles/:slug` | `locale` (optional, default `en`) | Single **published** article (`{ article: { id, slug, title, body_json, locale, published_at } }`). **404** for drafts or unknown slug. |
| `GET` | `/store/pages/:slug` | `locale` (optional, default `en`) | **Published** pages only. JSON `{ title, slug, page_type, status, blocks: [] }` (**404** for unknown slug, draft, or missing row). |

### Example `curl` (local)

Use your Medusa base URL, admin auth cookie or bearer token, and a real product id.

```bash
# Replace BASE, TOKEN, and PRODUCT_ID. Default locale = en.
curl -sS -H "Authorization: Bearer TOKEN" \
  "http://localhost:9000/admin/products/PRODUCT_ID/content?locale=da"
```

```bash
curl -sS -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d "{\"seo_title\": \"Hej\", \"seo_description\": \"Kort\"}" \
  "http://localhost:9000/admin/products/PRODUCT_ID/content?locale=da"
```

## Migration workflow (development)

1. Start PostgreSQL (e.g. `docker compose` at the monorepo root). Set `DATABASE_URL` in `apps/backend/.env` (see `apps/backend/.env.example`).
2. **Apply migrations (normal dev):** from the repo root, use the backend app so Medusa and module registration match production:

   ```bash
   pnpm --filter @mercflow/backend db:migrate
   ```

3. **Generate a new migration after DML changes** when you have a reachable database and snapshots are in sync:

   ```bash
   pnpm --filter @mercflow/content-module db:generate
   ```

   With no database, author SQL carefully, keep DML and migration aligned, and regenerate snapshots when possible.

4. **Rollback last content-module batch (local only):** `pnpm --filter @mercflow/backend db:rollback` rolls back migrations for the `content` module only.

**Throwaway / package-only database:** `pnpm --filter @mercflow/content-module db:migrate` uses this package’s `medusa-config.ts` and, with Medusa 2.14.1, can apply **core** commerce migrations in addition to this module. Use only a **disposable** database for that. Do **not** run migrations against production or staging from this document.

**Monorepo shortcuts:** `pnpm migration:run` and `pnpm migration:revert` (repo root) delegate to `@mercflow/backend` for the same migrate / rollback behaviour.

**Isolated check for this package:** `pnpm --filter @mercflow/content-module typecheck` (DML, service, routes, integrations; generated migration files are excluded from `tsc`—see `tsconfig.json`).

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit` for this package |
| `pnpm db:generate` | `medusa db:generate content` (requires `DATABASE_URL`) |
| `pnpm db:migrate` | `medusa db:migrate` |
| `pnpm db:rollback` | `medusa db:rollback --modules content` |

## What does not belong here

- Admin UI, storefront, or design tokens
- Guapo-specific config or production secrets
- Medusa core patches (extend via this module and app config only)
