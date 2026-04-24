# `@mercflow/admin-ui`

## Responsibility

This package is the **MercFlow admin user interface** — a Vite + React client that will grow into the forked, page-driven Medusa admin. **Batch 1 (this state)** is limited to: workspace membership, Tailwind/PostCSS wired to `@mercflow/design-tokens`, a global stylesheet that imports the token CSS, and a tiny proof view so new UI must use **token-backed** utilities (no ad hoc hex for foundational surface, text, and borders in application code). Full layout, list views, and Medusa data wiring land in follow-up work.

## What does *not* belong in this package

- Medusa backend, database migrations, or custom API routes (those go in `apps/backend` and `packages/content-module`)
- Copying the entire upstream Medusa admin in one PR
- Design literals outside the token system for foundational styling (add tokens in `packages/design-tokens` first)
- Storefront, payment/shipping, or public-site UI (out of scope for the admin app)

## Prerequisites

- Node.js 20+
- pnpm 9+ (see the repository root `packageManager` field)

## Install and develop

From the monorepo root:

```sh
pnpm install
pnpm --filter @mercflow/admin-ui dev
```

Open the Vite dev URL printed in the terminal to view the **token integration proof** shell.

## Build and typecheck

Design tokens are built first via the `prebuild` hook so `mercflow-tokens.css` is current before Vite compiles the CSS pipeline.

```sh
pnpm --filter @mercflow/design-tokens build
pnpm --filter @mercflow/admin-ui build
pnpm --filter @mercflow/admin-ui typecheck
```

Or from the root:

```sh
pnpm build:design-tokens
pnpm build:admin-ui
```

Vite output is written to `dist/` in this package (gitignored). The design-tokens package keeps its `dist/` under version control so the workspace can resolve the CSS file without a prior build in fresh clones if needed.

## Layout audit (Batch 1)

A concrete file-level map of the current app shell versus the next global layout task is in **`LAYOUT-AUDIT.md`**.

## Styling and tokens

- Global styles: `src/index.css` — imports `@mercflow/design-tokens/mercflow-tokens.css` first, then Tailwind layers.
- Tailwind theme extensions: `tailwind.config.ts` — maps `surface`, `content`, `border`, `interactive`, spacing, radius, shadows, and typography to **`var(--...)`** from the design token sheet (see `.cursor/rules/admin-ui.mdc` for naming alignment).
- Components should use utilities such as `bg-surface-canvas`, `text-content-primary`, `border-border-default`, and interactive tokens — not raw hex in class names.

## Field notes

- **Path alias:** `@/` → `src/` (Vite + TypeScript).
- **Stack:** Vite 5, React 18, TypeScript strict, Tailwind 3, PostCSS + Autoprefixer.

## Migration workflow

This package does not own database migrations. If admin-only persisted data is added later, migrations belong with the Medusa app or a MercFlow module, not in this package.
