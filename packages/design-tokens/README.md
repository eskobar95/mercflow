# @mercflow/design-tokens

Shared design tokens for MercFlow — the single source of truth for all visual values across every package.

Tokens are authored in TypeScript (`src/definitions/batch1.ts`) and emitted as:
- **CSS custom properties** (`dist/mercflow-tokens.css`) for use in stylesheets
- **JavaScript/TypeScript exports** (`dist/index.js` / `dist/index.d.ts`) for programmatic access and the Tailwind preset

---

## Responsibility

This package owns **all** color, spacing, typography, radius, shadow, motion, and z-index values. Nothing in `admin-ui` or any other package is allowed to define raw hex values, `rem` sizes, or Tailwind arbitrary values — every visual constant must trace back to a token here.

---

## Getting started

```ts
// TypeScript — typed token map
import { tokens } from "@mercflow/design-tokens"

tokens.color.surface.default        // "#ffffff"
tokens.spacing["4"]                 // "1rem"
tokens.fontFamily.sans              // "Inter, system-ui, ..."

// Tailwind preset — in tailwind.config.ts
import { tailwindPreset } from "@mercflow/design-tokens"

export default {
  presets: [tailwindPreset],
  content: ["./src/**/*.{ts,tsx}"],
}

// CSS — import the stylesheet in your entry file
import "@mercflow/design-tokens/mercflow-tokens.css"
```

---

## CSS variable naming convention

All custom properties follow the pattern:

```
--mf-{category}-{variant}
```

Examples:
- `--mf-color-surface-default`
- `--mf-color-content-primary`
- `--mf-spacing-4`
- `--mf-font-size-base`
- `--mf-radius-md`
- `--mf-shadow-sm`
- `--mf-z-modal`
- `--mf-motion-duration-page`

---

## Token categories

### Color — `--mf-color-*`

#### Surface
Background and panel colors. Use these for page backgrounds, cards, and elevated layers.

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-color-surface-canvas` | `#f6f6f7` | `bg-surface-canvas` |
| `--mf-color-surface-default` | `#ffffff` | `bg-surface` |
| `--mf-color-surface-subtle` | `#f9f9f9` | `bg-surface-subtle` |
| `--mf-color-surface-muted` | `#f1f1f1` | `bg-surface-muted` |
| `--mf-color-surface-raised` | `#ffffff` | `bg-surface-raised` |
| `--mf-color-surface-overlay` | `rgba(16, 24, 32, 0.35)` | `bg-surface-overlay` |

#### Content
Text and icon colors.

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-color-content-primary` | `#202223` | `text-content-primary` |
| `--mf-color-content-secondary` | `#6d7175` | `text-content-secondary` |
| `--mf-color-content-tertiary` | `#8c9196` | `text-content-tertiary` |
| `--mf-color-content-placeholder` | `#8c9196` | `text-content-placeholder` |
| `--mf-color-content-inverse` | `#ffffff` | `text-content-inverse` |
| `--mf-color-content-disabled` | `#8c9196` | `text-content-disabled` |
| `--mf-color-content-danger` | `#c52828` | `text-content-danger` |

#### Border

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-color-border-default` | `#e1e3e5` | `border-border` |
| `--mf-color-border-subtle` | `#ebebeb` | `border-border-subtle` |
| `--mf-color-border-strong` | `#8c9196` | `border-border-strong` |
| `--mf-color-border-focus` | `#2c6ecb` | `border-border-focus` |

#### Interactive
Button and link colors. Includes hover and pressed states.

| CSS variable | Value | Notes |
|---|---|---|
| `--mf-color-interactive-primary` | `#2c6ecb` | Default fill for primary buttons |
| `--mf-color-interactive-primary-hover` | `#1a5cb0` | Hover state |
| `--mf-color-interactive-primary-pressed` | `#134c92` | Active/pressed state |
| `--mf-color-interactive-primary-subtle` | `#e6f0ff` | Ghost button background |
| `--mf-color-interactive-danger` | `#c52828` | Destructive actions |
| `--mf-color-interactive-danger-hover` | `#9e1f1f` | Danger hover |
| `--mf-color-interactive-danger-subtle` | `#fceded` | Danger banner background |
| `--mf-color-interactive-focus-ring` | `#2c6ecb` | Focus ring color |
| `--mf-color-interactive-disabled-background` | `#f1f1f1` | Disabled input background |
| `--mf-color-interactive-disabled-text` | `#8c9196` | Disabled text |
| `--mf-color-interactive-disabled-border` | `#e1e3e5` | Disabled border |

---

### Spacing — `--mf-spacing-*`

4px base grid. Keys mirror Tailwind's default numeric spacing.

