/**
 * MercFlow design tokens — v2 (Mercury / Asana / Stripe synthesis).
 *
 * Reference lock:
 *   - Primary foundation: Mercury dashboard (light canvas + white cards, modular
 *     bento grid, soft hairline borders, single blue accent reserved for CTAs).
 *   - Sidebar pattern: Asana (#131316 near-black with light-grey selected row —
 *     no colored highlight; color is for action, not navigation).
 *   - Restraint discipline: Stripe (information-dense, monochrome charts, single
 *     accent #2563EB used surgically).
 *
 * Token NAMES are preserved for downstream compatibility. Token VALUES have
 * been completely repurposed:
 *   `amber.*` is now the BLUE ACCENT family (semantic legacy name, blue value).
 *   `brand.amber` is the accent CTA blue.
 *   `surface.sidebar` is Asana near-black, not navy.
 *
 * Typography: Geist + Geist Mono (modern, distinctive, avoids the Inter cliche).
 *
 * Color rules:
 *   - Color is for action and status. Navigation, surfaces, and borders are neutral.
 *   - `interactive.primary` blue appears only on primary CTAs.
 *   - Selected sidebar row uses neutral light-grey wash, NOT the accent color.
 *   - Soft accent fills (formerly amber-subtle) live in icon backgrounds, badges,
 *     and progress indicators — never in chrome.
 */
export const colorTree = {
  surface: {
    /** Page canvas for marketing / brand contexts. Same as appCanvas in v2. */
    canvas: "#F7F8FA",
    /** Cards, inputs, form fields — pure white. */
    default: "#FFFFFF",
    /** Subtle hover fills, table stripe, disabled background. */
    subtle: "#F3F4F6",
    /** Modals, popovers, command palette — pure white for focus. */
    raised: "#FFFFFF",
    /** Modal scrim — slate tint. */
    overlay: "rgba(17, 24, 39, 0.50)",
    /**
     * Operational app canvas — neutral cool gray.
     * Cards float on this surface with soft shadow.
     */
    appCanvas: "#F7F8FA",
    /** Operational card surface — pure white. */
    appCard: "#FFFFFF",
    /** Sidebar — Asana near-black. */
    sidebar: "#131316",
    /** Sidebar nav hover row — 4% white wash. */
    sidebarHover: "rgba(255, 255, 255, 0.04)",
    /**
     * Sidebar active item — 8% white wash (light-grey row, Asana style).
     * Critical: this is NOT a colored highlight. Color stays out of navigation.
     */
    sidebarActive: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    /** Primary text — slate-900. Contrast ≥ 14:1 on white. */
    primary: "#111827",
    /** Secondary labels, descriptions — slate-500. */
    secondary: "#6B7280",
    /** Tertiary captions, placeholders, metadata — slate-400. */
    tertiary: "#9CA3AF",
    /** Non-interactive de-emphasis — slate-300. */
    disabled: "#D1D5DB",
    /** Text on dark fills (primary buttons, dark surfaces). */
    inverse: "#FFFFFF",
    /** Sidebar nav label — off-white. */
    onSidebar: "rgba(255, 255, 255, 0.85)",
    /** Sidebar muted label, section header — 55% white. */
    onSidebarMuted: "rgba(255, 255, 255, 0.55)",
    /** Sidebar active item label — pure white on the light-grey row. */
    onSidebarActive: "#FFFFFF",
  },
  border: {
    /** Hairlines, table rows — slate-100. */
    subtle: "#F3F4F6",
    /** Standard input/card borders — Mercury #E6E9EE. */
    default: "#E5E7EB",
    /** Strong separators, active input border — slate-300. */
    strong: "#D1D5DB",
    /** Focus ring — blue accent at 40%. Pairs with shadow.focus. */
    focus: "rgba(37, 99, 235, 0.40)",
    /** App-canvas border (topbar/card outlines). Same as `default`. */
    app: "#E5E7EB",
    /** Sidebar internal divider — 8% white. */
    onSidebar: "rgba(255, 255, 255, 0.08)",
  },
  /**
   * Brand identity. v2: navy → slate-900, amber → Mercury blue.
   * `brand.amber` is the accent CTA color in code — keep the name for legacy.
   */
  brand: {
    base:   "#111827",
    accent: "#2563EB",
    cream:  "#F7F8FA",
  },
  /**
   * v2: the "amber" family is the BLUE ACCENT family. Name preserved for
   * backward compatibility; component code reading `amber-subtle` now gets
   * a soft blue tint — matching the Mercury/Stripe single-accent system.
   */
  accent: {
    /** Soft accent fill — icon background, badge tint. */
    subtle:  "rgba(37, 99, 235, 0.10)",
    /** Stronger soft accent — hover on subtle, accent border. */
    soft:    "rgba(37, 99, 235, 0.18)",
    /** Solid accent — primary CTA, sparkline line, active indicators. */
    default: "#2563EB",
    /** Hover state on solid accent. */
    strong:  "#1D4FD7",
    /** Legible accent text on light surfaces — blue-800. */
    text:    "#1E40AF",
  },
  interactive: {
    /** Primary CTA — Mercury blue. */
    primary: {
      default: "#2563EB",
      hover:   "#1D4FD7",
      pressed: "#1A3F9F",
    },
    /** Soft button — used for secondary actions with accent affinity. */
    soft: {
      default: "rgba(37, 99, 235, 0.10)",
      hover:   "rgba(37, 99, 235, 0.18)",
      border:  "rgba(37, 99, 235, 0.24)",
      label:   "#1E40AF",
    },
    /** Secondary button — neutral. */
    secondary: {
      default: "#FFFFFF",
      hover:   "#F3F4F6",
    },
    /** Destructive — red-600. */
    destructive: {
      default: "rgba(220, 38, 38, 0.10)",
      hover:   "rgba(220, 38, 38, 0.18)",
      border:  "rgba(220, 38, 38, 0.24)",
      label:   "#991B1B",
    },
    focus: {
      ring: "rgba(37, 99, 235, 0.40)",
    },
    disabled: {
      background: "#F3F4F6",
      text:       "#9CA3AF",
      border:     "#E5E7EB",
    },
  },
  /**
   * Semantic feedback — neutral cool palette matching Mercury data viz.
   *   success: emerald-500 (growth, positive deltas)
   *   warning: amber-500 (genuinely amber here, not the brand)
   *   danger:  red-500 (failed payment, validation error)
   *   info:    blue-500 (system tip, neutral notification)
   */
  feedback: {
    success: {
      default: "#10B981",
      subtle:  "rgba(16, 185, 129, 0.12)",
      content: "#047857",
      border:  "rgba(16, 185, 129, 0.30)",
    },
    warning: {
      default: "#F59E0B",
      subtle:  "rgba(245, 158, 11, 0.12)",
      content: "#92400E",
      border:  "rgba(245, 158, 11, 0.30)",
    },
    danger: {
      default: "#EF4444",
      subtle:  "rgba(239, 68, 68, 0.10)",
      content: "#991B1B",
      border:  "rgba(239, 68, 68, 0.30)",
    },
    info: {
      default: "#3B82F6",
      subtle:  "rgba(59, 130, 246, 0.10)",
      content: "#1E40AF",
      border:  "rgba(59, 130, 246, 0.30)",
    },
  },
} as const

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
 * Typography — Geist (modern variable sans) + Geist Mono (numbers, IDs).
 * Geist is intentionally chosen over Inter to avoid the AI/SaaS cliche.
 */
