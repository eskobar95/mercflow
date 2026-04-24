# MercFlow backend app

**Medusa v2** application for MercFlow. It registers MercFlow modules (for example the content module) and hosts admin API and storefront API as configured. This directory is a **scaffold** for local development: the full Medusa app appears when the monorepo source is materialized. Until then, use this file for **local database and environment** expectations.

## What belongs here

- Medusa v2 app configuration and module registration for MercFlow packages.
- No Guapo or other production shop-specific credentials.
- No custom business logic that should live in `packages/content-module` or other modules; keep the app thin and delegate to modules.

## Local PostgreSQL (Docker)

From the **repository root** (where `docker-compose.yml` lives):

1. Start PostgreSQL: `docker compose up -d`
2. Wait until the service is healthy (`docker compose ps`).

**Defaults (development only, example-only secrets):**

| Variable / setting | Value |
|--------------------|--------|
| Host (from host machine) | `localhost` |
| Port | `5432` |
| User | `mercflow` |
| Password | `mercflow_dev` |
| Database | `mercflow` |

Connection string (same components as `.env.example`):

`postgres://mercflow:mercflow_dev@localhost:5432/mercflow`

Copy `.env.example` to `.env` in this directory and align `DATABASE_URL` if you change user, password, database name, or port in `docker-compose.yml`.

## Environment

- `DATABASE_URL` — PostgreSQL connection string for Medusa and MikroORM.
- `JWT_SECRET` / `COOKIE_SECRET` — required by Medusa; set for local use (e.g. random strings). Do not reuse production values here.

## Migrations

Run Medusa (and project) migrations **against the same database** as `DATABASE_URL` after the real backend package exists and dependencies are installed.

Typical flow once `package.json` and the Medusa CLI are available in this app:

1. `pnpm install` (from monorepo root, or as documented in the real repo).
2. From `apps/backend` (or using workspace filter from root, as in the final monorepo): use the **Medusa database migrate** command provided by the Medusa v2 CLI for this project, for example:  
   `pnpm exec medusa db:migrate`  
   (Exact script may be a `package.json` script; follow the real `package.json` when the app is present.)

**MercFlow `content-module` migrations** follow the monorepo’s migration workflow (for example a root or package script like `migration:run`); run those **after** the base Medusa database is reachable and the module is registered.

If this directory does not yet contain a `package.json`, record the intended `DATABASE_URL` in `.env` when you add the app, then run the commands above when the Medusa app is in place.

## What does not belong here

- Storefronts, payment or shipping Guapo production config, or secrets for non-local environments. Do not add staging or production connection strings to committed files.
