/**
 * Batch 1 design token source values — MercFlow Brand Kit v1.
 *
 * Brand foundation (locked from Logo v4 / Brand Kit):
 *   base:  #1A1A2E  — dark navy, primary text and button fill
 *   amber: #D4873A  — brand accent, logo, soft affordance buttons
 *   cream: #F5EDE3  — warm canvas background
 *
 * Design decisions:
 *   - Font: Plus Jakarta Sans (UI) + JetBrains Mono (code/IDs)
 *   - Borders: opacity-based rgba(26,26,46,…) — adapts to any surface
 *   - Shadows: warm navy rgba(26,26,46,…) — never pure black
 *   - Semantic colors: all warm-toned — olive success, amber warning,
 *     terracotta danger, dusty-indigo info — never cold defaults
 *   - Primary button: dark navy (authority); amber = soft affordance only
 *   - Radius: base 8px (buttons/inputs), lg 12px (cards), pill (badges)
 *
 * Color system layers:
 *   surface / content / border / brand / amber  — base structural tokens
 *   interactive.*                               — action/button tokens
 *   feedback.*                                  — semantic status tokens
 *
 * All sRGB color literals for the admin UI must originate here only.
 */
export const colorTree = {
  surface: {
    /** Warm cream canvas — brand surfaces, accent panels, brand-led moments */
    canvas: "#F5EDE3",
    /** Cards, inputs, form fields — near-white warm */
    default: "#FDFAF7",
    /** Soft panels, hover fills, table stripe, disabled bg */
    subtle: "#EBE0D0",
    /** Modals, popovers, command palette — pure white for focus */
    raised: "#FFFFFF",
    /** Modal scrim overlay — dark navy tint */
    overlay: "rgba(26, 26, 46, 0.45)",
    /**
     * Operational app canvas — cool warm-tinted gray.
     * Default background for admin pages so cream/amber stay accents.
     */
    appCanvas: "#F6F5F2",
    /** Operational card surface — pure white, paired with shadow.sm */
    appCard: "#FFFFFF",
    /** Sidebar chrome — brand navy (matches brand.base) */
    sidebar: "#1A1A2E",
    /** Sidebar nav hover row — 8% cream wash on navy */
    sidebarHover: "rgba(245, 237, 227, 0.06)",
    /** Sidebar active item — amber 16% wash on navy */
    sidebarActive: "rgba(212, 135, 58, 0.16)",
  },
  content: {
    /** Dark navy — brand.base · contrast ≫ 12:1 on all surfaces */
    primary: "#1A1A2E",
    /** Secondary labels, descriptions · 65% opacity navy */
    secondary: "rgba(26, 26, 46, 0.65)",
    /** Tertiary captions, placeholders, metadata · 45% opacity navy */
    tertiary: "rgba(26, 26, 46, 0.45)",
    /** Non-interactive de-emphasis · 28% opacity navy */
    disabled: "rgba(26, 26, 46, 0.28)",
    /** Text on dark fills (primary buttons, dark navy surfaces) */
    inverse: "#F5EDE3",
    /** Sidebar nav label — cream off-white at 88% on navy */
    onSidebar: "rgba(245, 237, 227, 0.88)",
    /** Sidebar muted label, section header — cream 55% on navy */
    onSidebarMuted: "rgba(245, 237, 227, 0.55)",
    /** Sidebar active item label — amber light */
    onSidebarActive: "#E8B574",
  },
  border: {
    /** Hairlines, dividers, table rows · 8% opacity navy */
    subtle: "rgba(26, 26, 46, 0.08)",
    /** Standard input/card borders · 15% opacity navy */
    default: "rgba(26, 26, 46, 0.15)",
    /** Strong separators, active input border · 40% opacity navy */
    strong: "rgba(26, 26, 46, 0.40)",
    /** Focus ring — amber tint · pairs with shadow.focus */
    focus: "rgba(212, 135, 58, 0.60)",
    /** App-canvas border (topbar/card outlines) — cooler than amber-tinted */
    app: "rgba(26, 26, 46, 0.10)",
    /** Sidebar internal divider — cream 10% on navy */
    onSidebar: "rgba(245, 237, 227, 0.10)",
  },
  /**
   * Core brand identity colors.
   * Use these when building logo lockups, cover pages, and branded surfaces.
   * Do not use brand.base directly in button styles — use interactive.primary.
   */
  brand: {
    base:  "#1A1A2E",
    amber: "#D4873A",
    cream: "#F5EDE3",
  },
  /**
   * Amber scale — the brand accent ramp.
   * Used for: active nav states, soft buttons, checkboxes, toggles,
   * amber badge variant, focus affordance fills.
   * NOT for primary CTAs (use interactive.primary / dark navy for those).
   */
  amber: {
    subtle:  "rgba(212, 135, 58, 0.12)",
    soft:    "rgba(212, 135, 58, 0.22)",
    default: "#D4873A",
    strong:  "#B36A1F",
    /** Legible amber text on cream/light surfaces */
    text:    "#8B4E15",
  },
  interactive: {
    /**
     * Primary CTA button — dark navy fill.
     * Hover: lighten to #2D2D4A. Pressed: darken to #10101F.
     * Label: content.inverse (#F5EDE3) — contrast 12:1 ✓ WCAG AAA.
     */
    primary: {
      default: "#1A1A2E",
      hover:   "#2D2D4A",
      pressed: "#10101F",
    },
    /**
     * Soft amber button — amber affordance (Connect, Enable, Add module).
     * Label: amber.text (#8B4E15) on amber.subtle fill.
     */
    soft: {
      default: "rgba(212, 135, 58, 0.12)",
      hover:   "rgba(212, 135, 58, 0.22)",
      border:  "rgba(212, 135, 58, 0.34)",
      label:   "#8B4E15",
    },
    /** Secondary button — transparent with default border, hover uses surface.subtle */
    secondary: {
      default: "transparent",
      hover:   "#EBE0D0",
    },
    /**
     * Destructive action button — terracotta fill/tint.
     * Matches feedback.danger for consistency.
     */
    destructive: {
      default: "rgba(192, 67, 32, 0.13)",
      hover:   "rgba(192, 67, 32, 0.20)",
      border:  "rgba(192, 67, 32, 0.34)",
      label:   "#7A2A14",
    },
    focus: {
      ring: "rgba(212, 135, 58, 0.40)",
    },
    disabled: {
      background: "#EBE0D0",
      text:       "rgba(26, 26, 46, 0.28)",
      border:     "rgba(26, 26, 46, 0.08)",
    },
  },
  /**
   * Semantic feedback colors — alert banners, toasts, status tags, validation.
   * All warm-toned: olive success, amber warning, terracotta danger, dusty indigo info.
   *
   * Each state:
   *   default  — icon tint, strong border, filled badge bg
   *   subtle   — banner/toast background
   *   content  — text on subtle bg (all ≥ 7:1 contrast ✓ WCAG AA)
   *   border   — banner border / tag outline
   */
  feedback: {
    success: {
      /** Warm olive — order confirmed, product saved, payment received */
      default: "#7F9043",
      subtle:  "rgba(127, 144, 67, 0.16)",
      content: "#4A6B22",
      border:  "rgba(127, 144, 67, 0.32)",
    },
    warning: {
      /** Warm amber-yellow — low stock, pending review, expiring promo */
      default: "#C29023",
      subtle:  "rgba(194, 144, 35, 0.16)",
      content: "#6B4A12",
      border:  "rgba(194, 144, 35, 0.32)",
    },
    danger: {
      /** Terracotta — payment failed, validation error, destructive result */
      default: "#C04320",
      subtle:  "rgba(192, 67, 32, 0.13)",
      content: "#7A2A14",
      border:  "rgba(192, 67, 32, 0.34)",
    },
    info: {
      /** Warm dusty indigo — new order notification, system tip */
      default: "#606B94",
      subtle:  "rgba(96, 107, 148, 0.14)",
      content: "#3A4366",
      border:  "rgba(96, 107, 148, 0.32)",
    },
  },
} as const

