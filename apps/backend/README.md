# MercFlow backend (`@mercflow/backend`)

Medusa v2 application for the MercFlow monorepo. It registers MercFlow packages (including **`@mercflow/content-module`**) and is the **canonical** process for admin API routes and `medusa develop` / `medusa start`.

## Prerequisites

- Node.js 20+
- PostgreSQL (local Docker is defined at the monorepo root: `docker compose up -d`)

## Quick start

From the **repository root** after `pnpm install`:

1. Copy `.env.example` to `.env` in this directory and set `JWT_SECRET` / `COOKIE_SECRET` to non-default values for local use.
2. Start Postgres if needed, then run migrations:  
   `pnpm --filter @mercflow/backend db:migrate`
3. Start the server:  
   `pnpm --filter @mercflow/backend dev`  
   or from the root:  
   `pnpm dev:backend`  
   Default Medusa port is **9000** unless your env overrides it.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `JWT_SECRET` | Medusa HTTP auth (required for real use) |
| `COOKIE_SECRET` | Medusa session cookies (required for real use) |
| `STORE_CORS` | Optional; default `http://localhost:3000` in `medusa-config.ts` |
| `ADMIN_CORS` | Optional; default `http://localhost:7001` |
| `AUTH_CORS` | Optional; default `http://localhost:7001` |

See `.env.example` for a template. Never commit `.env` or production secrets.

## Registered modules

- **`@mercflow/content-module`** — DML, services, and admin content routes. HTTP handlers are implemented in the package; this app re-exports them from `src/api/admin/.../route.ts` so Medusa’s file-based router discovers them from **this** app’s `src/api` tree.

## Migrations

Run against the same database as `DATABASE_URL`:

```bash
pnpm --filter @mercflow/backend db:migrate
```

For `pnpm db:revert`, use the same filter. To **generate** new migrations for the content module after DML changes, use `pnpm --filter @mercflow/content-module db:generate` (see the content module README). Do not run migration commands against production or staging from dev docs.

## Typecheck

```bash
pnpm --filter @mercflow/backend typecheck
```

## Production build

`medusa build` compiles the server and bundles the Medusa admin client. The app declares the usual admin UI client dependencies (`@medusajs/dashboard`, `@medusajs/draft-order`, `react`, and related packages) in `package.json` so bundling can resolve the generated `.medusa/client/entry.jsx` graph in CI. Generated output (for example `apps/backend/.medusa/`) is gitignored.

## Smoke check (content API)

With the server running, an authenticated admin request (session cookie, API key, or bearer per your Medusa setup) against:

`GET http://localhost:9000/admin/products/<product_id>/content?locale=en`

should return JSON `{ "content": ... }` (or `content: null` if no row). Replace `product_id` with a real id from your database.

## What belongs here

- Medusa configuration, module registration, and app-level `src/api` wiring only.
- No Guapo or shop-specific production credentials.
- No business logic that belongs in `packages/content-module` or other modules; keep the app thin.

## What does not belong here

- Custom commerce logic that should live in a MercFlow module.
- Storefront apps, or MercFlow `admin-ui` (separate package).
