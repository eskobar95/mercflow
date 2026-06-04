export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
export { tailwindPreset } from "./tailwind-preset.js";
/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export declare const tokens: {
    readonly color: {
        readonly surface: {
            readonly canvas: "#f6f6f7";
            readonly appCanvas: "#f6f6f7";
            readonly default: "#ffffff";
            readonly appCard: "#ffffff";
            readonly subtle: "#f9f9f9";
            readonly muted: "#f1f1f1";
            readonly raised: "#ffffff";
            readonly overlay: "rgba(16, 24, 32, 0.35)";
            readonly sidebar: "#ebebeb";
            readonly sidebarHover: "#e3e5e8";
            readonly sidebarActive: "#ffffff";
        };
        readonly content: {
            readonly primary: "#202223";
            readonly secondary: "#6d7175";
            readonly tertiary: "#8c9196";
            readonly placeholder: "#8c9196";
            readonly inverse: "#ffffff";
            readonly disabled: "#8c9196";
            readonly danger: "#c52828";
            readonly onSidebar: "#303030";
            readonly onSidebarMuted: "#616161";
            readonly onSidebarActive: "#202223";
        };
        readonly border: {
            readonly default: "#e1e3e5";
            readonly subtle: "#ebebeb";
            readonly strong: "#8c9196";
            readonly focus: "#2c6ecb";
            readonly app: "#dadde0";
            readonly onSidebar: "#d2d5d8";
        };
        readonly brand: {
            readonly base: "#202223";
            readonly accent: "#2c6ecb";
            readonly cream: "#f6f6f7";
        };
        readonly accent: {
            readonly default: "#2c6ecb";
            readonly subtle: "#e6f0ff";
            readonly soft: "#d5ebff";
            readonly strong: "#1a5cb0";
            readonly text: "#174a8c";
        };
        readonly interactive: {
            readonly primary: {
                readonly default: "#2c6ecb";
                readonly hover: "#1a5cb0";
                readonly pressed: "#134c92";
                readonly subtle: "#e6f0ff";
            };
            readonly soft: {
                readonly default: "#f1f3f5";
                readonly hover: "#e3e7ea";
                readonly border: "#cdd3d9";
                readonly label: "#4a4d52";
            };
            readonly secondary: {
                readonly default: "#ffffff";
                readonly hover: "#f6f7f9";
            };
            readonly destructive: {
                readonly default: "#c52828";
                readonly hover: "#9e1f1f";
                readonly subtle: "#fceded";
                readonly border: "#eab4b4";
                readonly label: "#8e1f18";
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
        readonly feedback: {
            readonly success: {
                readonly default: "#007f5f";
                readonly subtle: "#e3f6ef";
                readonly content: "#0d4f3c";
                readonly border: "#8fcbb5";
            };
            readonly warning: {
                readonly default: "#b78600";
                readonly subtle: "#fff5d9";
                readonly content: "#5c4813";
                readonly border: "#f0d878";
            };
            readonly danger: {
                readonly default: "#c52828";
                readonly subtle: "#fceded";
                readonly content: "#771515";
                readonly border: "#e89898";
            };
            readonly info: {
                readonly default: "#2c6ecb";
                readonly subtle: "#e6f0ff";
                readonly content: "#133e7c";
                readonly border: "#8fb5ea";
            };
            readonly pending: {
                readonly default: "#EA580C";
                readonly subtle: "rgba(234, 88, 12, 0.12)";
                readonly content: "#9A3412";
                readonly border: "rgba(234, 88, 12, 0.30)";
            };
        };
        readonly connectorStatus: {
            readonly active: {
                readonly bg: "#e3f4ea";
                readonly border: "#94d0b1";
                readonly text: "#0f5132";
            };
            readonly inactive: {
                readonly bg: "#f1f1f1";
                readonly border: "#e1e3e5";
                readonly text: "#6d7175";
            };
            readonly unconfigured: {
                readonly bg: "#fff5d9";
                readonly border: "#f0d878";
                readonly text: "#5c4f1a";
            };
        };
    };
    readonly spacing: Record<string, string>;
    readonly fontFamily: {
        readonly sans: string;
        readonly mono: string;
    };
    readonly fontSize: {
        readonly "3xs": "0.5625rem";
        readonly "2xs": "0.6875rem";
        readonly xs: "0.75rem";
        readonly sm: "0.8125rem";
        readonly base: "0.875rem";
        readonly interface: "0.8125rem";
        readonly md: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly "2xl": "1.5rem";
        readonly "3xl": "1.75rem";
        readonly "4xl": "2rem";
        readonly "5xl": "2.25rem";
    };
    readonly fontWeight: {
        readonly regular: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
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
        readonly label: "0.08em";
        readonly wide: "0.02em";
    };
    readonly motion: {
        readonly duration: {
            readonly page: "200ms";
            readonly fast: "150ms";
        };
        readonly easing: {
            readonly page: "cubic-bezier(0.2, 0, 0, 1)";
            readonly enter: "cubic-bezier(0.2, 0, 0, 1)";
            readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
            readonly spring: "cubic-bezier(0.34, 1.56, 0.64, 1)";
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
export { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, motion, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
//# sourceMappingURL=index.d.ts.map