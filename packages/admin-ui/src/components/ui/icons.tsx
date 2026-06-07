import type { ReactNode, SVGProps } from "react"

/**
 * Monoline icon system for MercFlow admin chrome.
 *
 * Each icon is a hand-tuned 24px viewBox, stroke-only SVG that inherits
 * `currentColor` so it picks up navy, cream, amber, etc. from the active
 * surface. Strokes are 1.75 with round caps/joins to match the Shopify-
 * inspired sidebar typography weight without feeling chunky.
 *
 * Use these instead of pulling in lucide-react: the surface is small enough
 * that we avoid the dep, and consistency between sidebar + tab bar matters.
 */
type IconProps = SVGProps<SVGSVGElement> & {
  /** Visual size in px — width === height. Defaults to 18 (sidebar density). */
  size?: number
}

function baseProps(size: number, rest: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: false,
    ...rest,
  }
}

export function IconHome({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

export function IconProducts({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z" />
      <path d="M4 7.5 12 11l8-3.5" />
      <path d="M12 11v9" />
    </svg>
  )
}

export function IconOrders({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
      <path d="M9 9h6" />
      <path d="M9 12.5h6" />
      <path d="M9 16h4" />
    </svg>
  )
}

/** Repeat / subscription cycles — radial arrows. */
export function IconSubscriptions({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M7 8h7a5 5 0 1 1-4.5 9" />
      <path d="M7 8V5.5m0 2.5-2.75-3" />
      <path d="M17 16h-7a5 5 0 1 1 4.5-9" />
      <path d="M17 16v2.5m0-2.5 2.75 3" />
    </svg>
  )
}

export function IconCustomers({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c.6-2.8 2.9-4.5 5.5-4.5s4.9 1.7 5.5 4.5" />
      <path d="M15 4.5a3.25 3.25 0 0 1 0 6.5" />
      <path d="M17 14.5c1.9.4 3.4 1.9 3.5 4.5" />
    </svg>
  )
}

export function IconCategories({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="m12 3.5 8 4.5-8 4.5-8-4.5z" />
      <path d="m4 12 8 4.5L20 12" />
      <path d="m4 16 8 4.5L20 16" />
    </svg>
  )
}

export function IconArticles({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M5.5 3.5h10L19 7v13.5H5.5z" />
      <path d="M15 3.5V7h4" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14h7" />
      <path d="M8.5 17h5" />
    </svg>
  )
}

export function IconPages({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16" />
      <path d="M9 9v11" />
    </svg>
  )
}

export function IconGlobals({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5" />
      <path d="M12 3.75c2.4 2.5 3.5 5.3 3.5 8.25s-1.1 5.75-3.5 8.25c-2.4-2.5-3.5-5.3-3.5-8.25S9.6 6.25 12 3.75z" />
    </svg>
  )
}

export function IconConnectors({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M9 3.5v3.5" />
      <path d="M15 3.5v3.5" />
      <path d="M6.5 7h11v3a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 15.5v5" />
    </svg>
  )
}

export function IconSettings({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19.5 12a7.6 7.6 0 0 0-.1-1.3l1.7-1.3-1.5-2.6-2 .8a7.5 7.5 0 0 0-2.2-1.3l-.3-2.1h-3l-.3 2.1a7.5 7.5 0 0 0-2.2 1.3l-2-.8L5.9 9.4l1.7 1.3a7.6 7.6 0 0 0 0 2.6L5.9 14.6l1.5 2.6 2-.8a7.5 7.5 0 0 0 2.2 1.3l.3 2.1h3l.3-2.1a7.5 7.5 0 0 0 2.2-1.3l2 .8 1.5-2.6-1.7-1.3a7.6 7.6 0 0 0 .1-1.3z" />
    </svg>
  )
}

export function IconSearch({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="m15 15 4.5 4.5" />
    </svg>
  )
}

/** Funnel — list filter control. */
export function IconFilter({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M4 6h16l-6.3 7.4v4.3l-3.4 1.8v-6.1z" />
    </svg>
  )
}

/** Plus — create / add affordances. */
export function IconPlus({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconArrowRight({ size = 16, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function IconArrowUpRight({ size = 14, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

/** Chevron pointing down — select triggers and expandable panels. */
export function IconChevronDown({ size = 14, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** Check mark — checkbox and select item indicators. */
export function IconCheck({ size = 14, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/** Chevron used for expandable parent nav items. Rotates 90° when open. */
export function IconChevronRight({ size = 14, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/** Chevron pointing left — used for "back" affordances on the mobile sheet. */
export function IconChevronLeft({ size = 14, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

/** Content section tile — layered stack metaphor. */
export function IconContent({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <rect x="3" y="6.5" width="14" height="13" rx="2" />
      <path d="M7 4h12a2 2 0 0 1 2 2v11" />
    </svg>
  )
}

/** Workspace / team / company icon (rounded square + person). */
export function IconWorkspace({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 13.5a3 3 0 0 1 8 0" />
      <circle cx="12" cy="9.5" r="2" />
    </svg>
  )
}

/** People / team icon — two figures. */
export function IconTeam({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="8" r="2.25" />
      <path d="M15.5 17h5.5a4 4 0 0 0-5.5-3.7" />
    </svg>
  )
}

/** Billing / credit card icon. */
export function IconBilling({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  )
}

/** X / close — used by the mobile nav sheet header. */
export function IconClose({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

/** Catalogue (squares grid) — used as a Products sub-item icon. */
export function IconCatalogue({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

/** Inventory overview — stacked boxes. */
export function IconInventory({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="M12 12v8" />
      <path d="m4 8.5 8 4.5 8-4.5" />
    </svg>
  )
}

/** Supplier register — building. */
export function IconSuppliers({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M5 20V6l7-3 7 3v14" />
      <path d="M9 10h2v2H9zM13 10h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2z" />
      <path d="M5 20h14" />
    </svg>
  )
}

/** Purchase orders — clipboard list. */
export function IconPurchaseOrders({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Z" />
      <path d="M10 4v3h4V4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  )
}

/** Google Shopping / product feed — broadcast waves. */
export function IconFeed({ size = 18, ...rest }: IconProps): ReactNode {
  return (
    <svg {...baseProps(size, rest)}>
      <path d="M4 11a8 8 0 0 1 16 0" />
      <path d="M12 4v2.5" />
      <path d="M8 18h8" />
      <path d="M9.5 15h5" />
    </svg>
  )
}

export type IconComponent = (props: IconProps) => ReactNode
