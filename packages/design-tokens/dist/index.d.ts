export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
export { tailwindPreset } from "./tailwind-preset.js";
/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export declare const tokens: {
    readonly color: {
        readonly surface: {
            readonly canvas: "#F5EDE3";
            readonly default: "#FDFAF7";
            readonly subtle: "#EBE0D0";
            readonly raised: "#FFFFFF";
            readonly overlay: "rgba(26, 26, 46, 0.45)";
        };
        readonly content: {
            readonly primary: "#1A1A2E";
            readonly secondary: "rgba(26, 26, 46, 0.65)";
            readonly tertiary: "rgba(26, 26, 46, 0.45)";
            readonly disabled: "rgba(26, 26, 46, 0.28)";
            readonly inverse: "#F5EDE3";
        };
        readonly border: {
            readonly subtle: "rgba(26, 26, 46, 0.08)";
            readonly default: "rgba(26, 26, 46, 0.15)";
            readonly strong: "rgba(26, 26, 46, 0.40)";
            readonly focus: "rgba(212, 135, 58, 0.60)";
        };
        readonly brand: {
            readonly base: "#1A1A2E";
            readonly amber: "#D4873A";
            readonly cream: "#F5EDE3";
        };
        readonly amber: {
            readonly subtle: "rgba(212, 135, 58, 0.12)";
            readonly soft: "rgba(212, 135, 58, 0.22)";
            readonly default: "#D4873A";
            readonly strong: "#B36A1F";
            readonly text: "#8B4E15";
        };
        readonly interactive: {
            readonly primary: {
                readonly default: "#1A1A2E";
                readonly hover: "#2D2D4A";
                readonly pressed: "#10101F";
            };
            readonly soft: {
                readonly default: "rgba(212, 135, 58, 0.12)";
                readonly hover: "rgba(212, 135, 58, 0.22)";
                readonly border: "rgba(212, 135, 58, 0.34)";
                readonly label: "#8B4E15";
            };
            readonly secondary: {
                readonly default: "transparent";
                readonly hover: "#EBE0D0";
            };
            readonly destructive: {
                readonly default: "rgba(192, 67, 32, 0.13)";
                readonly hover: "rgba(192, 67, 32, 0.20)";
                readonly border: "rgba(192, 67, 32, 0.34)";
                readonly label: "#7A2A14";
            };
            readonly focus: {
                readonly ring: "rgba(212, 135, 58, 0.40)";
            };
            readonly disabled: {
                readonly background: "#EBE0D0";
                readonly text: "rgba(26, 26, 46, 0.28)";
                readonly border: "rgba(26, 26, 46, 0.08)";
            };
        };
        readonly feedback: {
            readonly success: {
                readonly default: "#7F9043";
                readonly subtle: "rgba(127, 144, 67, 0.16)";
                readonly content: "#4A6B22";
                readonly border: "rgba(127, 144, 67, 0.32)";
            };
            readonly warning: {
                readonly default: "#C29023";
                readonly subtle: "rgba(194, 144, 35, 0.16)";
                readonly content: "#6B4A12";
                readonly border: "rgba(194, 144, 35, 0.32)";
            };
            readonly danger: {
                readonly default: "#C04320";
                readonly subtle: "rgba(192, 67, 32, 0.13)";
                readonly content: "#7A2A14";
                readonly border: "rgba(192, 67, 32, 0.34)";
            };
            readonly info: {
                readonly default: "#606B94";
                readonly subtle: "rgba(96, 107, 148, 0.14)";
                readonly content: "#3A4366";
                readonly border: "rgba(96, 107, 148, 0.32)";
            };
        };
    };
    readonly spacing: Record<string, string>;
    readonly fontFamily: {
        readonly sans: string;
        readonly mono: string;
    };
    readonly fontSize: {
        readonly "2xs": "0.6875rem";
        readonly xs: "0.75rem";
        readonly sm: "0.8125rem";
        readonly base: "0.875rem";
        readonly md: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly "2xl": "1.5rem";
        readonly "3xl": "1.75rem";
    };
    readonly fontWeight: {
        readonly regular: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
    };
    readonly lineHeight: {
        readonly tight: "1.2";
        readonly snug: "1.3";
        readonly normal: "1.5";
        readonly relaxed: "1.625";
    };
    readonly letterSpacing: {
        readonly tight: "-0.01em";
        readonly normal: "0";
        readonly label: "0.06em";
        readonly wide: "0.08em";
    };
    readonly motion: {
        readonly duration: {
            readonly instant: "80ms";
            readonly fast: "150ms";
            readonly page: "200ms";
            readonly slow: "300ms";
        };
        readonly easing: {
            readonly enter: "cubic-bezier(0.2, 0, 0, 1)";
            readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
            readonly spring: "cubic-bezier(0.34, 1.56, 0.64, 1)";
        };
    };
    readonly radius: {
        readonly none: "0";
        readonly sm: "0.375rem";
        readonly base: "0.5rem";
        readonly md: "0.625rem";
        readonly lg: "0.75rem";
        readonly xl: "1rem";
        readonly pill: "9999px";
    };
    readonly shadow: {
        readonly sm: "0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)";
        readonly md: "0 4px 12px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.05)";
        readonly lg: "0 12px 32px rgba(26, 26, 46, 0.10), 0 4px 8px rgba(26, 26, 46, 0.06)";
        readonly focus: "0 0 0 3px rgba(212, 135, 58, 0.40)";
    };
    readonly zIndex: {
        readonly base: "0";
        readonly dropdown: "1000";
        readonly sticky: "1020";
        readonly modalBackdrop: "1040";
        readonly modal: "1050";
        readonly popover: "1060";
        readonly toast: "1080";
    };
};
export type MercflowTokenMap = typeof tokens;
export { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, motion, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
//# sourceMappingURL=index.d.ts.map