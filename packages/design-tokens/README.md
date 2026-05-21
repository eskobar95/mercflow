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

Brand foundation (Brand Kit v1, locked from Logo v4):

| Token | Value | Role |
|---|---|---|
| `--mf-color-brand-base` | `#1A1A2E` | Dark navy — logo, primary button fill |
| `--mf-color-brand-amber` | `#D4873A` | Amber — logo accent, soft buttons |
| `--mf-color-brand-cream` | `#F5EDE3` | Cream — page canvas background |

#### Surface
Four-level hierarchy from warm canvas to elevated modals.

| CSS variable | Value | Use |
|---|---|---|
| `--mf-color-surface-canvas` | `#F5EDE3` | `bg-surface-canvas` — page background |
| `--mf-color-surface-default` | `#FDFAF7` | `bg-surface` — cards, inputs |
| `--mf-color-surface-subtle` | `#EBE0D0` | `bg-surface-subtle` — panels, sidebar, hover fills |
| `--mf-color-surface-raised` | `#FFFFFF` | `bg-surface-raised` — modals, popovers |
| `--mf-color-surface-overlay` | `rgba(26,26,46,0.45)` | `bg-surface-overlay` — modal scrim |

#### Content
All text and icon colors. Secondary/tertiary/disabled use rgba opacity so they adapt automatically.

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-color-content-primary` | `#1A1A2E` | `text-content-primary` |
| `--mf-color-content-secondary` | `rgba(26,26,46,0.65)` | `text-content-secondary` |
| `--mf-color-content-tertiary` | `rgba(26,26,46,0.45)` | `text-content-tertiary` |
| `--mf-color-content-disabled` | `rgba(26,26,46,0.28)` | `text-content-disabled` |
| `--mf-color-content-inverse` | `#F5EDE3` | `text-content-inverse` — on dark fills |

#### Border
Opacity-based — adapts to any surface background automatically.

| CSS variable | Value | Tailwind utility |
|---|---|---|
| `--mf-color-border-subtle` | `rgba(26,26,46,0.08)` | `border-border-subtle` — hairlines, dividers |
| `--mf-color-border-default` | `rgba(26,26,46,0.15)` | `border-border` — standard inputs/cards |
| `--mf-color-border-strong` | `rgba(26,26,46,0.40)` | `border-border-strong` — active input |
| `--mf-color-border-focus` | `rgba(212,135,58,0.60)` | `border-border-focus` — amber focus ring |

#### Amber scale
Brand accent ramp. Used for active nav states, checkboxes, toggles, amber buttons.
**Not** for primary CTAs — use `interactive.primary` (dark navy) for those.

| CSS variable | Value |
|---|---|
| `--mf-color-amber-subtle` | `rgba(212,135,58,0.12)` |
| `--mf-color-amber-soft` | `rgba(212,135,58,0.22)` |
| `--mf-color-amber-default` | `#D4873A` |
| `--mf-color-amber-strong` | `#B36A1F` |
| `--mf-color-amber-text` | `#8B4E15` — legible on cream backgrounds |

#### Interactive
Button color system. Primary uses dark navy (authority); soft uses amber (affordance).

| CSS variable | Value | Notes |
|---|---|---|
| `--mf-color-interactive-primary-default` | `#1A1A2E` | Dark navy — main CTA |
| `--mf-color-interactive-primary-hover` | `#2D2D4A` | Hover |
| `--mf-color-interactive-primary-pressed` | `#10101F` | Active/pressed |
| `--mf-color-interactive-soft-default` | `rgba(212,135,58,0.12)` | Amber soft button |
| `--mf-color-interactive-soft-hover` | `rgba(212,135,58,0.22)` | Soft hover |
| `--mf-color-interactive-soft-label` | `#8B4E15` | Amber text on soft |
| `--mf-color-interactive-secondary-default` | `transparent` | Outlined button |
| `--mf-color-interactive-secondary-hover` | `#EBE0D0` | Outlined hover |
| `--mf-color-interactive-destructive-default` | `rgba(192,67,32,0.13)` | Terracotta, not red |
| `--mf-color-interactive-destructive-label` | `#7A2A14` | Destructive text |
| `--mf-color-interactive-focus-ring` | `rgba(212,135,58,0.40)` | 3px amber glow |
| `--mf-color-interactive-disabled-background` | `#EBE0D0` | surface.subtle |
| `--mf-color-interactive-disabled-text` | `rgba(26,26,46,0.28)` | |
| `--mf-color-interactive-disabled-border` | `rgba(26,26,46,0.08)` | |

