# `@mercflow/admin-ui`

## Responsibility

This package is the **MercFlow admin user interface** — a Vite + React client that will grow into the forked, page-driven Medusa admin. **Batch 1 (this state)** includes: a **global admin shell** (sidebar, top bar, main column) with **token-backed** styling, **React Router** and lazy-loaded pages, `ErrorBoundary` and `Suspense` around the main outlet for view errors and async loading, a **reusable list layer** in `src/components/ui/list/`, a **`/list-demo` route** with mock data for that layer, a home route with the **token integration proof**, and the design system rules from `.cursor/rules/admin-ui.mdc`. Entity routes with real Medusa data land in follow-up work.

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

Open the Vite dev URL printed in the terminal. The app loads the **admin shell**; the default route shows the **token integration proof** in the main column, and the sidebar includes **List demo** (`/list-demo`) for the list primitives.

## List view primitives (Batch 1)

- **Location:** `src/components/ui/list/`: `ListToolbar` (title, optional filter row), `DataTable` (sortable via header buttons, optional bulk select + row action dropdown from Radix, skeleton + empty), `ListPagination` (size + previous/next + status), `ListEmptyState`, `TableSkeleton`, `RowActionsMenu`, `ListSortLabel`, and typed column definitions in `types.ts` / `listSortState.ts`. All new chrome uses token-backed classes only.
- **Demo:** `ListDemoPage` on `/list-demo` uses static mock rows (search, client-side sort, pagination, and mock “actions”). Use it to smoke test layout and a11y without a backend. Wire real fetches in later pages; keep filtering/sorting in the data layer of each route.
- **Shell rule:** `DataTable` does not own API calls — parents pass rows, `sortState`, and selection setters, matching the `ListPage` split described in `admin-ui.mdc`.

## App shell and routing

- **Entry:** `src/main.tsx` wraps the app in `BrowserRouter` and `React.StrictMode`.
- **Routes:** `src/App.tsx` defines a layout route that renders `AdminShell` and lazy-loaded `HomePage` for `/` and `ListDemoPage` for `/list-demo`.
- **Layout:** `src/components/layout/AdminShell.tsx` provides `AppSidebar`, `TopBar`, and a scrollable `<main id="main-content">` with a **skip link** to that region. The main area wraps `ErrorBoundary` and `Suspense` (fallback `MainLoadingFallback`) around `<Outlet />` so chrome stays on screen when a view fails or suspends.
- **Pages** live under `src/pages/`. New routes should use `PageTransition` (see `.cursor/rules/admin-ui.mdc`) and token-backed classes only in chrome and content.

**Deployment note:** Client-side routes require the host to serve `index.html` for unknown paths (Vite’s dev server and `vite preview` do this; configure static hosting accordingly in production).

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

A file-level map of the shell versus follow-up layout work is in `LAYOUT-AUDIT.md`.

## Styling and tokens

- Global styles: `src/index.css` — imports `@mercflow/design-tokens/mercflow-tokens.css` first, then Tailwind layers.
- Tailwind theme extensions: `tailwind.config.ts` — maps `surface`, `content`, `border`, `interactive`, spacing, radius, shadows, and typography to `**var(--...)**` from the design token sheet (see `.cursor/rules/admin-ui.mdc` for naming alignment).
- Components should use utilities such as `bg-surface-canvas`, `text-content-primary`, `border-border-default`, and interactive tokens — not raw hex in class names.

## Field notes

- **Path alias:** `@/` → `src/` (Vite + TypeScript).
- **Stack:** Vite 5, React 18, TypeScript strict, Tailwind 3, PostCSS + Autoprefixer.

## Migration workflow

This package does not own database migrations. If admin-only persisted data is added later, migrations belong with the Medusa app or a MercFlow module, not in this package.