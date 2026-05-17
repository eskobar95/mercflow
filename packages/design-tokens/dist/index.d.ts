export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export declare const tokens: {
    readonly color: {
        readonly surface: {
            readonly canvas: "#f6f6f7";
            readonly default: "#ffffff";
            readonly subtle: "#f9f9f9";
            readonly muted: "#f1f1f1";
            readonly raised: "#ffffff";
            readonly overlay: "rgba(16, 24, 32, 0.35)";
        };
        readonly label: {
            readonly primary: "#202223";
            readonly secondary: "#6d7175";
            readonly tertiary: "#8c9196";
            readonly placeholder: "#8c9196";
            readonly inverse: "#ffffff";
            readonly disabled: "#8c9196";
            readonly danger: "#c52828";
        };
        readonly brand: {
            readonly primary: "#2c6ecb";
            readonly muted: "#6d7175";
            readonly subtle: "#e6f0ff";
        };
        readonly border: {
            readonly default: "#e1e3e5";
            readonly subtle: "#ebebeb";
            readonly strong: "#8c9196";
            readonly focus: "#2c6ecb";
        };
        readonly interactive: {
            readonly primary: {
                readonly default: "#2c6ecb";
                readonly hover: "#1a5cb0";
                readonly pressed: "#134c92";
                readonly subtle: "#e6f0ff";
            };
            readonly danger: {
                readonly default: "#c52828";
                readonly hover: "#9e1f1f";
                readonly subtle: "#fceded";
            };
            readonly focus: {
                readonly ring: "#2c6ecb";
            };
            readonly disabled: {
                readonly background: "#f1f1f1";
                readonly text: "#8c9196";
                readonly border: "#e1e3e5";
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
    };
    readonly lineHeight: {
        readonly tight: "1.25";
        readonly snug: "1.375";
        readonly normal: "1.5";
        readonly relaxed: "1.625";
    };
    readonly letterSpacing: {
        readonly tight: "-0.01em";
        readonly normal: "0";
        readonly wide: "0.02em";
    };
    readonly motion: {
        readonly duration: {
            readonly page: "200ms";
        };
        readonly easing: {
            readonly page: "cubic-bezier(0.2, 0, 0, 1)";
        };
    };
    readonly radius: {
        readonly none: "0";
        readonly sm: "0.25rem";
        readonly md: "0.375rem";
        readonly lg: "0.5rem";
        readonly xl: "0.75rem";
        readonly "2xl": "1rem";
        readonly full: "9999px";
    };
    readonly shadow: {
        readonly sm: "0 1px 2px rgba(32, 34, 35, 0.08), 0 0 0 1px rgba(32, 34, 35, 0.04)";
        readonly md: "0 2px 6px rgba(32, 34, 35, 0.1), 0 0 0 1px rgba(32, 34, 35, 0.06)";
        readonly lg: "0 8px 24px rgba(32, 34, 35, 0.12), 0 0 0 1px rgba(32, 34, 35, 0.06)";
        readonly focus: "0 0 0 3px rgba(44, 110, 203, 0.35)";
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
export { mercflowTailwindPreset } from "./tailwind-preset.js";
export { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, motion, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
//# sourceMappingURL=index.d.ts.map