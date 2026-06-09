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
3. Start the API server:  
   `pnpm --filter @mercflow/backend dev`  
   or from the root:  
   `pnpm dev:backend`  
   Default Medusa port is **9000** unless your env overrides it.
4. Start the MercFlow admin UI (separate Vite app):  
   `pnpm --filter @mercflow/admin-ui dev`  
   Open the URL Vite prints (default **5173**). Set `VITE_MEDUSA_ADMIN_BACKEND_URL=http://localhost:9000` in `packages/admin-ui/.env` (or equivalent) so the UI talks to this backend. Ensure `ADMIN_CORS` / `AUTH_CORS` in this app's `.env` include the admin-ui origin (default `http://localhost:7001` in `medusa-config.ts` — adjust to match your Vite port if needed).

MercFlow does **not** serve Medusa's bundled dashboard from this process. `@mercflow/admin-ui` is the only admin interface.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `JWT_SECRET` | Medusa HTTP auth (required for real use) |
| `COOKIE_SECRET` | Medusa session cookies (required for real use) |
| `STORE_CORS` | Optional; default `http://localhost:3000` in `medusa-config.ts` |
| `ADMIN_CORS` | Optional; default `http://localhost:7001` |
| `AUTH_CORS` | Optional; default `http://localhost:7001` |
| `MERCFLOW_CONNECTOR_ENCRYPTION_KEY` | **64 hex chars (32 bytes)** — required so `@mercflow/connector-module` can encrypt connector credentials at rest (backend will fail at runtime when the module is used if unset). Generate with e.g. `openssl rand -hex 32`. |
| `RATE_LIMIT_PUBLIC_RPM` | Optional; default `60`. Per-IP limit for `GET /v1/sitemap.xml`, `/v1/robots.txt`, `/v1/feed/*` (and legacy unversioned paths before redirect). |
| `RATE_LIMIT_STORE_RPM` | Optional; default `300`. Per-`x-publishable-api-key` limit for `GET /v1/store/*` MercFlow routes (and legacy unversioned paths before redirect). |
| `SENTRY_DSN` | Optional locally; required in production. Enables Sentry error tracking (see `infra/RUNBOOK.md`). |
| `SENTRY_ENVIRONMENT` | Optional; defaults to `NODE_ENV`. |
| `SENTRY_ENABLED` | Optional; set to `false` to disable Sentry without removing `SENTRY_DSN`. |

| `SENTRY_DSN` | Optional locally; required in production (see `infra/RUNBOOK.md`). |

Never commit `.env` or production secrets.

## Observability

Sentry initializes from `src/instrumentation.ts` when `SENTRY_DSN` is set. Request middleware tags errors with `store_id` when tenant context is available. Production setup (BetterStack logs, uptime checks) is documented in `infra/RUNBOOK.md`.

## Registered modules

- **`@mercflow/content-module`** — DML, services, and admin content routes. HTTP handlers are implemented in the package; this app re-exports them from `src/api/admin/.../route.ts` so Medusa’s file-based router discovers them from **this** app’s `src/api` tree.
- **`@mercflow/connector-module`** — Connector configuration persistence with encrypted credentials (`MERCFLOW_CONNECTOR_ENCRYPTION_KEY`). Admin routes are added in future slices; this app registers the module only.

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

`medusa build` compiles the backend server only. Admin UI is disabled in `medusa-config.ts` (`admin.disable: true`), so no Medusa dashboard bundle is produced. Build the admin separately with `pnpm --filter @mercflow/admin-ui build` and deploy it as a static Vite app pointing at this API.

## Smoke check (content API)

With the server running, an authenticated admin request (session cookie, API key, or bearer per your Medusa setup) against:

`GET http://localhost:9000/admin/products/<product_id>/content?locale=en`

should return JSON `{ "content": ... }` (or `content: null` if no row). Replace `product_id` with a real id from your database.

## Store route versioning

MercFlow-owned store and public routes are mounted under `/v1/`. Unversioned paths return **301** to `/v1/` equivalents. Medusa core routes (`/store/products`, `/store/carts`, etc.) are unchanged.

Canonical route files live under `src/api/v1/`.

## Tenant isolation architecture

MercFlow isolates tenant data at the PostgreSQL layer using Row Level Security (RLS) on MercFlow-owned tables and M0 Medusa core tables (`product`, `order`, `customer`, etc.). Policies read `current_setting('app.tenant_id', true)` — set per transaction by `TenantIsolationSubscriber`.

### Request flow

1. **`tenantBootstrapMiddleware`** (`src/lib/tenant-isolation/tenant-bootstrap-middleware.ts`) runs on the first HTTP request and calls `onApplicationBootstrap` from `src/subscribers/tenant-bootstrap.ts`, registering `TenantIsolationSubscriber` on every loaded module EntityManager.
2. **`tenantIsolationMiddleware`** resolves `store_id` from the publishable API key, `Host` (via seo-module tenant middleware on public routes), `x-store-id`, or `MERCFLOW_DEFAULT_STORE_ID`, then wraps the request in `TenantContext.run(storeId, ...)`.
3. **`TenantIsolationSubscriber`** injects `SELECT set_config('app.tenant_id', ?, true)` at transaction start when a tenant context is active. Requests without a resolved tenant skip `SET LOCAL` (no error); RLS then returns empty result sets.

Admin routes: `/admin/**`. Store routes: `/store/**` and `/v1/store/**`.

### Integration test

With migrations applied and a DB role without `BYPASSRLS`:

```bash
cd apps/backend
npx medusa exec src/scripts/test-rls-medusa.ts
```

Verifies subscriber registration, `SET LOCAL` injection, and RLS isolation on the core `product` table (schema-qualified as `medusa.product` when present).

### Related code

| File | Role |
| --- | --- |
| `src/lib/tenant-isolation/tenant-context.ts` | Per-request `AsyncLocalStorage` for `store_id` |
| `src/lib/tenant-isolation/tenant-subscriber.ts` | MikroORM `afterTransactionStart` → `set_config` |
| `src/lib/tenant-isolation/register-tenant-subscriber.ts` | One-time subscriber registration on module EM |
| `src/lib/tenant-isolation/tenant-middleware.ts` | Resolves tenant and activates context |
| `src/subscribers/tenant-bootstrap.ts` | Bootstrap hook — registers subscriber on all module EMs |

Public **published** articles (when at least one row exists):

`GET http://localhost:9000/v1/store/articles?locale=en`

## What belongs here

- Medusa configuration, module registration, and app-level `src/api` wiring only.
- No Guapo or shop-specific production credentials.
- No business logic that belongs in `packages/content-module` or other modules; keep the app thin.

## What does not belong here

- Custom commerce logic that should live in a MercFlow module.
- Storefront apps, or MercFlow `admin-ui` (separate package).
