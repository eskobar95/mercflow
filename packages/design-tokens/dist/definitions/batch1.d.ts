/**
 * Batch 1 design token source values — MercFlow Brand Kit v1.
 *
 * Brand foundation (locked from Logo v4 / Brand Kit):
 *   base:  #1A1A2E  — dark navy, primary text and button fill
 *   amber: #D4873A  — brand accent, logo, soft affordance buttons
 *   cream: #F5EDE3  — warm canvas background
 *
 * Design decisions:
 *   - Font: Plus Jakarta Sans (UI) + JetBrains Mono (code/IDs)
 *   - Borders: opacity-based rgba(26,26,46,…) — adapts to any surface
 *   - Shadows: warm navy rgba(26,26,46,…) — never pure black
 *   - Semantic colors: all warm-toned — olive success, amber warning,
 *     terracotta danger, dusty-indigo info — never cold defaults
 *   - Primary button: dark navy (authority); amber = soft affordance only
 *   - Radius: base 8px (buttons/inputs), lg 12px (cards), pill (badges)
 *
 * Color system layers:
 *   surface / content / border / brand / amber  — base structural tokens
 *   interactive.*                               — action/button tokens
 *   feedback.*                                  — semantic status tokens
 *
 * All sRGB color literals for the admin UI must originate here only.
 */
export declare const colorTree: {
    readonly surface: {
        /** Warm cream canvas — brand surfaces, accent panels, brand-led moments */
        readonly canvas: "#F5EDE3";
        /** Cards, inputs, form fields — near-white warm */
        readonly default: "#FDFAF7";
        /** Soft panels, hover fills, table stripe, disabled bg */
        readonly subtle: "#EBE0D0";
        /** Modals, popovers, command palette — pure white for focus */
        readonly raised: "#FFFFFF";
        /** Modal scrim overlay — dark navy tint */
        readonly overlay: "rgba(26, 26, 46, 0.45)";
        /**
         * Operational app canvas — cool warm-tinted gray.
         * Default background for admin pages so cream/amber stay accents.
         */
        readonly appCanvas: "#F6F5F2";
        /** Operational card surface — pure white, paired with shadow.sm */
        readonly appCard: "#FFFFFF";
        /** Sidebar chrome — brand navy (matches brand.base) */
        readonly sidebar: "#1A1A2E";
        /** Sidebar nav hover row — 8% cream wash on navy */
        readonly sidebarHover: "rgba(245, 237, 227, 0.06)";
        /** Sidebar active item — amber 16% wash on navy */
        readonly sidebarActive: "rgba(212, 135, 58, 0.16)";
    };
    readonly content: {
        /** Dark navy — brand.base · contrast ≫ 12:1 on all surfaces */
        readonly primary: "#1A1A2E";
        /** Secondary labels, descriptions · 65% opacity navy */
        readonly secondary: "rgba(26, 26, 46, 0.65)";
        /** Tertiary captions, placeholders, metadata · 45% opacity navy */
        readonly tertiary: "rgba(26, 26, 46, 0.45)";
        /** Non-interactive de-emphasis · 28% opacity navy */
        readonly disabled: "rgba(26, 26, 46, 0.28)";
        /** Text on dark fills (primary buttons, dark navy surfaces) */
        readonly inverse: "#F5EDE3";
        /** Sidebar nav label — cream off-white at 88% on navy */
        readonly onSidebar: "rgba(245, 237, 227, 0.88)";
        /** Sidebar muted label, section header — cream 55% on navy */
        readonly onSidebarMuted: "rgba(245, 237, 227, 0.55)";
        /** Sidebar active item label — amber light */
        readonly onSidebarActive: "#E8B574";
    };
    readonly border: {
        /** Hairlines, dividers, table rows · 8% opacity navy */
        readonly subtle: "rgba(26, 26, 46, 0.08)";
        /** Standard input/card borders · 15% opacity navy */
        readonly default: "rgba(26, 26, 46, 0.15)";
        /** Strong separators, active input border · 40% opacity navy */
        readonly strong: "rgba(26, 26, 46, 0.40)";
        /** Focus ring — amber tint · pairs with shadow.focus */
        readonly focus: "rgba(212, 135, 58, 0.60)";
        /** App-canvas border (topbar/card outlines) — cooler than amber-tinted */
        readonly app: "rgba(26, 26, 46, 0.10)";
        /** Sidebar internal divider — cream 10% on navy */
        readonly onSidebar: "rgba(245, 237, 227, 0.10)";
    };
    /**
     * Core brand identity colors.
     * Use these when building logo lockups, cover pages, and branded surfaces.
     * Do not use brand.base directly in button styles — use interactive.primary.
     */
    readonly brand: {
        readonly base: "#1A1A2E";
        readonly amber: "#D4873A";
        readonly cream: "#F5EDE3";
    };
    /**
     * Amber scale — the brand accent ramp.
     * Used for: active nav states, soft buttons, checkboxes, toggles,
     * amber badge variant, focus affordance fills.
     * NOT for primary CTAs (use interactive.primary / dark navy for those).
     */
    readonly amber: {
        readonly subtle: "rgba(212, 135, 58, 0.12)";
        readonly soft: "rgba(212, 135, 58, 0.22)";
        readonly default: "#D4873A";
        readonly strong: "#B36A1F";
        /** Legible amber text on cream/light surfaces */
        readonly text: "#8B4E15";
    };
    readonly interactive: {
        /**
         * Primary CTA button — dark navy fill.
         * Hover: lighten to #2D2D4A. Pressed: darken to #10101F.
         * Label: content.inverse (#F5EDE3) — contrast 12:1 ✓ WCAG AAA.
         */
        readonly primary: {
            readonly default: "#1A1A2E";
            readonly hover: "#2D2D4A";
            readonly pressed: "#10101F";
        };
        /**
         * Soft amber button — amber affordance (Connect, Enable, Add module).
         * Label: amber.text (#8B4E15) on amber.subtle fill.
         */
        readonly soft: {
            readonly default: "rgba(212, 135, 58, 0.12)";
            readonly hover: "rgba(212, 135, 58, 0.22)";
            readonly border: "rgba(212, 135, 58, 0.34)";
            readonly label: "#8B4E15";
        };
        /** Secondary button — transparent with default border, hover uses surface.subtle */
        readonly secondary: {
            readonly default: "transparent";
            readonly hover: "#EBE0D0";
        };
        /**
         * Destructive action button — terracotta fill/tint.
         * Matches feedback.danger for consistency.
         */
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
    /**
     * Semantic feedback colors — alert banners, toasts, status tags, validation.
     * All warm-toned: olive success, amber warning, terracotta danger, dusty indigo info.
     *
     * Each state:
     *   default  — icon tint, strong border, filled badge bg
     *   subtle   — banner/toast background
     *   content  — text on subtle bg (all ≥ 7:1 contrast ✓ WCAG AA)
     *   border   — banner border / tag outline
     */
    readonly feedback: {
        readonly success: {
            /** Warm olive — order confirmed, product saved, payment received */
            readonly default: "#7F9043";
            readonly subtle: "rgba(127, 144, 67, 0.16)";
            readonly content: "#4A6B22";
            readonly border: "rgba(127, 144, 67, 0.32)";
        };
        readonly warning: {
            /** Warm amber-yellow — low stock, pending review, expiring promo */
            readonly default: "#C29023";
            readonly subtle: "rgba(194, 144, 35, 0.16)";
            readonly content: "#6B4A12";
            readonly border: "rgba(194, 144, 35, 0.32)";
        };
        readonly danger: {
            /** Terracotta — payment failed, validation error, destructive result */
            readonly default: "#C04320";
            readonly subtle: "rgba(192, 67, 32, 0.13)";
            readonly content: "#7A2A14";
            readonly border: "rgba(192, 67, 32, 0.34)";
        };
        readonly info: {
            /** Warm dusty indigo — new order notification, system tip */
            readonly default: "#606B94";
            readonly subtle: "rgba(96, 107, 148, 0.14)";
            readonly content: "#3A4366";
            readonly border: "rgba(96, 107, 148, 0.32)";
        };
    };
};
/**
 * Spacing scale aligned with Tailwind's default (rem → browser root).
 * Keys match Tailwind numeric spacing: 1 = 0.25rem, 2 = 0.5rem, …
 */
export declare const spacingScale: Record<string, string>;
/**
 * Typography:
 *   sans — Plus Jakarta Sans (UI text, headings, labels, body)
 *   mono — JetBrains Mono (order IDs, API keys, hex values, code)
 *
 * Weight guide (Plus Jakarta Sans):
 *   400 — body text, table cells
 *   500 — product names, nav labels, secondary headings
 *   600 — buttons (font-size 14, letter-spacing -0.005em), form labels, section headers
 *   700 — page titles, KPI numbers
 */
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
    readonly bold: "700";
};
export declare const lineHeight: {
    readonly tight: "1.2";
    readonly snug: "1.3";
    readonly normal: "1.5";
    readonly relaxed: "1.625";
};
export declare const letterSpacing: {
    readonly tight: "-0.01em";
    readonly normal: "0";
    readonly label: "0.06em";
    readonly wide: "0.08em";
};
/**
 * Border-radius scale.
 *
 * Usage guide:
 *   sm   (6px)   — tags, badges, chips, checkboxes
 *   base (8px)   — inputs, buttons, small cards  ← default
 *   md   (10px)  — medium cards, dropdowns
 *   lg   (12px)  — panels, section cards, data tables
 *   xl   (16px)  — modals, dialogs, large containers
 *   pill (999px) — pill badges, avatars, toggles
 */
