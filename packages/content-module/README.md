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
- `src/api/admin/.../content/route.ts` — admin HTTP routes (Medusa file-based API)
- `medusa-config.ts` — local harness so Medusa CLI can run in this package (migrations, optional local server)

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

**API routes and process root:** Medusa loads HTTP routes from the application’s `src/api` tree (and from registered plugins). When you run `medusa develop` with **cwd** = `packages/content-module`, the routes under this package’s `src/api` are the project’s `src/api` and are active. A separate app such as `apps/backend` will need to **mirror** this `src/api` path under its own `src/api` in a follow-up (for example re-exporting handlers from this package) so the same routes are registered. Keep this in mind for backend wiring tasks.

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

1. Start PostgreSQL (e.g. `docker compose` at the monorepo root, or any reachable instance). Set `DATABASE_URL` (see `.env.example`).
2. From `packages/content-module` after `pnpm install` at the repo root:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:revert
   ```

3. `db:generate` uses the local `medusa-config.ts` and the module key `content` (see `db:generate` script).

**Important:** `pnpm db:migrate` run from this package loads the Medusa application defined by the local `medusa-config` and, with the current Medusa 2.14.1 stack, can apply **core** Medusa module migrations in addition to this module. Use a **dedicated local or disposable database** when iterating on this package alone. When `apps/backend` is the canonical app, prefer running `medusa db:migrate` from that app so migration scope matches the deployed process.

**Revert:** `pnpm db:revert` rolls back the last migration batch per Medusa; follow Medusa’s docs for your version.

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