| Key | CSS variable | Value |
|---|---|---|
| `px` | `--mf-spacing-px` | `1px` |
| `1` | `--mf-spacing-1` | `0.25rem` (4px) |
| `2` | `--mf-spacing-2` | `0.5rem` (8px) |
| `4` | `--mf-spacing-4` | `1rem` (16px) |
| `8` | `--mf-spacing-8` | `2rem` (32px) |
| `12` | `--mf-spacing-12` | `3rem` (48px) |
| `16` | `--mf-spacing-16` | `4rem` (64px) |

Full scale: `0`, `px`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `14`, `16`, `20`, `24`, `32`

---

### Typography

#### Font family — `--mf-font-family-*`

| CSS variable | Value |
|---|---|
| `--mf-font-family-sans` | `Inter, system-ui, -apple-system, ...` |
| `--mf-font-family-mono` | `ui-monospace, SFMono-Regular, Menlo, ...` |

#### Font size — `--mf-font-size-*`

| CSS variable | Value |
|---|---|
| `--mf-font-size-2xs` | `0.6875rem` |
| `--mf-font-size-xs` | `0.75rem` |
| `--mf-font-size-sm` | `0.8125rem` |
| `--mf-font-size-base` | `0.875rem` |
| `--mf-font-size-md` | `1rem` |
| `--mf-font-size-lg` | `1.125rem` |
| `--mf-font-size-xl` | `1.25rem` |
| `--mf-font-size-2xl` | `1.5rem` |
| `--mf-font-size-3xl` | `1.75rem` |

#### Font weight — `--mf-font-weight-*`

| CSS variable | Value |
|---|---|
| `--mf-font-weight-regular` | `400` |
| `--mf-font-weight-medium` | `500` |
| `--mf-font-weight-semibold` | `600` |

#### Line height — `--mf-line-height-*`

| CSS variable | Value |
|---|---|
| `--mf-line-height-tight` | `1.25` |
| `--mf-line-height-snug` | `1.375` |
| `--mf-line-height-normal` | `1.5` |
| `--mf-line-height-relaxed` | `1.625` |

#### Letter spacing — `--mf-letter-spacing-*`

| CSS variable | Value |
|---|---|
| `--mf-letter-spacing-tight` | `-0.01em` |
| `--mf-letter-spacing-normal` | `0` |
| `--mf-letter-spacing-wide` | `0.02em` |

---

### Border radius — `--mf-radius-*`

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-radius-none` | `0` | `rounded-none` |
| `--mf-radius-sm` | `0.25rem` | `rounded-sm` |
| `--mf-radius-md` | `0.375rem` | `rounded` / `rounded-md` |
| `--mf-radius-lg` | `0.5rem` | `rounded-lg` |
| `--mf-radius-xl` | `0.75rem` | `rounded-xl` |
| `--mf-radius-2xl` | `1rem` | `rounded-2xl` |
| `--mf-radius-full` | `9999px` | `rounded-full` |

---

### Shadow — `--mf-shadow-*`

| CSS variable | Tailwind utility | Use case |
|---|---|---|
| `--mf-shadow-sm` | `shadow-sm` | Subtle card lift |
| `--mf-shadow-md` | `shadow` | Panels, dropdowns |
| `--mf-shadow-lg` | `shadow-lg` | Modals, sheets |
| `--mf-shadow-focus` | `shadow-focus` | Keyboard focus ring |

---

### Z-index — `--mf-z-*`

| CSS variable | Value | Use case |
|---|---|---|
| `--mf-z-base` | `0` | Document flow |
| `--mf-z-dropdown` | `1000` | Dropdown menus |
| `--mf-z-sticky` | `1020` | Sticky headers |
| `--mf-z-modal-backdrop` | `1040` | Modal overlay scrim |
| `--mf-z-modal` | `1050` | Modal panels |
| `--mf-z-popover` | `1060` | Popovers, tooltips |
| `--mf-z-toast` | `1080` | Toast notifications |

---

### Motion — `--mf-motion-*`

| CSS variable | Value | Use case |
|---|---|---|
| `--mf-motion-duration-page` | `200ms` | Route-level transitions |
| `--mf-motion-easing-page` | `cubic-bezier(0.2, 0, 0, 1)` | Page enter deceleration |

---

## How to run and test

```bash
# From the monorepo root
pnpm --filter @mercflow/design-tokens build     # compile TS + emit CSS
pnpm --filter @mercflow/design-tokens test      # run vitest
pnpm --filter @mercflow/design-tokens typecheck # tsc --noEmit
```

The build script:
1. Compiles TypeScript (`tsc`) → `dist/`
2. Runs `dist/build/writeCssFile.js` → writes `dist/mercflow-tokens.css`

---

## What does NOT belong in this package

- Component-specific variants or overrides (e.g. `--button-height`) — those live in `admin-ui`
- Dark mode token overrides — planned for v1.1
- Figma token sync tooling — planned for v2.0
- Any business logic or runtime state
