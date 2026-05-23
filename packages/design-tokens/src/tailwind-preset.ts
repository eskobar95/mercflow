/**
 * Tailwind CSS v3 preset for MercFlow.
 *
 * Maps semantic utility classes to CSS custom properties from mercflow-tokens.css.
 * Downstream packages include this preset in their tailwind.config.ts.
 *
 * Usage:
 *   import { tailwindPreset } from "@mercflow/design-tokens"
 *   export default { presets: [tailwindPreset], ... }
 */

type TailwindColorMap = Record<string, string | Record<string, string>>

const colors: Record<string, TailwindColorMap> = {
  surface: {
    canvas:        "var(--mf-color-surface-canvas)",
    DEFAULT:       "var(--mf-color-surface-default)",
    default:       "var(--mf-color-surface-default)",
    subtle:        "var(--mf-color-surface-subtle)",
    raised:        "var(--mf-color-surface-raised)",
    overlay:       "var(--mf-color-surface-overlay)",
    appCanvas:     "var(--mf-color-surface-appCanvas)",
    appCard:       "var(--mf-color-surface-appCard)",
    sidebar:       "var(--mf-color-surface-sidebar)",
    sidebarHover:  "var(--mf-color-surface-sidebarHover)",
    sidebarActive: "var(--mf-color-surface-sidebarActive)",
  },
  content: {
    DEFAULT:         "var(--mf-color-content-primary)",
    primary:         "var(--mf-color-content-primary)",
    secondary:       "var(--mf-color-content-secondary)",
    tertiary:        "var(--mf-color-content-tertiary)",
    disabled:        "var(--mf-color-content-disabled)",
    inverse:         "var(--mf-color-content-inverse)",
    onSidebar:       "var(--mf-color-content-onSidebar)",
    onSidebarMuted:  "var(--mf-color-content-onSidebarMuted)",
    onSidebarActive: "var(--mf-color-content-onSidebarActive)",
  },
  border: {
    DEFAULT:   "var(--mf-color-border-default)",
    subtle:    "var(--mf-color-border-subtle)",
    default:   "var(--mf-color-border-default)",
    strong:    "var(--mf-color-border-strong)",
    focus:     "var(--mf-color-border-focus)",
    app:       "var(--mf-color-border-app)",
    onSidebar: "var(--mf-color-border-onSidebar)",
  },
  brand: {
    base:  "var(--mf-color-brand-base)",
    amber: "var(--mf-color-brand-amber)",
    cream: "var(--mf-color-brand-cream)",
  },
  amber: {
    DEFAULT: "var(--mf-color-amber-default)",
    subtle:  "var(--mf-color-amber-subtle)",
    soft:    "var(--mf-color-amber-soft)",
    default: "var(--mf-color-amber-default)",
    strong:  "var(--mf-color-amber-strong)",
    text:    "var(--mf-color-amber-text)",
  },
  interactive: {
    DEFAULT: "var(--mf-color-interactive-primary)",
    primary: {
      DEFAULT: "var(--mf-color-interactive-primary)",
      hover:   "var(--mf-color-interactive-primary-hover)",
      pressed: "var(--mf-color-interactive-primary-pressed)",
    } as unknown as string,
    soft: {
      DEFAULT: "var(--mf-color-interactive-soft)",
      hover:   "var(--mf-color-interactive-soft-hover)",
      border:  "var(--mf-color-interactive-soft-border)",
      label:   "var(--mf-color-interactive-soft-label)",
    } as unknown as string,
    secondary: {
      DEFAULT: "var(--mf-color-interactive-secondary)",
      hover:   "var(--mf-color-interactive-secondary-hover)",
    } as unknown as string,
    destructive: {
      DEFAULT: "var(--mf-color-interactive-destructive)",
      hover:   "var(--mf-color-interactive-destructive-hover)",
      border:  "var(--mf-color-interactive-destructive-border)",
      label:   "var(--mf-color-interactive-destructive-label)",
    } as unknown as string,
  },
  feedback: {
    success: {
      DEFAULT: "var(--mf-color-feedback-success)",
      subtle:  "var(--mf-color-feedback-success-subtle)",
      content: "var(--mf-color-feedback-success-content)",
      border:  "var(--mf-color-feedback-success-border)",
    } as unknown as string,
    warning: {
      DEFAULT: "var(--mf-color-feedback-warning)",
      subtle:  "var(--mf-color-feedback-warning-subtle)",
      content: "var(--mf-color-feedback-warning-content)",
      border:  "var(--mf-color-feedback-warning-border)",
    } as unknown as string,
    danger: {
      DEFAULT: "var(--mf-color-feedback-danger)",
      subtle:  "var(--mf-color-feedback-danger-subtle)",
      content: "var(--mf-color-feedback-danger-content)",
      border:  "var(--mf-color-feedback-danger-border)",
    } as unknown as string,
    info: {
      DEFAULT: "var(--mf-color-feedback-info)",
      subtle:  "var(--mf-color-feedback-info-subtle)",
      content: "var(--mf-color-feedback-info-content)",
      border:  "var(--mf-color-feedback-info-border)",
    } as unknown as string,
  },
}

