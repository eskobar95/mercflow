# `@mercflow/admin-ui`

## Responsibility

This package is the **MercFlow admin user interface** — a Vite + React 18 client that will grow into the forked, page-driven Medusa admin. **Current state:** a **global admin shell** (Shopify-inspired sidebar, header, token-backed styling, `PageTransition` on the main outlet) with **React Router data APIs** (`createBrowserRouter` + `RouterProvider`), placeholder routes for primary nav targets, and a dashboard home that still hosts the **token integration proof**. **List and detail pages** for products, categories, and content (mock or Medusa-backed) remain in `src/pages/` for Sprint 2+ wiring into the router. **`components/ui/list/`** and related demos are unchanged for reuse.

## What does *not* belong in this package

- Medusa backend, database migrations, or custom API routes except the admin UI bundle itself
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
pnpm dev
```

This starts the admin UI on **`http://localhost:9000`** (strict port). You can instead run `pnpm --filter @mercflow/admin-ui dev`.

Open the shell: the default route shows the **token integration proof** on the dashboard; the sidebar lists **Products**, **Orders**, **Customers**, **Categories**, **Content** (Articles, Pages, Globals), and **Settings → Connectors** (placeholders until Sprint 2).

## Entity lists and legacy demo routes (not in shell router yet)

- **Source files:** `ProductListPage`, `ProductCategoryListPage`, `ListDemoPage`, product/category create and detail pages, and **`useMockEntityListState`** remain under `src/pages/` and `src/hooks/` for Sprint 2 when they are reattached to `/products`, `/categories`, etc.

## List view primitives (Batch 1)

- **Location:** `src/components/ui/list/`: `ListToolbar` (title, optional filter row), `DataTable` (sortable via header buttons, optional bulk select + row action dropdown from Radix, skeleton + empty), `ListPagination` (size + previous/next + status), `ListEmptyState`, `TableSkeleton`, `RowActionsMenu`, `ListSortLabel`, and typed column definitions in `types.ts` / `listSortState.ts`. All new chrome uses token-backed classes only.
- **Demo:** `ListDemoPage` exists for local testing of the list stack; it is **not** linked from the shell sidebar until a task wires `/list-demo` again.
- **Shell rule:** `DataTable` does not own API calls — parents pass rows, `sortState`, and selection setters, matching the `ListPage` split described in `admin-ui.mdc`.

## Mock data (Batch 1)

- **Data:** `src/data/mockProducts.ts` and `src/data/mockProductCategories.ts` export static rows for future list wiring.

## App shell and routing

- **Entry:** `src/main.tsx` mounts `RouterProvider` with `createMercflowAdminRouter()` from `src/appRouter.tsx`.
- **Routes:** `mercflowAdminShellRoutes` defines the layout route (`AdminShell`) and children: `HomePage` (`/` dashboard), placeholders for **`/products`**, **`/orders`**, **`/customers`**, **`/categories`**, **`/content/articles`**, **`/content/pages`**, **`/content/globals`**, **`/settings/connectors`**, plus a splat **`NotFoundPage`**. Route `handle.title` feeds the `TopBar`.
- **Tailwind:** `tailwind.config.ts` consumes **`@mercflow/design-tokens/tailwind-preset`** (no duplicate theme map in this package).
- **Layout:** `src/components/layout/AdminShell.tsx` provides `AppSidebar`, `TopBar`, and a scrollable `<main id="main-content">` with a **skip link** to that region. The main area wraps `ErrorBoundary` and `Suspense` (fallback `MainLoadingFallback`) around `<Outlet />` so chrome stays on screen when a view fails or suspends.
- **Pages** live under `src/pages/`. Route-level transitions are applied once in `AdminShell` around `<Outlet />` via `PageTransition` (see `.cursor/rules/admin-ui.mdc`); page files render content only. Use token-backed classes in chrome and content.

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

Vite output is written to `dist/` in this package (gitignored). `@mercflow/design-tokens` must be built so `mercflow-tokens.css` exists; `prebuild` does that for production builds, and `pretest:e2e` does it before Playwright starts the Vite dev server.

## Tests

- **Unit / component tests (Vitest):** from the monorepo root, `pnpm test` runs the workspace test projects (this package is configured with a `jsdom` environment).
- **Playwright smoke (E2E):** `pnpm --filter @mercflow/admin-ui test:e2e` (starts Vite via Playwright; CI starts Vite in the workflow instead — see `docs/CI.md`)

On a fresh machine, install Playwright browsers once:

```sh
pnpm --filter @mercflow/admin-ui exec playwright install
```

## Layout audit (Batch 1)

A file-level map of the shell versus follow-up layout work is in `LAYOUT-AUDIT.md`. Modal, overlay, and dialog-style usage (current tree + fork handoff) are documented in `MODAL-AUDIT.md`.

## Styling and tokens

