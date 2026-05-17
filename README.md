# MercFlow

MercFlow is an opinionated [Medusa v2](https://docs.medusajs.com/) distribution: a forked admin UI, native content module, shared design tokens, and a Medusa backend app that registers MercFlow modules. It is a **distribution** (monorepo + modules), not a Medusa core patch set.

## Repository state (bootstrap)

**This repository uses a pnpm monorepo** with packages under `packages/` and `apps/backend` as the Medusa v2 app. If your checkout is still missing directories from the table below, add or materialize the tree before running installs.

**Do not** modify Medusa core packages, vendored Medusa app sources, or files inside `node_modules`. All customization belongs in MercFlow-owned packages and in `apps/backend` registration.

**Working with `mercflow-os`:** Orchestration (Notion webhooks, Cursor SDK scripts) lives in the sibling repo **mercflow-os**. To open both repos in one Cursor window without merging git history, use a multi-root workspace — see the `mercflow-os` README (example: `mercflow-workspace` folder and `mercflow.code-workspace`).

## Expected monorepo layout (Batch 1)


| Path                      | Role                                           |
| ------------------------- | ---------------------------------------------- |
| `packages/admin-ui`       | Admin UI (React + Vite)                        |
| `packages/content-module` | Medusa module: content fields, service, API    |
| `packages/connector-module` | Medusa module: connector config, encrypted credentials |
| `packages/design-tokens`  | Design tokens (CSS + Tailwind)                 |
| `apps/backend`            | Medusa v2 backend registering MercFlow modules |


Use each path’s `README.md` for run instructions (`apps/backend` for the Medusa process and `pnpm dev:backend` from the root `package.json`).

## Tooling and scripts

The repo uses **pnpm** workspaces (`pnpm-workspace.yaml`).

- **Install:** from the repository root, `pnpm install` (in CI: `pnpm install --frozen-lockfile`).
- **Medusa backend (dev):** `pnpm dev:backend` (runs `@mercflow/backend`).
- **Monorepo checks:** `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm ci` (local replica of the CI entrypoints).
- **Build / other dev:** see root `package.json` and per-package READMEs.

## Local development database (PostgreSQL in Docker)

**Local and example-only.** This is for developer machines, not for production or Guapo.

- [Root `docker-compose.yml`](./docker-compose.yml) defines a single PostgreSQL 16 service with healthcheck and a named volume.
- [`apps/backend/.env.example`](./apps/backend/.env.example) documents `DATABASE_URL` and other backend env variables for Medusa.
- [`apps/backend/README.md`](./apps/backend/README.md) explains how to run the backend, env vars, and migrations.

## Further documentation

- Project rules and boundaries: `[AGENTS.md](./AGENTS.md)`
- High-level product and architecture docs (when available): `docs/PRD.md`, `docs/ARCHITECTURE.md`
- CI overview (GitHub Actions jobs + required checks guidance): `docs/CI.md`
- Per-package details: each package and app under `packages/` and `apps/` has its own `README.md` once the monorepo is materialized.