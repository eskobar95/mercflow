# `@mercflow/admin-ui`

## Responsibility

This package is the **MercFlow admin user interface** — a Vite + React client that will grow into the forked, page-driven Medusa admin. It includes a **global admin shell** (sidebar, top bar, main column) with **token-backed** styling, **React Router** and lazy-loaded pages, `ErrorBoundary` and `Suspense` around the main outlet, a **reusable list layer** in `src/components/ui/list/`, and **`/products` / `/products/:productId`** backed by **`@medusajs/js-sdk`** and **TanStack React Query v5** when `VITE_MEDUSA_ADMIN_BACKEND_URL` is set (with a mock catalogue fallback when it is omitted). **`/product-categories`** is backed by **`src/features/product-categories/`**, which wraps **`GET /admin/product-categories`** ( **`expand=products`** for counts) and **`GET /admin/product-categories/:id`** for the overview/detail shell using the same Medusa Admin origin + auth conventions as **`medusaAdminFetch`** / category content helpers. **CMS articles** use **`src/features/articles/articlesApi.ts`** against **`/admin/articles`**. **`/list-demo`** and a few mock-only flows remain for smoke demos, plus the usual design-system rules from `.cursor/rules/admin-ui.mdc`.

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

Open the Vite dev URL printed in the terminal. The app loads the **admin shell**; the default route shows the **token integration proof** in the main column, and the sidebar includes **Products**, **Product categories**, and **List demo** for the list stack.

## List view primitives (Batch 1)

- **Location:** `src/components/ui/list/`: `ListToolbar` (title, optional filter row), `DataTable` (sortable via header buttons, optional bulk select + row action dropdown from Radix, skeleton + empty), `ListPagination` (size + previous/next + status), `ListEmptyState`, `TableSkeleton`, `RowActionsMenu`, `ListSortLabel`, and typed column definitions in `types.ts` / `listSortState.ts`. All new chrome uses token-backed classes only.
- **Demo:** `ListDemoPage` on `/list-demo` uses static mock rows (search, client-side sort, pagination, and mock “actions”). Use it to smoke test layout and a11y without a backend. Wire real fetches in later pages; keep filtering/sorting in the data layer of each route.
- **Shell rule:** `DataTable` does not own API calls — parents pass rows, `sortState`, and selection setters, matching the `ListPage` split described in `admin-ui.mdc`.

## Product catalogue (read views)

- **List:** `/products` → `ProductListPage` — columns for thumbnail, title, status, variant count, total stock (when tracked), derived price range, and `updated_at`; **All / Active / Draft** filter; title search debounced **300ms** and passed to `GET /admin/products`; pagination **20** per page (`useProductsCatalogList` under `src/hooks/products/`).
- **Detail:** `/products/:id` → `ProductDetailPage` — **Overview** (title, plain-text preview of Medusa `description`, status badge, media thumbnail strip from thumbnail + gallery) and **Variants** (one row per variant: name/SKU hint, merged price + stock/inventory summary). No separate inventory tab.
- **Client:** Shared SDK factory `src/medusa-admin/createMercflowMedusaSdk.ts` (session + optional bearer header via env). Hooks use **`@tanstack/react-query`** queries; without `VITE_MEDUSA_ADMIN_BACKEND_URL`, catalogue pages fall back to `src/data/mockProducts.ts` for deterministic dev.

## Product categories

- **Hierarchy list:** `/product-categories` → `ProductCategoryListPage` — depth-first **`buildHierarchyRowsFromCategories`** over Medusa **`parent_category_id`**, **`ProductCategoryHierarchyTable`** indents descendants with token spacing, exposes handle, **`products.length`** as the linked product badge, **`is_active`**, and `updated_at`.
- **Create:** `/product-categories/new` → **`ProductCategoryNewPage`** composes **`ProductCategoryCrudForm`** — **`POST /admin/product-categories`** (`name`, `handle`, **`parent_category_id`**, **`is_active`**). Handle slugifies from the name until edited; parents load in hierarchical order for the select.
- **Edit + delete:** `/product-categories/:id` (**Overview**) — same **`ProductCategoryCrudForm`** with **`POST /admin/product-categories/:id`** (Medusa update route) and **`DELETE /admin/product-categories/:id`**. Parents exclude the current category and its descendants to avoid cycles. Deletes use **`AlertDialog`** confirmation; API errors surface inline (including when products block deletion).
- **Read-only context:** **`CategoryOverviewSummary`** — **`description`** preview and linked **product counts** beneath the edit card; the MercFlow **Content** tab stays in **`src/features/category-content/`**.

