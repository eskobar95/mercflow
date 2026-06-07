/**
 * Batch 1 design token source values.
 *
 * Direction (Refero reference lock): "ink on paper" admin.
 *   - Depth comes from a cool neutral ramp + hairline borders, never diffuse shadow
 *     (Linear's depth philosophy expressed in a light shadcn/Audyr monochrome system).
 *   - Primary actions are near-black ink (Asana / Linear / shadcn), NOT a colored fill.
 *   - A single restrained blue accent is reserved for focus, selection, links, and info.
 *     It is never used as a large background wash.
 *
 * All sRGB color literals for the admin UI must originate here (or in this package only).
 */
/**
 * Neutral ramp — single source of truth for every grey in the admin.
 * Slightly cool cast so the UI reads crisp and modern rather than warm/office-beige.
 * Surfaces, borders, and text are all derived from this ramp below.
 */
const neutral = {
    /** Pure white — card / popover surfaces */
    0: "#ffffff",
    25: "#fbfcfd",
    /** App canvas */
    50: "#f6f8fa",
    100: "#eef1f5",
    /** Subtle fills, table stripes, muted controls */
    150: "#e7ebf0",
    /** Default hairline border */
    200: "#e1e6eb",
    300: "#d2d8df",
    400: "#aab2bd",
    /** Tertiary text / placeholders */
    500: "#7a828d",
    /** Secondary text */
    600: "#5a626d",
    700: "#3e444d",
    800: "#272b31",
    /** Ink — primary text + primary action fill */
    900: "#181b20",
    950: "#0f1114",
};
export const colorTree = {
    neutral,
    surface: {
        /** Application canvas / page background */
        canvas: neutral[50],
        /** Same as canvas; semantic alias for MercFlow shell */
        appCanvas: neutral[50],
        /** Primary panels, cards, popovers (raised surfaces) */
        default: neutral[0],
        /** Same as default; semantic alias for card surfaces inside the shell */
        appCard: neutral[0],
        /** Secondary panels, table stripes */
        subtle: neutral[50],
        /** Disabled inputs, low-emphasis areas */
        muted: neutral[100],
        /** Same as default; raised surfaces (overlays) pair with shadow-md */
        raised: neutral[0],
        /** Scrim for modal overlays (light theme) */
        overlay: "rgba(15, 17, 20, 0.40)",
        /** Sidebar background (light rail — active item is a white pill) */
        sidebar: neutral[100],
        /** Sidebar row hover wash */
        sidebarHover: neutral[150],
        /** Active sidebar item surface */
        sidebarActive: neutral[0],
    },
    content: {
        primary: neutral[900],
        secondary: neutral[600],
        tertiary: neutral[500],
        placeholder: neutral[400],
        /** Text on primary / danger fill buttons */
        inverse: neutral[0],
        /** Non-interactive de-emphasis */
        disabled: neutral[400],
        /** Links and critical inline messaging */
        danger: "#c0392b",
        /** Text on sidebar default state */
        onSidebar: neutral[700],
        onSidebarMuted: neutral[500],
        onSidebarActive: neutral[900],
    },
    border: {
        default: neutral[200],
        subtle: neutral[100],
        /** Hover / emphasized hairline */
        strong: neutral[300],
        focus: "#2b5cd9",
        /** Divider between sidebar / top chrome and main canvas */
        app: neutral[200],
        /** Hairline separators on the sidebar rail */
        onSidebar: neutral[200],
    },
    /** Brand primitives (MercFlow ink base + single accent cue) */
    brand: {
        base: neutral[900],
        accent: "#2b5cd9",
        cream: neutral[50],
    },
    /**
     * Accent — single restrained blue. Role: focus ring, selected/active state,
     * links, and informational highlights. Never a large background fill.
     */
    accent: {
        default: "#2b5cd9",
        subtle: "#eef2fd",
        soft: "#dbe4fb",
        strong: "#1f47ad",
        /** Text readable on accent-subtle fills */
        text: "#1b3e96",
    },
    interactive: {
        /** Primary actions — ink fill (the signature "no blue button" move). */
        primary: {
            default: neutral[900],
            hover: neutral[800],
            pressed: neutral[950],
            /** Ghost / low-emphasis control backgrounds */
            subtle: neutral[100],
        },
        /** Soft tonal controls (muted fills) */
        soft: {
            default: neutral[100],
            hover: neutral[150],
            border: neutral[300],
            label: neutral[700],
        },
        /** Neutral secondary buttons */
        secondary: {
            default: neutral[0],
            hover: neutral[50],
        },
        /** Destructive actions (paired with Tailwind interactive-destructive-*) */
        destructive: {
            default: "#c0392b",
            hover: "#9c2a1f",
            /** Low-emphasis danger surfaces */
            subtle: "#fcecea",
            border: "#eab4ad",
            label: "#8a261c",
        },
        /** Focus affordance; pair with focus outline styles in admin-ui */
        focus: {
            ring: "#2b5cd9",
        },
        disabled: {
            background: neutral[100],
            text: neutral[400],
            border: neutral[200],
        },
    },
    feedback: {
        success: {
            default: "#0a7a55",
            subtle: "#e7f5ef",
            content: "#0a4a36",
            border: "#9ad0bb",
        },
        warning: {
            default: "#b07400",
            subtle: "#fcf2d9",
            content: "#5a4410",
            border: "#eccf7d",
        },
        danger: {
            default: "#c0392b",
            subtle: "#fcecea",
            content: "#7a221a",
            border: "#e6a79f",
        },
        info: {
            default: "#2b5cd9",
            subtle: "#eef2fd",
            content: "#1b3e96",
            border: "#a9bdee",
        },
        /** Amber-adjacent “attention” tone for on-hold / pending badges (distinct from warning). */
        pending: {
            default: "#EA580C",
            subtle: "rgba(234, 88, 12, 0.12)",
            content: "#9A3412",
            border: "rgba(234, 88, 12, 0.30)",
        },
    },
    /**
     * Connector / integration status badges (admin Settings → Connectors).
     */
    connectorStatus: {
        active: {
            bg: "#e3f4ea",
            border: "#94d0b1",
            text: "#0f5132",
        },
        inactive: {
            bg: "#f1f1f1",
            border: "#e1e3e5",
            text: "#6d7175",
        },
        unconfigured: {
            bg: "#fff5d9",
            border: "#f0d878",
            text: "#5c4f1a",
        },
    },
};
/**
 * Spacing scale aligned with Tailwind’s default (rem → browser root).
 * Keys match Tailwind numeric spacing: 1 = 0.25rem, 2 = 0.5rem, …
 */
