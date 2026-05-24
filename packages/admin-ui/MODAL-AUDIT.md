# Modal and overlay audit — `packages/admin-ui` (Batch 1)

## Scope

This document describes **dialog-style overlays**, **floating menus**, and **related design tokens** in the current MercFlow Vite + React admin shell. It is limited to the **in-repo** `packages/admin-ui` source tree. No `node_modules` or upstream Medusa admin code was inspected.

**Out of scope for this file:** `apps/backend`, `packages/content-module`, and any future forked Medusa admin tree that is not yet present here.

## Methodology

1. **Text search** (case-insensitive) under `packages/admin-ui` for: `Dialog`, `AlertDialog`, `Modal`, `Sheet`, `drawer`, `Drawer`, and Radix `dialog` / `alert-dialog` / `sheet` imports.
2. **Dependency review:** `package.json` for `@radix-ui/`* packages.
3. **Manual read** of routing (`App.tsx`), layout (`AdminShell.tsx`), list stack (`DataTable`, `RowActionsMenu`), `PageTransition`, and `tailwind.config.ts` for z-index / overlay-related tokens.
4. **Cross-check** with product rules in `.cursor/rules/admin-ui.mdc` (pages vs modals, `PageTransition`).

## Findings

### Summary

The current package **does not** ship any `Dialog`, `AlertDialog`, `Sheet`, or drawer component. The only **Radix overlay pattern** in use is **DropdownMenu** (floating menu, not a full-screen or blocking modal). **Primary-entity CRUD** is not implemented as modals; list pages are **page routes** with mock data.

Design tokens and Tailwind theme keys named `modal` / `modalBackdrop` **exist** for future stacking but are **not** wired to a living modal component in this tree.

### Inventory


| Location                                       | Library / mechanism                                              | Role in UX                                               | Classification                                                                                                                            | Route or state                                                                    | Risks / notes                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/list/RowActionsMenu.tsx`    | `@radix-ui/react-dropdown-menu`                                  | Per-row `⋯` menu for contextual actions (e.g. list demo) | **Preserve** as overlay menu (not a primary-entity form). Aligns with “contextual actions” / short flows; not a URL-worthy surface today. | **N/A** (row-scoped; parent supplies `onSelect` callbacks). No route change.      | Radix **focus management** and **typeahead** for menus are in good standing; ensure trigger `aria-label` stays descriptive when real entities ship. **Destructive** items are **styled** only—no `AlertDialog` confirmation is wired; destructive flows added later should use explicit confirm patterns per `admin-ui.mdc`. |
| `tailwind.config.ts` (theme.extend.zIndex)     | Token names: `modalBackdrop`, `modal`                            | Reserved z-order for a **future** blocking overlay layer | **n/a** (no component yet)                                                                                                                | N/A                                                                               | When a real `Dialog` is added, map it to these tokens and verify **stacking** vs `z-dropdown` / `z-toast`.                                                                                                                                                                                                                   |
| `PageTransition` + `AdminShell` / `<Outlet />` | Token-backed **opacity** enter (see `index.css`); not an overlay | **Single** shared route transition; **not** a modal      | **n/a**                                                                                                                                   | `**AdminShell`** passes `location.key` so outlet content re-mounts on navigation. | `prefers-reduced-motion: reduce` disables enter animation. No focus trap.                                                                                                                                                                                                                                                    |
| `src/components/ui/ErrorBoundary.tsx`          | Error UI in-tree                                                 | Renders **inline** error replacement, not a modal        | **n/a**                                                                                                                                   | N/A                                                                               | If future designs use a **modal** for errors, re-audit a11y and focus return.                                                                                                                                                                                                                                                |


### “Primary modal” (baseline definition for later work)

For MercFlow, a **primary modal** is a **blocking, focus-trapping overlay** used as the **main** place to create or edit a **primary entity** (e.g. product, category, order) where the product standard expects a **dedicated routable page** instead. **Absence of such modals in this repo is expected** for Batch 1 and matches the “page-first” direction in `admin-ui.mdc`.

**Empty baseline — checklist when the fork or new features land**

- Grep the expanded admin source for `@radix-ui/react-dialog`, `AlertDialog`, `Sheet`, `Drawer`, and internal `Modal` wrappers.
- For each **product/category/order/customer** create-or-edit entry point, mark: **page route** vs **modal**; if modal, file **Task 5.3-style** conversion candidates (URL, deep link, data prefetch).
- Confirm **destructive** flows use **AlertDialog** (or equivalent) and not only styled menu items.
- Reconcile **z-index** tokens (`modal`, `modalBackdrop`, `dropdown`, `toast`) with actual portals.

## Assumptions for forked Medusa admin

When the full Medusa admin fork is merged (or a larger subtree appears under `packages/admin-ui`):

1. **Re-run this audit** on the new surface area. Upstream Medusa often uses **dialogs** for resource editing and pickers; **file paths in upstream are not assumed here.**
2. **Expect** patterns such as: product/variant modals, image/media pickers, confirmation dialogs, and possibly mobile-oriented sheets. Treat each as a **separate** row in the inventory table.
3. **Do not** treat “Medusa did it in a modal” as override for MercFlow **navigation rules**—classify each flow against: primary entity & complexity → **page**; confirm / short form → **modal**; contextual → **menu or small modal** as in `admin-ui.mdc`.
4. **Integrate** with **routing**: every conversion candidate should list **target path**, **params**, and **data** needed before navigation (e.g. product id, locale).

## Relationship to `PageTransition`

`AdminShell` wraps the React Router `<Outlet />` with `PageTransition` (keyed by `location.key`), so all routes share one enter transition. **Page components** do not wrap themselves. It is not a modal. Motion uses `--motion-duration-page` and `--motion-easing-page` from `design-tokens` plus `prefers-reduced-motion` in `index.css`.

## 5.3 follow-up (Batch 1 shell)

- **Modal removal:** **N/A** for this tree’s empty baseline — there were no primary-entity `Dialog` / `AlertDialog` create flows to delete.
- **Page-first “new” flows:** **`/products/new`** uses **`ProductCreatePage`** (unified catalogue create: details, variant matrix, DKK pricing + stock via Medusa Admin API). **`/product-categories/new`** (`ProductCategoryNewPage`) remains a mock create flow, with toolbar and sidebar entry points, token-backed `Card` form shells, and no Radix dialog on the primary path.
- **When the Medusa admin fork appears:** re-run this audit; map any upstream **new/edit product or category** modals to these URLs (or dedicated edit routes) and keep confirmations/destructive flows as `AlertDialog` or equivalent when they stay short and non-primary.

## References

- `.cursor/rules/admin-ui.mdc` — when to use pages vs modals, list structure, `PageTransition`.
- `LAYOUT-AUDIT.md` — shell vs content split (complementary; not repeated here).

