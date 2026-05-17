/**
 * MercFlow Tailwind v3 preset: maps utilities to `--mf-*` CSS custom properties
 * emitted in `tokens.css` / `mercflow-tokens.css`.
 */
export const mercflowTailwindPreset = {
    theme: {
        extend: {
            colors: {
                surface: {
                    canvas: "var(--mf-color-surface-canvas)",
                    default: "var(--mf-color-surface-default)",
                    subtle: "var(--mf-color-surface-subtle)",
                    muted: "var(--mf-color-surface-muted)",
                    raised: "var(--mf-color-surface-raised)",
                    overlay: "var(--mf-color-surface-overlay)",
                },
                /** Primary text semantics (aliases share values with legacy `content` below). */
                label: {
                    primary: "var(--mf-color-label-primary)",
                    secondary: "var(--mf-color-label-secondary)",
                    tertiary: "var(--mf-color-label-tertiary)",
                    placeholder: "var(--mf-color-label-placeholder)",
                    inverse: "var(--mf-color-label-inverse)",
                    disabled: "var(--mf-color-label-disabled)",
                    danger: "var(--mf-color-label-danger)",
                },
                /** Deprecated naming — use `label` for new markup; aliases point at the same `--mf-color-label-*` vars. */
                content: {
                    primary: "var(--mf-color-label-primary)",
                    secondary: "var(--mf-color-label-secondary)",
                    tertiary: "var(--mf-color-label-tertiary)",
                    placeholder: "var(--mf-color-label-placeholder)",
                    inverse: "var(--mf-color-label-inverse)",
                    disabled: "var(--mf-color-label-disabled)",
                    danger: "var(--mf-color-label-danger)",
                },
                brand: {
                    DEFAULT: "var(--mf-color-brand-primary)",
                    primary: "var(--mf-color-brand-primary)",
                    muted: "var(--mf-color-brand-muted)",
                    subtle: "var(--mf-color-brand-subtle)",
                },
                border: {
                    DEFAULT: "var(--mf-color-border-default)",
                    default: "var(--mf-color-border-default)",
                    subtle: "var(--mf-color-border-subtle)",
                    strong: "var(--mf-color-border-strong)",
                    focus: "var(--mf-color-border-focus)",
                },
                interactive: {
                    primary: {
                        DEFAULT: "var(--mf-color-interactive-primary)",
                        hover: "var(--mf-color-interactive-primary-hover)",
                        pressed: "var(--mf-color-interactive-primary-pressed)",
                        subtle: "var(--mf-color-interactive-primary-subtle)",
                    },
                    danger: {
                        DEFAULT: "var(--mf-color-interactive-danger)",
                        hover: "var(--mf-color-interactive-danger-hover)",
                        subtle: "var(--mf-color-interactive-danger-subtle)",
                    },
                    focus: {
                        ring: "var(--mf-color-interactive-focus-ring)",
                    },
                    disabled: {
                        background: "var(--mf-color-interactive-disabled-background)",
                        text: "var(--mf-color-interactive-disabled-text)",
                        border: "var(--mf-color-interactive-disabled-border)",
                    },
                },
            },
            spacing: {
                px: "var(--mf-spacing-px)",
                0: "var(--mf-spacing-0)",
                0.5: "var(--mf-spacing-0-5)",
                1: "var(--mf-spacing-1)",
                1.5: "var(--mf-spacing-1-5)",
                2: "var(--mf-spacing-2)",
                2.5: "var(--mf-spacing-2-5)",
                3: "var(--mf-spacing-3)",
                3.5: "var(--mf-spacing-3-5)",
                4: "var(--mf-spacing-4)",
                5: "var(--mf-spacing-5)",
                6: "var(--mf-spacing-6)",
                7: "var(--mf-spacing-7)",
                8: "var(--mf-spacing-8)",
                9: "var(--mf-spacing-9)",
                10: "var(--mf-spacing-10)",
                11: "var(--mf-spacing-11)",
                12: "var(--mf-spacing-12)",
                14: "var(--mf-spacing-14)",
                16: "var(--mf-spacing-16)",
                20: "var(--mf-spacing-20)",
                24: "var(--mf-spacing-24)",
                32: "var(--mf-spacing-32)",
            },
            borderRadius: {
                none: "var(--mf-radius-none)",
                sm: "var(--mf-radius-sm)",
                DEFAULT: "var(--mf-radius-md)",
                md: "var(--mf-radius-md)",
                lg: "var(--mf-radius-lg)",
                xl: "var(--mf-radius-xl)",
                "2xl": "var(--mf-radius-2xl)",
                full: "var(--mf-radius-full)",
            },
            boxShadow: {
                sm: "var(--mf-shadow-sm)",
                DEFAULT: "var(--mf-shadow-md)",
                md: "var(--mf-shadow-md)",
                lg: "var(--mf-shadow-lg)",
                focus: "var(--mf-shadow-focus)",
            },
            fontFamily: {
                sans: ["var(--mf-font-family-sans)", "system-ui", "sans-serif"],
                mono: ["var(--mf-font-family-mono)", "ui-monospace", "monospace"],
            },
            fontSize: {
                "2xs": [
                    "var(--mf-font-size-2xs)",
                    { lineHeight: "var(--mf-line-height-tight)" },
                ],
                xs: [
                    "var(--mf-font-size-xs)",
                    { lineHeight: "var(--mf-line-height-snug)" },
                ],
                sm: [
                    "var(--mf-font-size-sm)",
                    { lineHeight: "var(--mf-line-height-normal)" },
                ],
                base: [
                    "var(--mf-font-size-base)",
                    { lineHeight: "var(--mf-line-height-normal)" },
                ],
                md: [
                    "var(--mf-font-size-md)",
                    { lineHeight: "var(--mf-line-height-normal)" },
                ],
                lg: [
                    "var(--mf-font-size-lg)",
                    { lineHeight: "var(--mf-line-height-snug)" },
                ],
                xl: [
                    "var(--mf-font-size-xl)",
                    { lineHeight: "var(--mf-line-height-snug)" },
                ],
                "2xl": [
                    "var(--mf-font-size-2xl)",
                    { lineHeight: "var(--mf-line-height-tight)" },
                ],
                "3xl": [
                    "var(--mf-font-size-3xl)",
                    { lineHeight: "var(--mf-line-height-tight)" },
                ],
            },
            fontWeight: {
                regular: "var(--mf-font-weight-regular)",
                medium: "var(--mf-font-weight-medium)",
                semibold: "var(--mf-font-weight-semibold)",
            },
            lineHeight: {
                tight: "var(--mf-line-height-tight)",
                snug: "var(--mf-line-height-snug)",
                normal: "var(--mf-line-height-normal)",
                relaxed: "var(--mf-line-height-relaxed)",
            },
            letterSpacing: {
                tight: "var(--mf-letter-spacing-tight)",
                normal: "var(--mf-letter-spacing-normal)",
                wide: "var(--mf-letter-spacing-wide)",
            },
            zIndex: {
                base: "var(--mf-z-index-base)",
                dropdown: "var(--mf-z-index-dropdown)",
                sticky: "var(--mf-z-index-sticky)",
                modalBackdrop: "var(--mf-z-index-modal-backdrop)",
                modal: "var(--mf-z-index-modal)",
                popover: "var(--mf-z-index-popover)",
                toast: "var(--mf-z-index-toast)",
            },
        },
    },
    plugins: [],
};
export default mercflowTailwindPreset;
