/**
 * Batch 1 design token source values.
 * Warm palette derived from colorhunt.co/palette/fffdf1ffce99ff9644562f00.
 * Base four: #fffdf1 (cream surface) · #ffce99 (peach accent) · #ff9644 (orange interactive) · #562f00 (brown text)
 *
 * Design decisions:
 * - Primary font: Plus Jakarta Sans (professional admin, warm, approachable) + Inter fallback
 * - Border-radius: moderate rounded (8/12/16px default/lg/xl) — warm without being playful
 * - Danger red: #c53030 (warm red, clearly danger, 5.3:1 on cream)
 * - Orange primary buttons (#ff9644) must use content.primary (#562f00) as label color (5.6:1 contrast).
 *   content.inverse (#fffdf1) is for text on dark fills (danger banners, dark overlay surfaces).
 *
 * All sRGB color literals for the admin UI must originate here (or in this package only).
 */
export const colorTree = {
  surface: {
    /**
     * Application canvas / page background.
     * Noticeably warmer than panels so chrome vs content reads clearly.
     */
    canvas: "#fff5e0",
    /** Primary panels, cards, popovers — palette base #1 */
    default: "#fffdf1",
    /** Secondary panels, table stripes — barely-perceptible warmth */
    subtle: "#fffbf0",
    /** Disabled inputs, low-emphasis areas */
    muted: "#f5ebda",
    /** Same as default; use with shadow for elevation */
    raised: "#fffdf1",
    /** Scrim for modal overlays — warm brown tint */
    overlay: "rgba(86, 47, 0, 0.30)",
  },
  content: {
    /** Deep warm brown — palette base #4 · contrast 13:1 on surface-default */
    primary: "#562f00",
    /** Mid warm brown · contrast 6.2:1 on surface-default ✓ WCAG AA */
    secondary: "#8a5220",
    /** Light warm brown · contrast 4.9:1 on surface-default ✓ WCAG AA */
    tertiary: "#9a6420",
    placeholder: "#9a6420",
    /**
     * Text on dark-filled surfaces (danger banners, dark overlays).
     * Do NOT use on orange (#ff9644) buttons — use content.primary there (5.6:1 contrast).
     */
    inverse: "#fffdf1",
    /** Non-interactive de-emphasis */
    disabled: "#c8a070",
    /** Inline danger text — warm red · contrast 5.3:1 on surface-default ✓ WCAG AA */
    danger: "#c53030",
  },
  border: {
    /** Warm tan — default panel / input border */
    default: "#e8d0a8",
    /** Very light warm — table hairlines, dividers */
    subtle: "#f0e6cc",
    /** Mid warm brown — strong separator */
    strong: "#b07840",
    /** Orange focus ring — palette base #3 */
    focus: "#ff9644",
  },
  interactive: {
    primary: {
      /**
       * Warm orange — palette base #3.
       * Use content.primary (#562f00) as label on fill — contrast 5.6:1 ✓ WCAG AA.
       */
      default: "#ff9644",
      hover: "#e87c2a",
      pressed: "#cc6810",
      /** Ghost / low-emphasis backgrounds — peach tint from palette base #2 */
      subtle: "#fff0e0",
    },
    danger: {
      /** Warm red — clearly destructive · contrast 5.3:1 on surface-default */
      default: "#c53030",
      hover: "#a02424",
      /** Light warm red tint for banners */
      subtle: "#fdeee8",
    },
    /** Focus affordance — pair with focus outline styles in admin-ui */
    focus: {
      ring: "#ff9644",
    },
    disabled: {
      background: "#f5ebda",
      text: "#c8a070",
      border: "#e8d0a8",
    },
  },
} as const

/**
 * Spacing scale aligned with Tailwind’s default (rem → browser root).
 * Keys match Tailwind numeric spacing: 1 = 0.25rem, 2 = 0.5rem, …
 */
export const spacingScale: Record<string, string> = {
  "0": "0",
  "px": "1px",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.75rem",
  "8": "2rem",
  "9": "2.25rem",
  "10": "2.5rem",
  "11": "2.75rem",
  "12": "3rem",
  "14": "3.5rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
  "32": "8rem",
} as const

/**
 * Primary font: Plus Jakarta Sans (professional admin, warm, approachable).
 * Inter as system-level fallback; ensures legibility across weight scales.
 */
export const fontFamily = {
  sans: [
    "Plus Jakarta Sans",
    "Inter",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ].join(", "),
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ].join(", "),
} as const

export const fontSize = {
  "2xs": "0.6875rem",
  xs: "0.75rem",
  sm: "0.8125rem",
  base: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.75rem",
} as const

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
} as const

export const lineHeight = {
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
} as const

export const letterSpacing = {
  tight: "-0.01em",
  normal: "0",
  wide: "0.02em",
} as const

/**
 * Border-radius scale — warm balanced (moderate rounded).
 * Rationale: 8px default feels modern and approachable without being playful.
 * Inspired by Shopify Polaris radius philosophy for admin contexts.
 *
 * Usage guide:
 *   sm  (4px)  — tags, badges, small chips, inline code
 *   md  (8px)  — inputs, buttons, dropdowns, small cards  ← default
 *   lg  (12px) — panels, content cards, data tables
 *   xl  (16px) — modals, dialogs, large card containers
 *   2xl (24px) — hero sections, feature highlights, illustration frames
 *   full       — pills, avatars, toggle switches
 */
export const radii = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const

/**
 * Layered box shadows. Values reference warm brown undertones for consistency with
 * the warm cream palette instead of cold blue-black.
 */
export const shadows = {
  sm: "0 1px 2px rgba(86, 47, 0, 0.08), 0 0 0 1px rgba(86, 47, 0, 0.04)",
  md: "0 2px 6px rgba(86, 47, 0, 0.10), 0 0 0 1px rgba(86, 47, 0, 0.06)",
  lg: "0 8px 24px rgba(86, 47, 0, 0.12), 0 0 0 1px rgba(86, 47, 0, 0.06)",
  focus: "0 0 0 3px rgba(255, 150, 68, 0.40)",
} as const

export const zIndex = {
  base: "0",
  dropdown: "1000",
  sticky: "1020",
  modalBackdrop: "1040",
  modal: "1050",
  popover: "1060",
  toast: "1080",
} as const

/**
 * Motion tokens for route-level transitions and future UI motion (admin shell).
 * Durations are explicit `ms` strings for `animation` / `transition` declarations.
 */
export const motion = {
  duration: {
    /** Default enter timing for main route outlet content */
    page: "200ms",
  },
  easing: {
    /** Standard deceleration for page enter */
    page: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const