## CMS articles (MER-34)

- **List:** `/content/articles` → **`ArticlesListPage`** — **`GET /admin/articles`** (default `locale=en`); **`DataTable`** with title, status, published timestamp, locale; empty state + **New article**.
- **Edit / create:** `/content/articles/new` and `/content/articles/:articleId` → **`ArticleEditPage`** — TipTap body, title + slug (slug auto-follows title until manually edited; Nordic transliteration matches the content-module utility), draft/published **Switch**, optional **datetime-local** when published, **Save** (**`POST`** / **`PATCH /admin/articles/:id`**), **Delete** (**`DELETE`**).

## Customers (read views)

- **List:** `/customers` → **`CustomersListPage`** — **`GET /admin/customers`** with debounced **`q`** (Medusa search on name/email), **`DataTable`** columns for display name, email, **orders** (**total row count from `/admin/orders?customer_id=`** paging), **lifetime value** (sum of **`total`** for orders whose **`payment_status`** is **`captured`**, **`completed`**, or **`partially_captured`**), and **customer since** (`created_at`). Requires **`VITE_MEDUSA_ADMIN_BACKEND_URL`** (+ optional bearer) like other Medusa reads.
- **Detail:** `/customers/:customerId` → **`CustomerDetailPage`** — **`GET /admin/customers/:id`**, **`GET /admin/orders`** (latest **10**, sorted by **`created_at`** desc) with status and amount; **lifetime value** callout aggregates paid orders via the same paging helper as the list. **`GET /admin/stores`** (limit 1) supplies default currency formatting when totals are zero.
- **Implementation:** **`src/features/customers/`** (Admin fetch + parsing hooks) and **`src/components/customers/`** (profile card, orders table, directory metric cells, lifetime highlight).

## Demo fixtures & mock shells

- **Routes:** **`/products/new`** → **`ProductCreatePage`** (unified product + variant + inventory create via Medusa Admin API). **`/product-categories/new`** persists via Medusa when the admin backend URL + session are configured. **`/product-categories`** and **`/product-categories/:id`** rely on the Medusa reads and writes described above when connected.
- **Legacy fixtures:** `src/data/mockProductCategories.ts` is retained only for tooling or future storybook/demo seeds — the routed hierarchy list page no longer reads it.
- **`useMockEntityListState`** powers `/list-demo` and deliberately static demos until corresponding fetch hooks land.

## Orders (read-only — Medusa Admin API)

- **Routes:** `/orders` → `OrdersListPage` (via `OrdersPage` re-export in `src/pages/OrdersPage.tsx`), `/orders/:orderId` → `OrderDetailPage`. Declared in `src/router.tsx` with list and detail paths (detail registered first so params resolve correctly).
- **HTTP:** `src/features/orders/ordersAdminApi.ts` uses `GET /admin/orders` and `GET /admin/orders/:id` with the same origin + cookie / bearer pattern as `src/medusa-admin/medusaAdminFetch.ts` (see `.env.example`: `VITE_MEDUSA_ADMIN_BACKEND_URL`, optional `VITE_MEDUSA_ADMIN_BEARER_TOKEN`).
- **Parsing:** `orderJson.ts` maps Medusa JSON into narrow list/detail types; money is treated as **minor units** and formatted with `formatAdminCurrency` (`da-DK` locale).
- **UI:** Feature components under `src/components/orders/` (timeline, line items, customer + shipping + payment cards). Status bucket filters (All / Pending / Processing / …) are applied **client-side** on a capped fetch window (see `useOrdersList` — up to ~800 rows) so operators get consistent grouping without extra backend work in this slice.
- **Tests:** `test/OrdersPages.test.tsx` mocks `fetch` for list + detail render checks.

## App shell and routing

- **Entry:** `src/main.tsx` wraps the app in `BrowserRouter`, `React.StrictMode`, and **`QueryClientProvider`** (TanStack Query).
- **Routes:** `src/router.tsx` defines a layout route that renders `AdminShell` and lazy routes: `HomePage` (`/`), **`CustomersListPage` (`/customers`)**, **`CustomerDetailPage` (`/customers/:customerId`)**, **`ProductCreatePage` (`/products/new`)**, `ProductEditPage` (`/products/:productId/edit`, registered before `:productId` detail route), `ProductListPage` (`/products`), **`ProductDetailPage` (`/products/:productId`)** with tabs **Overview** and **Variants** (`?tab=variants` deep-link); the **Content** tab for MercFlow product fields is deferred to Sprint 3 (feature code remains under `src/features/product-content/`). `ProductCategoryNewPage` (`/product-categories/new`), **`ProductCategoryDetailPage` (`/product-categories/:categoryId`)** with **`?tab=content`** for category content (TipTap, SEO, banner + OG image IDs), `ProductCategoryListPage` (`/product-categories`), **`ArticlesListPage` (`/content/articles`)**, **`ArticleEditPage` (`/content/articles/new` and `/content/articles/:articleId`)** backed by **`GET/POST/PATCH/DELETE /admin/articles`**, `ListDemoPage` (`/list-demo`).
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

