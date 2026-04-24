# @mercflow/content-module

MercFlow Medusa v2 custom module: native content fields (rich description, SEO, media gallery) for products and product categories, implemented with Medusa DML, module services, and admin API routes.

## Conventions

- Data models are defined only with Medusa DML (`model.define`). No hand-written MikroORM entity classes.
- `created_at`, `updated_at`, and `deleted_at` are provided by the framework; do not add them in DML.
- Business rules (e.g. max length for `seo_description`, 160 characters) are enforced in the service layer and mirrored in Zod for HTTP input; use `MedusaError` in services, not raw `Error`.
- Migrations are generated with Medusa’s CLI, not hand-written SQL, then committed. After commit, a migration file is immutable; schema changes need a new migration.

## Field definitions

Table and column names follow DML; PostgreSQL types follow Medusa’s mapping.

### ProductContent (`product_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | Medusa `model.id().primaryKey()` |
| `product_id` | text | Reference to `product.id` |
| `description_rich` | jsonb, nullable | Locale map of TipTap JSON per locale, or a single TipTap root document (treated as `en`); see **Localization** |
| `seo_title` | text, nullable | Locale map stored as JSON in the text column, or a plain string (legacy, treated as `en`) |
| `seo_description` | text, nullable | Same as `seo_title`; max 160 characters per locale in the service |
| `seo_og_image_id` | text, nullable | Not localized in this version |
| `media_gallery` | text[] (array), nullable | Not localized in this version |

### CategoryContent (`category_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `category_id` | text | Reference to `product_category.id` |
| `description_rich` | jsonb, nullable | Same locale strategy as product |
| `seo_title` | text, nullable | Same as product |
| `seo_description` | text, nullable | Same as product |
| `seo_og_image_id` | text, nullable | |
| `banner_image_id` | text, nullable | Not localized in this version |

## Localization

- Query and body are scoped with `?locale=<code>`; default is `en` when omitted.
- `description_rich` in the database is either a **single** TipTap document (legacy) or a **map** of locale code → TipTap JSON.
- `seo_title` and `seo_description` are stored in **text** columns. Multiple locales are stored as a **JSON string** of `{ "en": "...", "da": "..." }` when more than one locale is present; a single plain string is interpreted as the default locale only.

## Layout

- `src/modules/content/models/` — DML definitions
- `src/modules/content/migrations/` — generated migrations (do not hand-edit `up`/`down` bodies)
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
- `apps/backend/src/api/admin/product-categories/[id]/content/route.ts` re-exports from `@mercflow/content-module/mercflow-category-content-api`

Run the server from `apps/backend` (see that package’s README). Do not duplicate handler logic in the app.

## Admin API

All routes are under the **admin** prefix, require an authenticated admin session (or Medusa’s usual admin auth), and return JSON. Validation errors return **400** with `{ "message", "issues" }` (Zod). Missing product or category returns **404** via `MedusaError` / framework handling.

| Method | Path | Query | Body (POST) |
| --- | --- | --- | --- |
| `GET` | `/admin/products/:id/content` | `locale` (optional, default `en`) | — |
| `POST` | `/admin/products/:id/content` | `locale` (optional, default `en`) | `description_rich?`, `seo_title?`, `seo_description?`, `seo_og_image_id?`, `media_gallery?` (see Zod in `http-schemas.ts`) |
| `GET` | `/admin/product-categories/:id/content` | `locale` (optional, default `en`) | — |
| `POST` | `/admin/product-categories/:id/content` | `locale` (optional, default `en`) | same as product, plus `banner_image_id?` for categories |

**Response shape (GET/POST success):** `{ "content": { ... } }` where `content` includes `id`, `product_id` or `category_id`, `locale`, resolved localized fields, and `null` for missing optional values. `GET` returns `{ "content": null }` when no row exists yet.

**Limits:** `seo_description` must be at most **160** characters for the value being written for the active locale (enforced in Zod and the service).

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

3. **Generate a new migration after DML changes** (still from this package, module key `content`):

   ```bash
   pnpm --filter @mercflow/content-module db:generate
   ```

4. **Revert (local only):** `pnpm --filter @mercflow/backend db:revert` or the content-module filter—follow Medusa’s behaviour for the last batch.

**Throwaway / package-only database:** `pnpm --filter @mercflow/content-module db:migrate` uses this package’s `medusa-config.ts` and, with Medusa 2.14.1, can apply **core** commerce migrations in addition to this module. Use only a **disposable** database for that. Do **not** run migrations against production or staging from this document.

**Isolated check for this package:** `pnpm --filter @mercflow/content-module typecheck` (DML, service, routes, integrations; generated migration files are excluded from `tsc`—see `tsconfig.json`).

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit` for this package |
| `pnpm db:generate` | `medusa db:generate content` |
| `pnpm db:migrate` | `medusa db:migrate` |
| `pnpm db:revert` | `medusa db:revert` |

## What does not belong here

- Admin UI, storefront, or design tokens
- Guapo-specific config or production secrets
- Medusa core patches (extend via this module and app config only)
