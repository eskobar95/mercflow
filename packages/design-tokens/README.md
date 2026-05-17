# `@mercflow/design-tokens`

## Responsibility

This package is MercFlow's **single source of truth** for shared visual primitives: Shopify Admin–inspired neutrals (`surface`), readable `label` / `brand` hues, layered `interactive` semantics, Tailwind-aligned `spacing`, `typography`, `radius`, elevation `shadow`s, stacking `z-index`, and discreet `motion` timing. Consumers import **CSS variables** (`--mf-*`), the **published Tailwind preset**, or typed **nested maps** for build-time tooling. Do not sprinkle hex literals or orphan spacing scales across packages.

### What does not belong here

- Application logic, UI components, or Medusa-specific modules
- **Dark mode** (tracked for a later sprint)
- Storefront skins or merchant-specific palettes
- Medusa/core patches (`node_modules` edits)

---

## Naming convention

MercFlow emits **CSS custom properties** as `--mf-{category}-{variant-[...]}` segments (all lowercase kebab-case), for example:

- `--mf-color-surface-default`
- `--mf-color-label-primary`
- `--mf-spacing-4`
- `--mf-motion-duration-page`

---

## Canonical files

| Path | Purpose |
| ---- | ------- |
| `src/definitions/batch1.ts` | Literal primitives (colors, spacing map, typography, radii, shadows, z-index, motion). Extend here — never scatter literals elsewhere. |
| `src/lib/buildRootStylesheet.ts` | Generates the `:root` block from typed definitions (`buildRootStylesheet()` mirrors `tokens.css`). |
| `src/tokens.css` | Checked-in stylesheet committed to MercFlow conventions; regenerated whenever `pnpm build` runs successfully. Must stay aligned with generator output (Vitest asserts this). |
| `src/build/writeCssFile.ts` | Build step emitting `dist/mercflow-tokens.css` and refreshing `src/tokens.css`. |
| `src/tailwind-preset.ts` | `mercflowTailwindPreset`, mapping Tailwind utilities to `var(--mf-...)`. |

---

## Consuming the package

### 1. Global CSS (`:root` variables)

```ts
// Vite/React entry stylesheet
import "@mercflow/design-tokens/mercflow-tokens.css"
```

Equivalent custom property values also live under `packages/design-tokens/src/tokens.css` for documentation or reviews.

Usage in CSS:

```css
.card {
  background: var(--mf-color-surface-default);
  border: 1px solid var(--mf-color-border-default);
}
```

Tailwind presets map helpers such as `bg-surface-default` to those same variables.

### 2. Tailwind v3 preset (recommended inside workspace apps)

```ts
import { mercflowTailwindPreset } from "@mercflow/design-tokens/tailwind-preset"
import type { Config } from "tailwindcss"

const config: Config = {
  presets: [mercflowTailwindPreset],
  content: ["./src/**/*.{ts,tsx}"],
}

export default config
```

Highlights exposed by the preset:

- Semantic surfaces (`bg-surface-*`)
- Accessible label colors (`text-label-*`) **plus** backwards-compatible aliases (`text-content-*`)
- Subdued brand ramps (`bg-brand-subtle`, `text-brand-muted`, …)
- Full interactive + border ladders
- Matching spacing/font/radius/shadow/z-index stacks

Examples:

```tsx
<p className="text-label-primary">Primary copy</p>
<p className="text-content-secondary">Legacy alias identical to secondary label tones</p>
<section className="rounded-lg bg-brand-subtle px-6 py-4 shadow-sm" />
```

### 3. TypeScript helpers

```ts
import { tokens, buildRootStylesheet } from "@mercflow/design-tokens"

// Nested map mirrors batch1 literals (codegen-friendly)
console.log(tokens.color.surface.default)

// String output equals `tokens.css` / `dist/mercflow-tokens.css`
const stylesheet = buildRootStylesheet()
```

---

## Category reference (`batch1`)

| Domain | Highlights |
| ------ | ----------- |
| **Color › surface** | `canvas`, `default`, `subtle`, `muted`, `raised`, `overlay` |
| **Color › label** | `primary → danger`, `inverse`, placeholders |
| **Color › brand** | `primary`, `muted`, `subtle` accents (paired with interaction blues for harmony) |
| **Color › border / interactive** | Default borders, elevated danger states, hover/pressed ladders, ghost fills, disabled states |
| **Spacing** | 4px-aligned ladder (`spacingScale`), ordered explicitly to avoid ambiguous numeric key sorting |
| **Typography** | `fontFamily.{sans|mono}`, `fontSize.{2xs…3xl}`, `fontWeight`, `lineHeight`, `letterSpacing` |
| **Radius** | `none`, `sm`, `md`, `lg`, `xl`, `2xl`, `full` |
| **Shadow** | `sm`, `md`, `lg`, `focus` (pairs with `@medusajs/ui` / `@radix-ui` usage) |
| **Z-index** | `base`, `dropdown`, `sticky`, `modalBackdrop`, `modal`, `popover`, `toast` |
| **Motion** | `--mf-motion-duration-page`, `--mf-motion-easing-page` for shared route transitions |

---

## Development scripts

From repository root:

```sh
pnpm install
pnpm --filter @mercflow/design-tokens build
pnpm --filter @mercflow/design-tokens typecheck
pnpm --filter @mercflow/design-tokens test
```

Or inside this directory:

```sh
pnpm build     # emits JS + writes dist/mercflow-tokens.css + src/tokens.css
pnpm typecheck # strict TS (src + Vitest typings)
pnpm test      # snapshot + invariant suite
```

Snapshots intentionally fail when literals shift without reviewer intent — rerun with `-u` only after inspecting diffs closely.

---

## Tests & safeguards

Vitest verifies:

1. Category-level snapshots (≥10 assertions) guarding accidental palette drift.
2. `tokens.css` ↔ `buildRootStylesheet()` parity.
3. Every emitted property name conforms to `--mf-*` prefixes (lint-style guard).

Always run Vitest locally after tweaking `batch1.ts`.

---

## Extending palettes

1. Add literals exclusively to `src/definitions/batch1.ts`.
2. `pnpm build` (refreshes `src/tokens.css` + `dist`).
3. Update `tailwind-preset.ts` if new Tailwind namespaces are introduced.
4. Refresh this README if the externally visible surface changes materially.
5. Update Vitest snapshots deliberately (`pnpm exec vitest run packages/design-tokens -u`).