- **Unit / component tests (Vitest):** from the monorepo root, `pnpm test` runs the workspace Vitest projects. This package configures `vitest.config.ts` with **`@vitejs/plugin-react`**, the `@/` alias, **`jsdom`**, and **`vitest-setup.ts`** (**`@testing-library/jest-dom`** matchers + **`@testing-library/react` `cleanup()`** after each case).
- **Playwright smoke (E2E):** `pnpm --filter @mercflow/admin-ui test:e2e` (starts Vite via Playwright; CI starts Vite in the workflow instead — see `docs/CI.md`)

On a fresh machine, install Playwright browsers once:

```sh
pnpm --filter @mercflow/admin-ui exec playwright install
```

## Layout audit (Batch 1)

A file-level map of the shell versus follow-up layout work is in `LAYOUT-AUDIT.md`. Modal, overlay, and dialog-style usage (current tree + fork handoff) are documented in `MODAL-AUDIT.md`.

## Styling and tokens

- Global styles: `src/index.css` — imports `@mercflow/design-tokens/mercflow-tokens.css` first, then Tailwind layers.
- Tailwind theme extensions: `tailwind.config.ts` — maps `surface`, `content`, `border`, `interactive`, spacing, radius, shadows, and typography to `var(--…)` from the design token sheet (see `.cursor/rules/admin-ui.mdc` for naming alignment).
- Components should use utilities such as `bg-surface-canvas`, `text-content-primary`, `border-border-default`, and interactive tokens — not raw hex in class names.

### Form controls (MER-52)

Use primitives from `src/components/ui/` (`Input`, `Textarea`, `Select`, `FormField`, `RichTextEditor`) instead of ad-hoc `shadow-sm` on fields inside cards.

**Reference lock:** form controls follow **Stripe Dashboard** density; page chrome (sidebar, top bar CTAs) stays **Mercury/Asana**.

| Surface | Border radius | Shadow |
|--------|---------------|--------|
| Form section card | `rounded-md` (10px) | none — `elevation="flat"` |
| Input / select trigger | `rounded-sm` (6px) | none — hairline border |
| Checkbox | `rounded-sm` (6px), square | none |
| Dropdown / popover panel | `rounded-sm` | `shadow-md` — single float layer |
| Rich text (embedded in Card) | flush via `-mx-6` bleed | none on editor chrome |
| Action buttons in forms | `rounded-sm` | none on secondary |
| Field focus | accent border | no outer glow — `fieldFocusClass` |
| Button focus (keyboard) | 1px offset outline | subtle, not 3px halo |

- Labels: 13px medium; hints **below** the control (Stripe settings pattern).
- Select menu hover/selected: `bg-accent-subtle`.
- `RichTextEditor` with `variant="embedded"` belongs inside a flat `Card` that owns the title and description.
- **Button shapes:** `shape="default"` for in-page actions; `shape="pill"` for global chrome only (TopBar Create, ⌘K). Always use `Button` — no inline discard buttons with `shadow-sm`.

## Product content API (dev)

- **Data layer:** `src/features/product-content/` — **`getProductContent`** calls **`GET /admin/product-content/:productId?locale=`** + **`parseProductContentReadPayload`** (404 → `null`, otherwise expects metadata like `id`, `product_id`, `locale`, **`version`**). **`saveProductContent`** issues **`POST /admin/product-content?locale=`** until a row exists, then **`PATCH /admin/product-content/:cmsRowId`**. Saves return the same flattened payload shapes as reads. **`useProductContentState`** wires loading/saving, applies an **optimistic UI merge per save** (`version` bumps optimistically server-side authoritative after success), separates **`loadError`** / **`saveError`**, and keeps `Promise<boolean>` booleans from `load` / `save`.
- **UI:** `ProductContentTab` composes the shared **`ProductDescriptionEditor` → RichTextEditor (full TipTap preset)** plus SEO controls (character counters — title 255, description 160), OG URL field, **`SEOPreview`**, **`Save content` / Discard changes**. Locale UX still reads the **first** entry from **`GET /admin/locales`** until Sprint&nbsp;4 adds switching.
- **Env:** Copy `.env.example` to `.env.local` and set `VITE_MEDUSA_ADMIN_BACKEND_URL` to the Medusa backend (see `apps/backend` README, default `http://localhost:9000`). If the Vite origin is not allowed by `ADMIN_CORS` on the backend, either add it there or use a dev proxy.
- **Auth:** Requests use `credentials: "include"` for session cookies. For cross-origin setups without cookies, set `VITE_MEDUSA_ADMIN_BEARER_TOKEN` locally (never commit real tokens).
- **Media:** This shell stores OG targets as opaque strings (`seo_og_image_id` key in mutations backs `og_image_url`). Provide public URLs (`https://…`) or IDs your FILE module resolves; there is no inline upload UX in this slice.