export declare const radii: {
    readonly none: "0";
    readonly sm: "0.375rem";
    readonly base: "0.5rem";
    readonly md: "0.625rem";
    readonly lg: "0.75rem";
    readonly xl: "1rem";
    readonly pill: "9999px";
};
/**
 * Layered box shadows — warm navy rgba(26,26,46,…), never pure black.
 * Always two layers: ambient (spread) + directional (soft).
 *
 *   sm     — list rows, inputs, base cards
 *   md     — dropdowns, popovers, floating panels
 *   lg     — modals, command palette, sheets
 *   focus  — amber focus ring (3px outer glow)
 */
export declare const shadows: {
    readonly sm: "0 1px 3px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04)";
    readonly md: "0 4px 12px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.05)";
    readonly lg: "0 12px 32px rgba(26, 26, 46, 0.10), 0 4px 8px rgba(26, 26, 46, 0.06)";
    readonly focus: "0 0 0 3px rgba(212, 135, 58, 0.40)";
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
/**
 * Motion tokens — route-level transitions and micro-interactions.
 * All components must respect prefers-reduced-motion.
 */
export declare const motion: {
    readonly duration: {
        readonly instant: "80ms";
        readonly fast: "150ms";
        readonly page: "200ms";
        readonly slow: "300ms";
    };
    readonly easing: {
        /** Standard deceleration for entering elements */
        readonly enter: "cubic-bezier(0.2, 0, 0, 1)";
        /** Standard acceleration for exiting elements */
        readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
        /** Spring-like — for interactive state changes */
        readonly spring: "cubic-bezier(0.34, 1.56, 0.64, 1)";
    };
};
//# sourceMappingURL=batch1.d.ts.map