export const spacingScale = {
    "0": "0",
    "px": "1px",
    "0.5": "0.125rem",
    "1": "0.25rem",
    "1.5": "0.375rem",
    "2": "0.5rem",
    "2.5": "0.625rem",
    "3": "0.75rem",
    "3.5": "0.875rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "7": "1.75rem",
    "8": "2rem",
    "9": "2.25rem",
    "10": "2.5rem",
    "11": "2.75rem",
    "12": "3rem",
    "14": "3.5rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem",
    "32": "8rem",
};
export const fontFamily = {
    sans: [
        "Inter",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
    ].join(", "),
    mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
    ].join(", "),
};
export const fontSize = {
    "3xs": "0.5625rem",
    "2xs": "0.6875rem",
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.875rem",
    /** Sidebar + compact UI rails (paired with Shopify-style compact density) */
    interface: "0.8125rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.75rem",
    "4xl": "2rem",
    "5xl": "2.25rem",
};
export const fontWeight = {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
};
export const lineHeight = {
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
};
export const letterSpacing = {
    /** Display / large headings — tight, confident (Linear / Audyr trait) */
    tighter: "-0.022em",
    tight: "-0.011em",
    normal: "0",
    /** Caps / micro-metadata above lists */
    label: "0.06em",
    wide: "0.02em",
};
export const radii = {
    none: "0",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
};
/**
 * Elevation — intentionally near-flat. Depth in this admin comes from the neutral
 * ramp + hairline borders, not diffuse shadow.
 *
 *   sm  — content surfaces (cards/tiles). Barely-there; rely on the border.
 *   md  — transient floats only (dropdowns, popovers, toasts): one soft layer.
 *   lg  — modals / sheets: a slightly deeper single layer.
 *   focus — accent ring for keyboard focus.
 */
export const shadows = {
    sm: "0 1px 2px -1px rgba(15, 17, 20, 0.05)",
    md: "0 6px 16px -6px rgba(15, 17, 20, 0.12), 0 0 0 1px rgba(15, 17, 20, 0.05)",
    lg: "0 16px 40px -12px rgba(15, 17, 20, 0.18), 0 0 0 1px rgba(15, 17, 20, 0.05)",
    focus: "0 0 0 3px rgba(43, 92, 217, 0.28)",
};
export const zIndex = {
    base: "0",
    /** Sticky page chrome (top bar, table footers) — below floating menus. */
    sticky: "1020",
    /** Dropdown menus — must sit above sticky chrome when opened from the TopBar. */
    dropdown: "1030",
    modalBackdrop: "1040",
    modal: "1050",
    popover: "1060",
    toast: "1080",
};
/**
 * Motion tokens for route-level transitions and future UI motion (admin shell).
 * Durations are explicit `ms` strings for `animation` / `transition` declarations.
 */
export const motion = {
    duration: {
        /** Default enter timing for main route outlet content */
        page: "190ms",
        /** Micro-interactions (hover, press, color) */
        fast: "140ms",
        /** Drawers / sheets / larger surfaces */
        slow: "280ms",
    },
    easing: {
        /** Strong ease-out — enter timing (responsive, instant first frame) */
        page: "cubic-bezier(0.23, 1, 0.32, 1)",
        /** Alias referenced by `@mercflow/admin-ui/index.css` */
        enter: "cubic-bezier(0.23, 1, 0.32, 1)",
        /** Snappy exit */
        exit: "cubic-bezier(0.4, 0, 1, 1)",
        /** On-screen movement / morph */
        standard: "cubic-bezier(0.77, 0, 0.175, 1)",
        /** iOS drawer curve for slide-in panels */
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
};
/** Fixed layout dimensions for list surfaces and compact filter chips. */
export const layout = {
    listTableMinWidth: "600px",
    filterChipMaxWidth: "11rem",
};