## Category content API (dev)

- **Data layer:** `src/features/category-content/` — **`getCategoryContentRead`** calls **`GET /admin/category-content/:categoryId?locale=`** (404 → `null`) and parses the MercFlow flat payload (`body_json`, **`og_image_url`**, **`banner_image_url`**, **`version`**). **`saveCategoryContent`** issues **`POST /admin/category-content?locale=`** until a CMS row exists, then **`PATCH /admin/category-content/:cmsRowId`**; responses match the read shape. **`useCategoryContentState`** mirrors the product hook (optimistic merge, `loadError` / `saveError`, `Promise<boolean>` from `load` / `save`).
- **UI:** `CategoryContentTab` on **`/product-categories/:id?tab=content`** — same TipTap surface as **`ProductContentTab`**, SEO limits (title **255**, snippet **160**), OG + banner fields, **`SEOPreview`**, **Add content** when no row exists, version hint, and Discard when dirty. Editing locale prefers **Danish** when present in **`GET /admin/locales`** (same helper pattern as products); Sprint&nbsp;4 adds full locale switching UX.
- **Legacy nested envelope:** **`GET` / `POST` `/admin/product-categories/:id/content`** with **`{ content: … }`** remains wired in the backend for older clients; MercFlow authoring should use flat routes documented in `packages/content-module/README.md`.

## Content editing locale (dev)

- **Store locales:** Loaded from Medusa **`GET /admin/locales`** via `listAdminLocales` / `useAdminLocales`. Requests use **`order=created_at`** (oldest first). Medusa’s `AdminLocale` type has no `is_default` field; the **first row after that ordering** is used as the UI’s preferred code when the client fallback `en` is not in the list. Locale `code` values are BCP-47 and must match the `locale` query on MercFlow content APIs. Do not hardcode a production language list; add or enable locales in Medusa if the list is empty or outdated.
- **State:** `src/features/content-locale/` — `useContentLocale` keeps the active editing code aligned with the list returned from the admin API (admin-only context; no store region or storefront language changes).
- **UI:** `src/components/content-locale/ContentLocaleSwitcher.tsx` — token-backed control: “Editing language”, the **exact `locale` query code** in use, loading / empty-list status, and optional mismatch warning if the loaded content row’s `locale` differs from the switcher. Native `<select>` for keyboard support.
- **Save before switch:** Unsaved MercFlow content (rich text, SEO, IDs, gallery/banner) opens **`ContentLocaleUnsavedDialog`** (`<dialog>`): **Save and switch**, **Discard and switch** (reloads current locale from the API), or **Cancel** / Escape. A failed save or discard **does not** change the active language. With no dirty fields, changing the switcher updates the locale immediately.
- **Failed content load after a switch:** The tabs revert the switcher to the **previous** locale and surface **`loadError`** so a failed fetch is not treated as a successful switch.
- **Shared HTTP:** `src/medusa-admin/medusaAdminFetch.ts` centralizes backend URL resolution, JSON headers, and response parsing for admin requests (product/category content APIs and the locale list).
- **Tabs:** Product **`Content`** tabs use **`useProductContentState`**. Category **`Content`** tabs use **`useCategoryContentState`** against the MercFlow **`/admin/category-content`** route family. Core Medusa fields stay in Medusa’s own editors.

## Field notes

- **Path alias:** `@/` → `src/` (Vite + TypeScript).
- **Stack:** Vite 5, React 18, TypeScript strict, Tailwind 3, PostCSS + Autoprefixer.

## Migration workflow

This package does not own database migrations. If admin-only persisted data is added later, migrations belong with the Medusa app or a MercFlow module, not in this package.