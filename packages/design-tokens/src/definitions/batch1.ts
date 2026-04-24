/**
 * Batch 1 design token source values (light, spacious admin — Shopify Admin–inspired).
 * All sRGB color literals for the admin UI must originate here (or in this package only).
 */
export const colorTree = {
  surface: {
    /** Application canvas / page background */
    canvas: "#f6f6f7",
    /** Primary panels, cards, popovers (raised surfaces) */
    default: "#ffffff",
    /** Secondary panels, table stripes */
    subtle: "#f9f9f9",
    /** Disabled inputs, low-emphasis areas */
    muted: "#f1f1f1",
    /** Same as default; use with shadow for elevation if needed */
    raised: "#ffffff",
    /** Scrim for modal overlays (light theme) */
    overlay: "rgba(16, 24, 32, 0.35)",
  },
  content: {
    primary: "#202223",
    secondary: "#6d7175",
    tertiary: "#8c9196",
    placeholder: "#8c9196",
    /** Text on primary / danger fill buttons */
    inverse: "#ffffff",
    /** Non-interactive de-emphasis */
    disabled: "#8c9196",
    /** Links and critical inline messaging */
    danger: "#c52828",
  },
  border: {
    default: "#e1e3e5",
    subtle: "#ebebeb",
    strong: "#8c9196",
    focus: "#2c6ecb",
  },
  interactive: {
    primary: {
      default: "#2c6ecb",
      hover: "#1a5cb0",
      pressed: "#134c92",
      /** Ghost / low-emphasis control backgrounds */
      subtle: "#e6f0ff",
    },
    danger: {
      default: "#c52828",
      hover: "#9e1f1f",
      /** Low-emphasis danger surfaces (e.g. banners) */
      subtle: "#fceded",
    },
    /** Focus affordance; pair with focus outline styles in admin-ui */
    focus: {
      ring: "#2c6ecb",
    },
    disabled: {
      background: "#f1f1f1",
      text: "#8c9196",
      border: "#e1e3e5",
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

export const fontFamily = {
  sans: [
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

export const radii = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const

/**
 * Layered box shadows. Values reference surface/content tokens for consistency.
 */
export const shadows = {
  sm: "0 1px 2px rgba(32, 34, 35, 0.08), 0 0 0 1px rgba(32, 34, 35, 0.04)",
  md: "0 2px 6px rgba(32, 34, 35, 0.1), 0 0 0 1px rgba(32, 34, 35, 0.06)",
  lg: "0 8px 24px rgba(32, 34, 35, 0.12), 0 0 0 1px rgba(32, 34, 35, 0.06)",
  focus: "0 0 0 3px rgba(44, 110, 203, 0.35)",
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
