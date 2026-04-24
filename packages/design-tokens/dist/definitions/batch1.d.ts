/**
 * Batch 1 design token source values (light, spacious admin — Shopify Admin–inspired).
 * All sRGB color literals for the admin UI must originate here (or in this package only).
 */
export declare const colorTree: {
    readonly surface: {
        /** Application canvas / page background */
        readonly canvas: "#f6f6f7";
        /** Primary panels, cards, popovers (raised surfaces) */
        readonly default: "#ffffff";
        /** Secondary panels, table stripes */
        readonly subtle: "#f9f9f9";
        /** Disabled inputs, low-emphasis areas */
        readonly muted: "#f1f1f1";
        /** Same as default; use with shadow for elevation if needed */
        readonly raised: "#ffffff";
        /** Scrim for modal overlays (light theme) */
        readonly overlay: "rgba(16, 24, 32, 0.35)";
    };
    readonly content: {
        readonly primary: "#202223";
        readonly secondary: "#6d7175";
        readonly tertiary: "#8c9196";
        readonly placeholder: "#8c9196";
        /** Text on primary / danger fill buttons */
        readonly inverse: "#ffffff";
        /** Non-interactive de-emphasis */
        readonly disabled: "#8c9196";
        /** Links and critical inline messaging */
        readonly danger: "#c52828";
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
            /** Ghost / low-emphasis control backgrounds */
            readonly subtle: "#e6f0ff";
        };
        readonly danger: {
            readonly default: "#c52828";
            readonly hover: "#9e1f1f";
            /** Low-emphasis danger surfaces (e.g. banners) */
            readonly subtle: "#fceded";
        };
        /** Focus affordance; pair with focus outline styles in admin-ui */
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
/**
 * Spacing scale aligned with Tailwind’s default (rem → browser root).
 * Keys match Tailwind numeric spacing: 1 = 0.25rem, 2 = 0.5rem, …
 */
export declare const spacingScale: Record<string, string>;
export declare const fontFamily: {
    readonly sans: string;
    readonly mono: string;
};
export declare const fontSize: {
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
export declare const fontWeight: {
    readonly regular: "400";
    readonly medium: "500";
    readonly semibold: "600";
};
export declare const lineHeight: {
    readonly tight: "1.25";
    readonly snug: "1.375";
    readonly normal: "1.5";
    readonly relaxed: "1.625";
};
export declare const letterSpacing: {
    readonly tight: "-0.01em";
    readonly normal: "0";
    readonly wide: "0.02em";
};
export declare const radii: {
    readonly none: "0";
    readonly sm: "0.25rem";
    readonly md: "0.375rem";
    readonly lg: "0.5rem";
    readonly xl: "0.75rem";
    readonly "2xl": "1rem";
    readonly full: "9999px";
};
/**
 * Layered box shadows. Values reference surface/content tokens for consistency.
 */
export declare const shadows: {
    readonly sm: "0 1px 2px rgba(32, 34, 35, 0.08), 0 0 0 1px rgba(32, 34, 35, 0.04)";
    readonly md: "0 2px 6px rgba(32, 34, 35, 0.1), 0 0 0 1px rgba(32, 34, 35, 0.06)";
    readonly lg: "0 8px 24px rgba(32, 34, 35, 0.12), 0 0 0 1px rgba(32, 34, 35, 0.06)";
    readonly focus: "0 0 0 3px rgba(44, 110, 203, 0.35)";
};
export declare const zIndex: {
    readonly base: "0";
    readonly dropdown: "1000";
    readonly sticky: "1020";
    readonly modalBackdrop: "1040";
    readonly modal: "1050";
    readonly popover: "1060";
    readonly toast: "1080";
};
//# sourceMappingURL=batch1.d.ts.map