- Global styles: `src/index.css` — imports `@mercflow/design-tokens/mercflow-tokens.css` first, then Tailwind layers.
- Tailwind theme extensions: `tailwind.config.ts` — uses the **`@mercflow/design-tokens/tailwind-preset`** so `surface`, `content`, `border`, `interactive`, spacing, radius, shadows, and typography map to `var(--…)` from the design token sheet (see `.cursor/rules/admin-ui.mdc` for naming alignment).
- Components should use utilities such as `bg-surface-canvas`, `text-content-primary`, `border-border-default`, and interactive tokens — not raw hex in class names.

## Product content API (dev)

- **Data layer:** `src/features/product-content/` — types, `getProductContent` / `saveProductContent`, and `useProductContentState` (`loading`, `saving`, separate **`loadError`** / **`saveError`**, `load` / `save` return **`Promise<boolean>`** for success, `clearError`).
- **UI:** `src/components/product-content/` — TipTap v2 rich text (`description_rich` as JSON), SEO fields + preview, OG image id, sortable media ID list; composed on **`/products/:productId`** → **Content** tab. TipTap uses the standard extension set: `StarterKit`, `Link` (`openOnClick: false`), `Image`, `CharacterCount`.
- **Env:** Copy `.env.example` to `.env.local` and set `VITE_MEDUSA_ADMIN_BACKEND_URL` to the Medusa backend (see `apps/backend` README, default `http://localhost:9000`). If the Vite origin is not allowed by `ADMIN_CORS` on the backend, either add it there or use a dev proxy.
- **Auth:** Requests use `credentials: "include"` for session cookies. For cross-origin setups without cookies, set `VITE_MEDUSA_ADMIN_BEARER_TOKEN` locally (never commit real tokens).
- **Gallery / OG:** The tab stores **media file IDs** only; there is no Medusa upload widget in this shell — use known ids from your dev database or the backend file API separately.

## Category content API (dev)

- **Data layer:** `src/features/category-content/` — types, `getCategoryContent` / `saveCategoryContent`, and `useCategoryContentState` with the same async surface as product (`loading`, `saving`, `loadError`, `saveError`, `load` / `save` return `Promise<boolean>`, `clearError`, optional `loadOnMount`).
- **HTTP:** `GET/POST /admin/product-categories/:id/content?locale=…` (default locale **`en`** on the client when omitted). **DTO delta vs product:** responses use `category_id` (not `product_id`), include **`banner_image_id`**, and **omit** `media_gallery` on save payloads (see `packages/content-module` README).
- **Env / auth:** Same as product — `VITE_MEDUSA_ADMIN_BACKEND_URL`, `VITE_MEDUSA_ADMIN_BEARER_TOKEN`, `credentials: "include"` (see `.env.example`).
- **UI:** `src/components/category-content/CategoryContentTab.tsx` — reuses product `ProductDescriptionEditor` / `SEOPreview`; banner and OG use single ID fields (no `media_gallery`). Includes **Discard changes** (reloads from API).

## Content editing locale (dev)

- **Store locales:** Loaded from Medusa **`GET /admin/locales`** via `listAdminLocales` / `useAdminLocales`. Requests use **`order=created_at`** (oldest first). Medusa’s `AdminLocale` type has no `is_default` field; the **first row after that ordering** is used as the UI’s preferred code when the client fallback `en` is not in the list. Locale `code` values are BCP-47 and must match the `locale` query on MercFlow content APIs. Do not hardcode a production language list; add or enable locales in Medusa if the list is empty or outdated.
- **State:** `src/features/content-locale/` — `useContentLocale` keeps the active editing code aligned with the list returned from the admin API (admin-only context; no store region or storefront language changes).
- **UI:** `src/components/content-locale/ContentLocaleSwitcher.tsx` — token-backed control: “Editing language”, the **exact `locale` query code** in use, loading / empty-list status, and optional mismatch warning if the loaded content row’s `locale` differs from the switcher. Native `<select>` for keyboard support.
- **Save before switch:** Unsaved MercFlow content (rich text, SEO, IDs, gallery/banner) opens **`ContentLocaleUnsavedDialog`** (`<dialog>`): **Save and switch**, **Discard and switch** (reloads current locale from the API), or **Cancel** / Escape. A failed save or discard **does not** change the active language. With no dirty fields, changing the switcher updates the locale immediately.
- **Failed content load after a switch:** The tabs revert the switcher to the **previous** locale and surface **`loadError`** so a failed fetch is not treated as a successful switch.
- **Shared HTTP:** `src/medusa-admin/medusaAdminFetch.ts` centralizes backend URL resolution, JSON headers, and response parsing for admin requests (product/category content APIs and the locale list).
- **Tabs:** Product and category **Content** tabs compose the switcher and pass the active code into `useProductContentState` / `useCategoryContentState` so reads and writes use `?locale=`. Product tab includes **Discard changes** like category. Core Medusa fields (title, handle, etc.) stay in Medusa’s own editors; MercFlow **Content** is for `description_rich`, SEO, and media/banner IDs per the content module README.

## Field notes

- **Path alias:** `@/` → `src/` (Vite + TypeScript).
- **Stack:** Vite 5, React 18, TypeScript strict, Tailwind 3, PostCSS + Autoprefixer.

## Migration workflow

This package does not own database migrations. If admin-only persisted data is added later, migrations belong with the Medusa app or a MercFlow module, not in this package.