/**
 * Spacing scale aligned with Tailwind's default (rem → browser root).
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
 * Typography:
 *   sans — Plus Jakarta Sans (UI text, headings, labels, body)
 *   mono — JetBrains Mono (order IDs, API keys, hex values, code)
 *
 * Weight guide (Plus Jakarta Sans):
 *   400 — body text, table cells
 *   500 — product names, nav labels, secondary headings
 *   600 — buttons (font-size 14, letter-spacing -0.005em), form labels, section headers
 *   700 — page titles, KPI numbers
 */
export const fontFamily = {
  sans: [
    "Plus Jakarta Sans",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "sans-serif",
  ].join(", "),
  mono: [
    "JetBrains Mono",
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
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
  regular:  "400",
  medium:   "500",
  semibold: "600",
  bold:     "700",
} as const

export const lineHeight = {
  tight:   "1.2",
  snug:    "1.3",
  normal:  "1.5",
  relaxed: "1.625",
} as const

export const letterSpacing = {
  tight:  "-0.01em",
  normal: "0",
  label:  "0.06em",
  wide:   "0.08em",
} as const

/**
 * Border-radius scale.
 *
 * Usage guide:
 *   sm   (6px)   — tags, badges, chips, checkboxes
 *   base (8px)   — inputs, buttons, small cards  ← default
 *   md   (10px)  — medium cards, dropdowns
 *   lg   (12px)  — panels, section cards, data tables
 *   xl   (16px)  — modals, dialogs, large containers
 *   pill (999px) — pill badges, avatars, toggles
 */
export const radii = {
  none: "0",
  sm:   "0.375rem",
  base: "0.5rem",
  md:   "0.625rem",
  lg:   "0.75rem",
  xl:   "1rem",
  pill: "9999px",
} as const

/**
 * Layered box shadows — warm navy rgba(26,26,46,…), never pure black.
 * Always two layers: ambient (spread) + directional (soft).
 *
 *   sm     — list rows, inputs, base cards
 *   md     — dropdowns, popovers, floating panels
 *   lg     — modals, command palette, sheets
 *   focus  — amber focus ring (3px outer glow)
 */
export const shadows = {
  sm:    "0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)",
  md:    "0 4px 12px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.05)",
  lg:    "0 12px 32px rgba(26, 26, 46, 0.10), 0 4px 8px rgba(26, 26, 46, 0.06)",
  focus: "0 0 0 3px rgba(212, 135, 58, 0.40)",
} as const

export const zIndex = {
  base:         "0",
  dropdown:     "1000",
  sticky:       "1020",
  modalBackdrop:"1040",
  modal:        "1050",
  popover:      "1060",
  toast:        "1080",
} as const

/**
 * Motion tokens — route-level transitions and micro-interactions.
 * All components must respect prefers-reduced-motion.
 */
export const motion = {
  duration: {
    instant: "80ms",
    fast:    "150ms",
    page:    "200ms",
    slow:    "300ms",
  },
  easing: {
    /** Standard deceleration for entering elements */
    enter: "cubic-bezier(0.2, 0, 0, 1)",
    /** Standard acceleration for exiting elements */
    exit:  "cubic-bezier(0.4, 0, 1, 1)",
    /** Spring-like — for interactive state changes */
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const
