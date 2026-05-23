export { buildRootStylesheet } from "./lib/buildRootStylesheet.js";
export { tailwindPreset } from "./tailwind-preset.js";
/**
 * Authoritative nested token map for programmatic consumption (Tailwind, runtime theme, etc.).
 * Color literals live only in `definitions/batch1` and this object references them.
 */
export declare const tokens: {
    readonly color: {
        readonly surface: {
            readonly canvas: "#F7F8FA";
            readonly default: "#FFFFFF";
            readonly subtle: "#F3F4F6";
            readonly raised: "#FFFFFF";
            readonly overlay: "rgba(17, 24, 39, 0.50)";
            readonly appCanvas: "#F7F8FA";
            readonly appCard: "#FFFFFF";
            readonly sidebar: "#131316";
            readonly sidebarHover: "rgba(255, 255, 255, 0.04)";
            readonly sidebarActive: "rgba(255, 255, 255, 0.08)";
        };
        readonly content: {
            readonly primary: "#111827";
            readonly secondary: "#6B7280";
            readonly tertiary: "#9CA3AF";
            readonly disabled: "#D1D5DB";
            readonly inverse: "#FFFFFF";
            readonly onSidebar: "rgba(255, 255, 255, 0.85)";
            readonly onSidebarMuted: "rgba(255, 255, 255, 0.55)";
            readonly onSidebarActive: "#FFFFFF";
        };
        readonly border: {
            readonly subtle: "#F3F4F6";
            readonly default: "#E5E7EB";
            readonly strong: "#D1D5DB";
            readonly focus: "rgba(37, 99, 235, 0.40)";
            readonly app: "#E5E7EB";
            readonly onSidebar: "rgba(255, 255, 255, 0.08)";
        };
        readonly brand: {
            readonly base: "#111827";
            readonly amber: "#2563EB";
            readonly cream: "#F7F8FA";
        };
        readonly amber: {
            readonly subtle: "rgba(37, 99, 235, 0.10)";
            readonly soft: "rgba(37, 99, 235, 0.18)";
            readonly default: "#2563EB";
            readonly strong: "#1D4FD7";
            readonly text: "#1E40AF";
        };
        readonly interactive: {
            readonly primary: {
                readonly default: "#2563EB";
                readonly hover: "#1D4FD7";
                readonly pressed: "#1A3F9F";
            };
            readonly soft: {
                readonly default: "rgba(37, 99, 235, 0.10)";
                readonly hover: "rgba(37, 99, 235, 0.18)";
                readonly border: "rgba(37, 99, 235, 0.24)";
                readonly label: "#1E40AF";
            };
            readonly secondary: {
                readonly default: "#FFFFFF";
                readonly hover: "#F3F4F6";
            };
            readonly destructive: {
                readonly default: "rgba(220, 38, 38, 0.10)";
                readonly hover: "rgba(220, 38, 38, 0.18)";
                readonly border: "rgba(220, 38, 38, 0.24)";
                readonly label: "#991B1B";
            };
            readonly focus: {
                readonly ring: "rgba(37, 99, 235, 0.40)";
            };
            readonly disabled: {
                readonly background: "#F3F4F6";
                readonly text: "#9CA3AF";
                readonly border: "#E5E7EB";
            };
        };
        readonly feedback: {
            readonly success: {
                readonly default: "#10B981";
                readonly subtle: "rgba(16, 185, 129, 0.12)";
                readonly content: "#047857";
                readonly border: "rgba(16, 185, 129, 0.30)";
            };
            readonly warning: {
                readonly default: "#F59E0B";
                readonly subtle: "rgba(245, 158, 11, 0.12)";
                readonly content: "#92400E";
                readonly border: "rgba(245, 158, 11, 0.30)";
            };
            readonly danger: {
                readonly default: "#EF4444";
                readonly subtle: "rgba(239, 68, 68, 0.10)";
                readonly content: "#991B1B";
                readonly border: "rgba(239, 68, 68, 0.30)";
            };
            readonly info: {
                readonly default: "#3B82F6";
                readonly subtle: "rgba(59, 130, 246, 0.10)";
                readonly content: "#1E40AF";
                readonly border: "rgba(59, 130, 246, 0.30)";
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
        readonly "3xl": "1.875rem";
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
        readonly label: "0.04em";
        readonly wide: "0.08em";
    };
    readonly motion: {
        readonly duration: {
            readonly instant: "80ms";
            readonly fast: "160ms";
            readonly page: "200ms";
            readonly slow: "280ms";
        };
        readonly easing: {
            readonly enter: "cubic-bezier(0.23, 1, 0.32, 1)";
            readonly exit: "cubic-bezier(0.77, 0, 0.175, 1)";
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
        readonly sm: "0 1px 2px rgba(17, 24, 39, 0.04), 0 6px 18px rgba(17, 24, 39, 0.04)";
        readonly md: "0 4px 12px rgba(17, 24, 39, 0.08), 0 2px 4px rgba(17, 24, 39, 0.04)";
        readonly lg: "0 16px 40px rgba(17, 24, 39, 0.12), 0 4px 8px rgba(17, 24, 39, 0.06)";
        readonly focus: "0 0 0 3px rgba(37, 99, 235, 0.40)";
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