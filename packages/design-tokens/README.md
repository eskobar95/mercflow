# `@mercflow/design-tokens`

## Responsibility

This package is the **single source of truth** for MercFlow admin UI visual values: color (surfaces, content, borders, interactive states), spacing, typography, radii, elevation shadows, and z-index. Batch 1 targets a **light, spacious, Shopify Admin–inspired** layout. Other packages (for example `packages/admin-ui`) must consume these tokens and must not hardcode ad hoc colors, spacing, or radii.

## What does not belong here

- Application or domain logic, React components, or Medusa module code
- **Dark mode** tokens (out of scope for Batch 1; extend here when the product adds dark theme)
- Storefront or public-site styling
- Medusa core patches or files under `node_modules`

## Consuming the package

From another workspace package (after the admin app is wired in Task 2.2+):

- **Static CSS (recommended for global `index.html` or a root layout import):**  
  `import "@mercflow/design-tokens/mercflow-tokens.css";`  
  This applies Design Tokens as `:root` **CSS custom properties** (for example `var(--color-surface-canvas)`).

- **TypeScript / build-time (Tailwind theme extension, headless color maps):**  
  `import { tokens, buildRootStylesheet } from "@mercflow/design-tokens";`  
  - `tokens` is a read-only nested map of Batch 1 values.  
  - `buildRootStylesheet()` returns the same `:root` block as the built CSS file (for tooling that injects CSS without a file import).

### Naming alignment with the admin UI

Class names in the admin are expected to map from these variables (see `.cursor/rules/admin-ui.mdc` for the full prefix table), for example:

| Category    | CSS variable example              | Example Tailwind-style class (once wired) |
| ----------- | --------------------------------- | ----------------------------------------- |
| Surfaces    | `--color-surface-canvas`          | `bg-surface-canvas`                       |
| Text        | `--color-content-primary`         | `text-content-primary`                    |
| Borders     | `--color-border-default`          | `border-border-default`                    |
| Interactive | `--color-interactive-primary`     | (semantic utilities / components)         |
| Spacing     | `--spacing-4`                     | `p-4`, `gap-4` (Tailwind scale)            |
| Radius      | `--radius-md`                    | `rounded-md`                              |

## Development

**Prerequisites:** Node.js 20+ and pnpm 9+ (see root `package.json` for `packageManager`).

From the monorepo root:

```sh
pnpm install
pnpm --filter @mercflow/design-tokens build
pnpm --filter @mercflow/design-tokens typecheck
```

From this package directory:

```sh
pnpm build
pnpm typecheck
```

`build` compiles TypeScript to `dist/` and writes `dist/mercflow-tokens.css`.

## Conventions

- All **color literals** for the admin must live in `src/definitions/batch1.ts` (or future definition files in this package). Do not spread hex values across the repo.
- **TypeScript** is strict. Do not use `any`. Unknown inputs should be typed as `unknown` and narrowed.
- **Adding a token** means updating the definition file, the generated `:root` output (via `buildRootStylesheet`), and this README if the public contract or field list changes in a user-visible way.

## Field and token set (Batch 1)

- **Color:** `surface` (canvas, default, subtle, muted, raised, overlay), `content` (primary → danger), `border` (default, subtle, strong, focus), `interactive` (primary / danger with default, hover, pressed, subtle; focus ring; disabled background/text/border).
- **Spacing:** numeric Tailwind-style scale in `rem` (see `spacingScale` in `src/definitions/batch1.ts`).
- **Typography:** `fontFamily` (sans, mono), `fontSize` (2xs–3xl), `fontWeight` (regular–semibold), `lineHeight`, `letterSpacing`.
- **Radius:** `none` through `2xl` and `full`.
- **Shadow:** `sm`, `md`, `lg`, `focus`.
- **Z-index:** `base`, `dropdown`, `sticky`, `modalBackdrop`, `modal`, `popover`, `toast`.

## Migration workflow

This package does not define database migrations. If metadata about tokens were ever stored in PostgreSQL, migrations would live in the relevant Medusa module; this file stays accurate when token sets change.

## API surface

- **Exports (main entry):** `tokens`, `buildRootStylesheet`, `colorTree`, `spacingScale`, and other definition groups; types include `MercflowTokenMap`.
- **Exports (CSS file):** `mercflow-tokens.css` (relative to the package root, emitted under `dist/` at build time).
