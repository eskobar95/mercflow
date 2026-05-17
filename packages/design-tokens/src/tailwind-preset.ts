import type { Config } from "tailwindcss"

/**
 * Shared Tailwind theme extensions for MercFlow apps.
 * Maps utilities to CSS custom properties emitted in `mercflow-tokens.css`.
 */
const mercflowTailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        surface: {
          canvas: "var(--color-surface-canvas)",
          default: "var(--color-surface-default)",
          subtle: "var(--color-surface-subtle)",
          muted: "var(--color-surface-muted)",
          raised: "var(--color-surface-raised)",
          overlay: "var(--color-surface-overlay)",
        },
        content: {
          primary: "var(--color-content-primary)",
          secondary: "var(--color-content-secondary)",
          tertiary: "var(--color-content-tertiary)",
          placeholder: "var(--color-content-placeholder)",
          inverse: "var(--color-content-inverse)",
          disabled: "var(--color-content-disabled)",
          danger: "var(--color-content-danger)",
        },
        border: {
          default: "var(--color-border-default)",
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
          focus: "var(--color-border-focus)",
        },
        interactive: {
          primary: {
            DEFAULT: "var(--color-interactive-primary)",
            hover: "var(--color-interactive-primary-hover)",
            pressed: "var(--color-interactive-primary-pressed)",
            subtle: "var(--color-interactive-primary-subtle)",
          },
          danger: {
            DEFAULT: "var(--color-interactive-danger)",
            hover: "var(--color-interactive-danger-hover)",
            subtle: "var(--color-interactive-danger-subtle)",
          },
          focus: {
            ring: "var(--color-interactive-focus-ring)",
          },
          disabled: {
            background: "var(--color-interactive-disabled-background)",
            text: "var(--color-interactive-disabled-text)",
            border: "var(--color-interactive-disabled-border)",
          },
        },
      },
      spacing: {
        px: "var(--spacing-px)",
        0: "var(--spacing-0)",
        0.5: "var(--spacing-0-5)",
        1: "var(--spacing-1)",
        1.5: "var(--spacing-1-5)",
        2: "var(--spacing-2)",
        2.5: "var(--spacing-2-5)",
        3: "var(--spacing-3)",
        3.5: "var(--spacing-3-5)",
        4: "var(--spacing-4)",
        5: "var(--spacing-5)",
        6: "var(--spacing-6)",
        7: "var(--spacing-7)",
        8: "var(--spacing-8)",
        9: "var(--spacing-9)",
        10: "var(--spacing-10)",
        11: "var(--spacing-11)",
        12: "var(--spacing-12)",
        14: "var(--spacing-14)",
        16: "var(--spacing-16)",
        20: "var(--spacing-20)",
        24: "var(--spacing-24)",
        32: "var(--spacing-32)",
      },
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--shadow-focus)",
      },
      fontFamily: {
        sans: ["var(--font-family-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-family-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": [
          "var(--font-size-2xs)",
          { lineHeight: "var(--line-height-tight)" },
        ],
        xs: [
          "var(--font-size-xs)",
          { lineHeight: "var(--line-height-snug)" },
        ],
        sm: [
          "var(--font-size-sm)",
          { lineHeight: "var(--line-height-normal)" },
        ],
        base: [
          "var(--font-size-base)",
          { lineHeight: "var(--line-height-normal)" },
        ],
        md: [
          "var(--font-size-md)",
          { lineHeight: "var(--line-height-normal)" },
        ],
        lg: [
          "var(--font-size-lg)",
          { lineHeight: "var(--line-height-snug)" },
        ],
        xl: [
          "var(--font-size-xl)",
          { lineHeight: "var(--line-height-snug)" },
        ],
        "2xl": [
          "var(--font-size-2xl)",
          { lineHeight: "var(--line-height-tight)" },
        ],
        "3xl": [
          "var(--font-size-3xl)",
          { lineHeight: "var(--line-height-tight)" },
        ],
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        normal: "var(--line-height-normal)",
        relaxed: "var(--line-height-relaxed)",
      },
      letterSpacing: {
        tight: "var(--letter-spacing-tight)",
        normal: "var(--letter-spacing-normal)",
        wide: "var(--letter-spacing-wide)",
      },
      zIndex: {
        base: "var(--z-base)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        modalBackdrop: "var(--z-modalBackdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        toast: "var(--z-toast)",
      },
    },
  },
}

export default mercflowTailwindPreset
