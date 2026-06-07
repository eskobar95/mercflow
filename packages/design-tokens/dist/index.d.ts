export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
export { tailwindPreset } from "./tailwind-preset.js";
/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export declare const tokens: {
    readonly color: {
        readonly neutral: {
            readonly 0: "#ffffff";
            readonly 25: "#fbfcfd";
            readonly 50: "#f6f8fa";
            readonly 100: "#eef1f5";
            readonly 150: "#e7ebf0";
            readonly 200: "#e1e6eb";
            readonly 300: "#d2d8df";
            readonly 400: "#aab2bd";
            readonly 500: "#7a828d";
            readonly 600: "#5a626d";
            readonly 700: "#3e444d";
            readonly 800: "#272b31";
            readonly 900: "#181b20";
            readonly 950: "#0f1114";
        };
        readonly surface: {
            readonly canvas: "#f6f8fa";
            readonly appCanvas: "#f6f8fa";
            readonly default: "#ffffff";
            readonly appCard: "#ffffff";
            readonly subtle: "#f6f8fa";
            readonly muted: "#eef1f5";
            readonly raised: "#ffffff";
            readonly overlay: "rgba(15, 17, 20, 0.40)";
            readonly sidebar: "#eef1f5";
            readonly sidebarHover: "#e7ebf0";
            readonly sidebarActive: "#ffffff";
        };
        readonly content: {
            readonly primary: "#181b20";
            readonly secondary: "#5a626d";
            readonly tertiary: "#7a828d";
            readonly placeholder: "#aab2bd";
            readonly inverse: "#ffffff";
            readonly disabled: "#aab2bd";
            readonly danger: "#c0392b";
            readonly onSidebar: "#3e444d";
            readonly onSidebarMuted: "#7a828d";
            readonly onSidebarActive: "#181b20";
        };
        readonly border: {
            readonly default: "#e1e6eb";
            readonly subtle: "#eef1f5";
            readonly strong: "#d2d8df";
            readonly focus: "#2b5cd9";
            readonly app: "#e1e6eb";
            readonly onSidebar: "#e1e6eb";
        };
        readonly brand: {
            readonly base: "#181b20";
            readonly accent: "#2b5cd9";
            readonly cream: "#f6f8fa";
        };
        readonly accent: {
            readonly default: "#2b5cd9";
            readonly subtle: "#eef2fd";
            readonly soft: "#dbe4fb";
            readonly strong: "#1f47ad";
            readonly text: "#1b3e96";
        };
        readonly interactive: {
            readonly primary: {
                readonly default: "#181b20";
                readonly hover: "#272b31";
                readonly pressed: "#0f1114";
                readonly subtle: "#eef1f5";
            };
            readonly soft: {
                readonly default: "#eef1f5";
                readonly hover: "#e7ebf0";
                readonly border: "#d2d8df";
                readonly label: "#3e444d";
            };
            readonly secondary: {
                readonly default: "#ffffff";
                readonly hover: "#f6f8fa";
            };
            readonly destructive: {
                readonly default: "#c0392b";
                readonly hover: "#9c2a1f";
                readonly subtle: "#fcecea";
                readonly border: "#eab4ad";
                readonly label: "#8a261c";
            };
            readonly focus: {
                readonly ring: "#2b5cd9";
            };
            readonly disabled: {
                readonly background: "#eef1f5";
                readonly text: "#aab2bd";
                readonly border: "#e1e6eb";
            };
        };
        readonly feedback: {
            readonly success: {
                readonly default: "#0a7a55";
                readonly subtle: "#e7f5ef";
                readonly content: "#0a4a36";
                readonly border: "#9ad0bb";
            };
            readonly warning: {
                readonly default: "#b07400";
                readonly subtle: "#fcf2d9";
                readonly content: "#5a4410";
                readonly border: "#eccf7d";
            };
            readonly danger: {
                readonly default: "#c0392b";
                readonly subtle: "#fcecea";
                readonly content: "#7a221a";
                readonly border: "#e6a79f";
            };
            readonly info: {
                readonly default: "#2b5cd9";
                readonly subtle: "#eef2fd";
                readonly content: "#1b3e96";
                readonly border: "#a9bdee";
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
        readonly tighter: "-0.022em";
        readonly tight: "-0.011em";
        readonly normal: "0";
        readonly label: "0.06em";
        readonly wide: "0.02em";
    };
    readonly motion: {
        readonly duration: {
            readonly page: "190ms";
            readonly fast: "140ms";
            readonly slow: "280ms";
        };
        readonly easing: {
            readonly page: "cubic-bezier(0.23, 1, 0.32, 1)";
            readonly enter: "cubic-bezier(0.23, 1, 0.32, 1)";
            readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
            readonly standard: "cubic-bezier(0.77, 0, 0.175, 1)";
            readonly drawer: "cubic-bezier(0.32, 0.72, 0, 1)";
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
        readonly sm: "0 1px 2px -1px rgba(15, 17, 20, 0.05)";
        readonly md: "0 6px 16px -6px rgba(15, 17, 20, 0.12), 0 0 0 1px rgba(15, 17, 20, 0.05)";
        readonly lg: "0 16px 40px -12px rgba(15, 17, 20, 0.18), 0 0 0 1px rgba(15, 17, 20, 0.05)";
        readonly focus: "0 0 0 3px rgba(43, 92, 217, 0.28)";
    };
    readonly layout: {
        readonly listTableMinWidth: "600px";
        readonly filterChipMaxWidth: "11rem";
    };
    readonly zIndex: {
        readonly base: "0";
        readonly sticky: "1020";
        readonly dropdown: "1030";
        readonly modalBackdrop: "1040";
        readonly modal: "1050";
        readonly popover: "1060";
        readonly toast: "1080";
    };
};
export type MercflowTokenMap = typeof tokens;
export { colorTree, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, layout, motion, radii, shadows, spacingScale, zIndex, } from "./definitions/batch1.js";
//# sourceMappingURL=index.d.ts.map