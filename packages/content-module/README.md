# @mercflow/content-module

MercFlow Medusa v2 custom module: native content fields (rich description, SEO, media gallery) for products and product categories, implemented with Medusa DML and module services.

**Scope:** DML models, migrations, and module wiring. Admin HTTP routes and service-level validation beyond generated CRUD are delivered in follow-up work.

## Conventions

- Data models are defined only with Medusa DML (`model.define`). No hand-written MikroORM entity classes.
- `created_at`, `updated_at`, and `deleted_at` are provided by the framework; do not add them in DML.
- Business rules (e.g. max length for `seo_description`) live in the service layer, not in the database.
- Migrations are generated with Medusa’s CLI, not hand-written SQL, then committed. After commit, a migration file is immutable; schema changes need a new migration.

## Field definitions

Table and column names follow DML; PostgreSQL types follow Medusa’s mapping.

### ProductContent (`product_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | Medusa `model.id().primaryKey()` |
| `product_id` | text | Reference to `product.id` |
| `description_rich` | jsonb, nullable | TipTap JSON document |
| `seo_title` | text, nullable | |
| `seo_description` | text, nullable | Max 160 characters enforced in service (later) |
| `seo_og_image_id` | text, nullable | Media file id |
| `media_gallery` | text[] (array), nullable | Ordered list of media ids |

### CategoryContent (`category_content`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | text (PK) | |
| `category_id` | text | Reference to `product_category.id` |
| `description_rich` | jsonb, nullable | TipTap JSON document |
| `seo_title` | text, nullable | |
| `seo_description` | text, nullable | Max 160 characters enforced in service (later) |
| `seo_og_image_id` | text, nullable | Media file id |
| `banner_image_id` | text, nullable | Hero / banner image id |

## Layout

- `src/modules/content/models/` — DML definitions
- `src/modules/content/migrations/` — generated migrations (do not hand-edit `up`/`down` bodies)
- `src/modules/content/service.ts` — `MedusaService` factory; custom methods added here in later tasks
- `src/modules/content/index.ts` — `Module("content", …)` export
- `medusa-config.ts` — local harness so Medusa CLI can run in this package (see below)

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

## API routes (planned)

Not implemented in this package iteration. Target surface (for reference when implemented):

- `GET` / `POST` `/admin/products/:id/content`
- `GET` / `POST` `/admin/product-categories/:id/content`

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
