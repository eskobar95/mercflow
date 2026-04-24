# Layout audit — `packages/admin-ui` (Batch 1 baseline)

**Purpose:** Map the current minimal Vite app so Task 3.2 can add a Shopify-inspired global shell without rediscovery. No Medusa data or backend scope.

## 1. Entry, routing, and global layout

| Area | Path | What exists | Gap vs. Batch 1 admin shell |
|------|------|-------------|-----------------------------|
| Bootstrap | `src/main.tsx` | `StrictMode`, single `App` root, imports `./index.css` | No app-level error boundary, no suspense boundary for future data |
| Tree root | `src/App.tsx` | Single `<main className="p-8">` → `TokenIntegrationProof` | No React Router, no nested routes, no layout wrapper beyond `<main>` |
| Global CSS | `src/index.css` | Token CSS first; Tailwind layers; `body` uses `min-h-screen`, `bg-surface-canvas`, `font-sans`, `text-content-primary` | No CSS variables for layout columns (sidebar width can stay Tailwind theme later if needed) |
| HTML shell | `index.html` (not detailed here) | Standard Vite `#root` | Favicon/title are dev defaults — acceptable for 3.2 to adjust |

**Reuse for 3.2:** Keep `main.tsx` import order (CSS first via `index.css`); keep `body` base styles in `@layer base`.

**Add in 3.2 (concrete file-level targets):**

- **`src/main.tsx`:** Optionally wrap with an error boundary component once it exists, e.g. `src/components/ui/ErrorBoundary.tsx` (or feature-level) — only if 3.2 scope includes it.
- **`src/App.tsx`:** Replace flat `<main>` with a composition point for **shell**: e.g. import `AdminShell` from `src/components/layout/AdminShell.tsx` that provides sidebar region, topbar region, and scrollable main. Inner content becomes outlet or children.
- **Router:** Add `react-router` (or agreed router) in a new `src/routes.tsx` or colocated in `App.tsx`; first route can still render the proof page for smoke testing.

**Loading / error host regions (not present):** Plan a **main column** that can show route-level loading (skeleton) and errors without replacing the whole shell — e.g. a `MainContent` slot inside `AdminShell` with optional `ErrorBoundary` per route later.

## 2. Component architecture vs. `admin-ui.mdc`

The rule file describes `components/ui/`, `components/*`, and `pages/*`. **Current tree only has** `src/components/TokenIntegrationProof.tsx` — the hierarchy is **not** instantiated yet.

**Recommended layout for 3.2 (aligns with rules):**

| Layer | Suggested new paths | Role |
|-------|---------------------|------|
| Layout shell | `src/components/layout/AdminShell.tsx` | Flex/grid root: left nav column, top bar row, main. Uses semantic `<aside>`, `<header>`, `<main>`, `nav` as appropriate. |
| Chrome building blocks | `src/components/layout/Sidebar.tsx`, `TopBar.tsx` (or `AppSidebar` / `AppTopBar`) | Presentational; token-backed classes only. |
| Base UI (future) | `src/components/ui/Card.tsx`, `Button.tsx`, … | Thin Radix + tokens when chrome needs real controls. |
| Pages | `src/pages/HomePage.tsx` (or `ProofPage.tsx`) | Move `TokenIntegrationProof` usage here; `App` only wires router → layout. |

**Reuse:** `TokenIntegrationProof` can remain as **demo content** inside the first page until real routes exist.

## 3. Card and surface patterns today

- **Only example:** `TokenIntegrationProof` — one “card” block: `rounded-lg border border-border-default border-l-4 border-l-border-focus bg-surface-default p-6 shadow-sm`.
- **Buttons:** Native `<button>` with token utilities (`bg-interactive-primary`, hover, focus ring) — not yet a shared `Button` component.

**Token entry points (keep):**

- **`tailwind.config.ts`:** `colors.surface|content|border|interactive`, `boxShadow`, `borderRadius`, `spacing`, `zIndex` — all map to `var(--…)`; shell should use the same (e.g. `bg-surface-canvas` for app background, `bg-surface-raised` or `default` for panels, `shadow-md` for sticky topbar if spec’d).
- **`src/index.css`:** `body` canvas — topbar/sidebar should **not** introduce hex; use `bg-surface-*`, `border-border-*`, `shadow-*` from the existing scale.

**Add in 3.2:** Optional shared **`Card`** in `components/ui/Card.tsx` wrapping token patterns (`bg-surface-default`, `border-border-default`, `rounded-lg`, `shadow-sm`) so list/detail pages do not duplicate class strings.

## 4. Reuse vs. replace summary

| Keep | Add or extend in 3.2 |
|------|----------------------|
| Vite, React 18, TS strict, Tailwind 3, PostCSS | React Router (or project-standard router) |
| `@import` of `mercflow-tokens.css` in `index.css` | `AdminShell` + nav chrome components |
| `tailwind.config.ts` token bridge | `PageTransition` wrapper per rules when pages exist |
| `TokenIntegrationProof` as content smoke test | `pages/`, `components/layout/`, `components/ui/` as needed |

**Replace:** Nothing mandatory in 3.1; `App.tsx` will **evolve** in 3.2 rather than a full delete.

## 5. Out of scope (unchanged)

- No Medusa admin fork, no API — Batch 1 admin layer only.
- No new design tokens required for a minimal shell if existing `surface` / `border` / `shadow` / `zIndex` are sufficient; add tokens in `design-tokens` only when a value is truly missing.
