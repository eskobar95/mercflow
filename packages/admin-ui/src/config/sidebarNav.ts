import {
  IconArticles,
  IconBilling,
  IconCatalogue,
  IconCategories,
  IconConnectors,
  IconCustomers,
  IconFeed,
  IconGlobals,
  IconHome,
  IconOrders,
  IconPages,
  IconProducts,
  IconSettings,
  IconSubscriptions,
  IconTeam,
  IconWorkspace,
  type IconComponent,
} from "@/components/ui/icons"

export type SidebarNavItem = {
  label: string
  to: string
  /** Inline icon component (monoline SVG). */
  icon: IconComponent
  /** Pass `end` to NavLink so child paths don't bleed active state. */
  end?: boolean
  /**
   * Optional nested sub-items. When present, the parent renders as an
   * expandable group in the sidebar (Linear pattern) and as a multi-row
   * card in the mobile sheet (iOS Settings pattern).
   *
   * The parent's own `to` route is reachable via the first sub-item
   * (typically labelled like "Overview" or "Catalogue"). Avoid linking
   * the parent itself separately — that creates two affordances for the
   * same destination.
   */
  subItems?: SidebarSubItem[]
}

/**
 * Sub-items omit their own icon by default — they're rendered as a tighter
 * second-level list with a dotted/indent guide and smaller type. They can
 * still opt into an icon for the mobile sheet (where every row has one).
 */
export type SidebarSubItem = {
  label: string
  to: string
  end?: boolean
  /** Optional icon — used on the mobile sheet where every row carries one. */
  icon?: IconComponent
}

export type SidebarNavSection = {
  label: string
  items: SidebarNavItem[]
}

/**
 * Top-level admin destinations. Order matches the operator's daily journey:
 *   Home (overview) → Orders (today's work) → Products (catalogue
 *   maintenance) → Customers (support / segments).
 *
 * Products is an expandable group (Catalogue + Categories). Categories used
 * to be a top-level item but lives more naturally under Products — fewer
 * top-level entries, clearer mental model for non-tech operators.
 */
export const primarySidebarNav: SidebarNavItem[] = [
  { label: "Home", to: "/", end: true, icon: IconHome },
  { label: "Orders", to: "/orders", icon: IconOrders },
  {
    label: "Products",
    to: "/products",
    icon: IconProducts,
    subItems: [
      { label: "Catalogue", to: "/products", end: true, icon: IconCatalogue },
      { label: "Categories", to: "/product-categories", icon: IconCategories },
    ],
  },
  { label: "Customers", to: "/customers", icon: IconCustomers },
  { label: "Subscriptions", to: "/subscriptions", icon: IconSubscriptions },
]

export const feedSidebarSection: SidebarNavSection = {
  label: "Feed",
  items: [{ label: "Overview", to: "/feed", end: true, icon: IconFeed }],
}

export const contentSidebarSection: SidebarNavSection = {
  label: "Content",
  items: [
    { label: "Articles", to: "/content/articles", icon: IconArticles },
    { label: "Pages", to: "/content/pages", icon: IconPages },
    { label: "Globals", to: "/content/globals", icon: IconGlobals },
  ],
}

/**
 * Settings is now a fleshed-out section with the destinations a workspace
 * owner reaches most often: general workspace config, integrations,
 * teammates and billing. Workspace / Team / Billing route to placeholder
 * pages until those features land.
 */
export const settingsSidebarSection: SidebarNavSection = {
  label: "Settings",
  items: [
    { label: "General", to: "/settings", end: true, icon: IconSettings },
    { label: "SEO — Slugs", to: "/settings/seo/slug", icon: IconSettings },
    { label: "SEO — Redirects", to: "/settings/seo/redirects", icon: IconSettings },
    { label: "SEO — Sitemap", to: "/settings/seo/sitemap", icon: IconSettings },
    { label: "SEO — Robots.txt", to: "/settings/seo/robots", icon: IconSettings },
    { label: "Connectors", to: "/settings/connectors", icon: IconConnectors },
    { label: "Workspace", to: "/settings/workspace", icon: IconWorkspace },
    { label: "Team", to: "/settings/team", icon: IconTeam },
    { label: "Billing", to: "/settings/billing", icon: IconBilling },
  ],
}

/** Flat list of all destinations — used by tests, search index, sitemap. */
export function getAllSidebarNavItems(): SidebarNavItem[] {
  return [
    ...primarySidebarNav,
    ...feedSidebarSection.items,
    ...contentSidebarSection.items,
    ...settingsSidebarSection.items,
  ]
}

/**
 * Mobile bottom tab bar — 4 direct destinations. The fifth "More" affordance
 * lives in the topbar as the brand avatar (see `TopBar`), so every slot here
 * is a real route the user can land on. Order mirrors `primarySidebarNav`
 * for muscle-memory parity between desktop and mobile.
 */
export type MobileTabItem = {
  label: string
  to: string
  end?: boolean
  icon: IconComponent
}

export const mobileTabBar: MobileTabItem[] = [
  { label: "Home", to: "/", end: true, icon: IconHome },
  { label: "Orders", to: "/orders", icon: IconOrders },
  { label: "Products", to: "/products", icon: IconProducts },
  { label: "Customers", to: "/customers", icon: IconCustomers },
]

export { IconSettings }