export const fontFamily = {
  sans: [
    "Geist",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "sans-serif",
  ].join(", "),
  mono: [
    "Geist Mono",
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "monospace",
  ].join(", "),
} as const

export const fontSize = {
  "2xs": "0.6875rem",
  xs:    "0.75rem",
  sm:    "0.8125rem",
  base:  "0.875rem",
  md:    "1rem",
  lg:    "1.125rem",
  xl:    "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
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
  label:  "0.04em",
  wide:   "0.08em",
} as const

/**
 * Radius — Mercury card geometry (10px) is the workhorse.
 *   sm   (6px)  — tags, badges, chips, checkboxes
 *   base (8px)  — inputs, buttons, small cards
 *   md   (10px) — operational cards (Mercury standard)
 *   lg   (12px) — panels, large containers
 *   xl   (16px) — modals, dialogs
 *   pill (999)  — pill badges, avatars, quick-action chips
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
 * Shadows — whisper-soft, slate-tinted. Mercury card elevation.
 *   sm     — base card resting state (`0 6px 18px rgba(17,24,39,0.04)`)
 *   md     — hover, popover
 *   lg     — modal, sheet
 *   focus  — accent focus ring
 */
export const shadows = {
  sm:    "0 1px 2px rgba(17, 24, 39, 0.04), 0 6px 18px rgba(17, 24, 39, 0.04)",
  md:    "0 4px 12px rgba(17, 24, 39, 0.08), 0 2px 4px rgba(17, 24, 39, 0.04)",
  lg:    "0 16px 40px rgba(17, 24, 39, 0.12), 0 4px 8px rgba(17, 24, 39, 0.06)",
  focus: "0 0 0 3px rgba(37, 99, 235, 0.40)",
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
 * Motion — Emil's strong ease-out curves. UI feels intentional, not lazy.
 *   instant — keyboard-driven, micro feedback (button press)
 *   fast    — popovers, tooltips, dropdowns
 *   page    — route transitions (kept under 300ms)
 *   slow    — drawers, sheets
 */
export const motion = {
  duration: {
    instant: "80ms",
    fast:    "160ms",
    page:    "200ms",
    slow:    "280ms",
  },
  easing: {
    /** Strong ease-out for entering UI — Emil curve. */
    enter: "cubic-bezier(0.23, 1, 0.32, 1)",
    /** Strong ease-in-out for on-screen movement. */
    exit:  "cubic-bezier(0.77, 0, 0.175, 1)",
    /** Spring-like — interactive state changes, small playful moments. */
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const