#### Feedback
All warm-toned — olive success, amber warning, terracotta danger, dusty indigo info.
Each category has `default` (icon/badge), `subtle` (banner bg), `content` (text, ≥7:1 contrast), `border`.

| Category | default | subtle bg | content text |
|---|---|---|---|
| success | `#7F9043` (warm olive) | `rgba(127,144,67,0.16)` | `#4A6B22` |
| warning | `#C29023` (amber-yellow) | `rgba(194,144,35,0.16)` | `#6B4A12` |
| danger | `#C04320` (terracotta) | `rgba(192,67,32,0.13)` | `#7A2A14` |
| info | `#606B94` (dusty indigo) | `rgba(96,107,148,0.14)` | `#3A4366` |

Example usage:
```css
/* Alert banner */
background: var(--mf-color-feedback-danger-subtle);
border: 1px solid var(--mf-color-feedback-danger-border);
color: var(--mf-color-feedback-danger-content);
```

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
| `--mf-font-family-sans` | `Plus Jakarta Sans, system-ui, -apple-system, ...` |
| `--mf-font-family-mono` | `JetBrains Mono, ui-monospace, SFMono-Regular, ...` |

**Plus Jakarta Sans** — UI text, headings, labels, body copy.
**JetBrains Mono** — order IDs, API keys, hex values, code snippets, timestamps.

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

| CSS variable | Value | Usage |
|---|---|---|
| `--mf-font-weight-regular` | `400` | Body, table cells |
| `--mf-font-weight-medium` | `500` | Nav labels, product names |
| `--mf-font-weight-semibold` | `600` | Buttons, form labels, section headers |
| `--mf-font-weight-bold` | `700` | Page titles, KPI numbers |

#### Line height — `--mf-line-height-*`

| CSS variable | Value |
|---|---|
| `--mf-line-height-tight` | `1.2` |
| `--mf-line-height-snug` | `1.3` |
| `--mf-line-height-normal` | `1.5` |
| `--mf-line-height-relaxed` | `1.625` |

#### Letter spacing — `--mf-letter-spacing-*`

| CSS variable | Value | Usage |
|---|---|---|
| `--mf-letter-spacing-tight` | `-0.01em` | Headings |
| `--mf-letter-spacing-normal` | `0` | Body text |
| `--mf-letter-spacing-label` | `0.06em` | Uppercase labels, form field labels |
| `--mf-letter-spacing-wide` | `0.08em` | Section category headers |

---

### Border radius — `--mf-radius-*`

| CSS variable | Value | Usage |
|---|---|---|
| `--mf-radius-none` | `0` | Sharp corners |
| `--mf-radius-sm` | `0.375rem` (6px) | Tags, badges, chips, checkboxes |
| `--mf-radius-base` | `0.5rem` (8px) | **Default** — inputs, buttons, small cards |
| `--mf-radius-md` | `0.625rem` (10px) | Medium cards, dropdowns |
| `--mf-radius-lg` | `0.75rem` (12px) | Panels, section cards, data tables |
| `--mf-radius-xl` | `1rem` (16px) | Modals, dialogs, large containers |
| `--mf-radius-pill` | `9999px` | Pill badges, avatars, toggles |

---

### Shadow — `--mf-shadow-*`

All shadows use warm navy rgba(26,26,46,…) — never pure black.

| CSS variable | Tailwind utility | Use case |
|---|---|---|
| `--mf-shadow-sm` | `shadow-sm` | List rows, inputs, base cards |
| `--mf-shadow-md` | `shadow` | Dropdowns, popovers, panels |
| `--mf-shadow-lg` | `shadow-lg` | Modals, command palette |
| `--mf-shadow-focus` | `shadow-focus` | 3px amber keyboard focus ring |

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
| `--mf-motion-duration-instant` | `80ms` | Micro-interactions |
| `--mf-motion-duration-fast` | `150ms` | Hover/focus transitions |
| `--mf-motion-duration-page` | `200ms` | Route-level transitions |
| `--mf-motion-duration-slow` | `300ms` | Complex entry animations |
| `--mf-motion-easing-enter` | `cubic-bezier(0.2, 0, 0, 1)` | Deceleration for entering elements |
| `--mf-motion-easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Acceleration for exiting elements |
| `--mf-motion-easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Interactive state changes |

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
