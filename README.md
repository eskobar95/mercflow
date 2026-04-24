# MercFlow

MercFlow is an opinionated [Medusa v2](https://docs.medusajs.com/) distribution: a forked admin UI, native content module, shared design tokens, and a Medusa backend app that registers MercFlow modules. It is a **distribution** (monorepo + modules), not a Medusa core patch set.

## Repository state (bootstrap)

**This working tree is a bootstrap checkout.** The intended MercFlow monorepo layout is **not** fully present here yet. To work on the actual packages and apps, you must **materialize** the monorepo source (for example by cloning, copying, or merging in the real project tree) so the paths below exist with real `package.json` files and code.

**Do not** modify Medusa core packages, vendored Medusa app sources, or files inside `node_modules`. All customization belongs in MercFlow-owned packages and in `apps/backend` registration.

## Expected monorepo layout (Batch 1)

| Path | Role |
|------|------|
| `packages/admin-ui` | Admin UI (React + Vite) |
| `packages/content-module` | Medusa module: content fields, service, API |
| `packages/design-tokens` | Design tokens (CSS + Tailwind) |
| `apps/backend` | Medusa v2 backend registering MercFlow modules |

Until those directories exist, treat this table as the **target** layout, not a guarantee of the current tree.

## Tooling and scripts (when the monorepo is present)

The MercFlow monorepo is expected to use **pnpm** workspaces. After you have a root `package.json` and `pnpm-workspace.yaml`, typical entry points are:

- **Install:** from the repository root, `pnpm install` (see root `package.json` when it exists).
- **Build / typecheck / dev:** use scripts defined in the root `package.json` and in each package under `packages/*` and `apps/*`. Exact script names are defined there—not in this bootstrap README.

**Current checkout:** a root `package.json` and workspace file may be absent. If they are missing, add them when you import the full monorepo; do not assume script names until those files exist.

## Further documentation

- Project rules and boundaries: [`AGENTS.md`](./AGENTS.md)
- High-level product and architecture docs (when available): `docs/PRD.md`, `docs/ARCHITECTURE.md`
- Per-package details: each package and app under `packages/` and `apps/` has its own `README.md` once the monorepo is materialized.