const spacing: Record<string, string> = {
  "0": "var(--mf-spacing-0)",
  px: "var(--mf-spacing-px)",
  "0.5": "var(--mf-spacing-0-5)",
  "1": "var(--mf-spacing-1)",
  "1.5": "var(--mf-spacing-1-5)",
  "2": "var(--mf-spacing-2)",
  "2.5": "var(--mf-spacing-2-5)",
  "3": "var(--mf-spacing-3)",
  "3.5": "var(--mf-spacing-3-5)",
  "4": "var(--mf-spacing-4)",
  "5": "var(--mf-spacing-5)",
  "6": "var(--mf-spacing-6)",
  "7": "var(--mf-spacing-7)",
  "8": "var(--mf-spacing-8)",
  "9": "var(--mf-spacing-9)",
  "10": "var(--mf-spacing-10)",
  "11": "var(--mf-spacing-11)",
  "12": "var(--mf-spacing-12)",
  "14": "var(--mf-spacing-14)",
  "16": "var(--mf-spacing-16)",
  "20": "var(--mf-spacing-20)",
  "24": "var(--mf-spacing-24)",
  "32": "var(--mf-spacing-32)",
}

const fontFamily: Record<string, string> = {
  sans: "var(--mf-font-family-sans)",
  mono: "var(--mf-font-family-mono)",
}

const fontSize: Record<string, string> = {
  "2xs": "var(--mf-font-size-2xs)",
  xs:    "var(--mf-font-size-xs)",
  sm:    "var(--mf-font-size-sm)",
  base:  "var(--mf-font-size-base)",
  md:    "var(--mf-font-size-md)",
  lg:    "var(--mf-font-size-lg)",
  xl:    "var(--mf-font-size-xl)",
  "2xl": "var(--mf-font-size-2xl)",
  "3xl": "var(--mf-font-size-3xl)",
}

const fontWeight: Record<string, string> = {
  regular:  "var(--mf-font-weight-regular)",
  medium:   "var(--mf-font-weight-medium)",
  semibold: "var(--mf-font-weight-semibold)",
  bold:     "var(--mf-font-weight-bold)",
}

const lineHeight: Record<string, string> = {
  tight:   "var(--mf-line-height-tight)",
  snug:    "var(--mf-line-height-snug)",
  normal:  "var(--mf-line-height-normal)",
  relaxed: "var(--mf-line-height-relaxed)",
}

const letterSpacing: Record<string, string> = {
  tight:  "var(--mf-letter-spacing-tight)",
  normal: "var(--mf-letter-spacing-normal)",
  label:  "var(--mf-letter-spacing-label)",
  wide:   "var(--mf-letter-spacing-wide)",
}

const borderRadius: Record<string, string> = {
  none:    "var(--mf-radius-none)",
  sm:      "var(--mf-radius-sm)",
  DEFAULT: "var(--mf-radius-base)",
  base:    "var(--mf-radius-base)",
  md:      "var(--mf-radius-md)",
  lg:      "var(--mf-radius-lg)",
  xl:      "var(--mf-radius-xl)",
  pill:    "var(--mf-radius-pill)",
  full:    "var(--mf-radius-pill)",
}

const boxShadow: Record<string, string> = {
  sm:      "var(--mf-shadow-sm)",
  DEFAULT: "var(--mf-shadow-md)",
  md:      "var(--mf-shadow-md)",
  lg:      "var(--mf-shadow-lg)",
  focus:   "var(--mf-shadow-focus)",
}

const zIndex: Record<string, string> = {
  base:            "var(--mf-z-base)",
  dropdown:        "var(--mf-z-dropdown)",
  sticky:          "var(--mf-z-sticky)",
  "modal-backdrop":"var(--mf-z-modalBackdrop)",
  modal:           "var(--mf-z-modal)",
  popover:         "var(--mf-z-popover)",
  toast:           "var(--mf-z-toast)",
}

export const tailwindPreset = {
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      borderRadius,
      boxShadow,
      zIndex,
    },
  },
} as const
