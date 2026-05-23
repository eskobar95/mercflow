import {
  IconArticles,
  IconCategories,
  IconConnectors,
  IconCustomers,
  IconGlobals,
  IconHome,
  IconMore,
  IconOrders,
  IconPages,
  IconProducts,
  IconSettings,
  type IconComponent,
} from "@/components/ui/icons"

export type SidebarNavItem = {
  label: string
  to: string
  /** Inline icon component (monoline SVG). */
  icon: IconComponent
  /** Pass `end` to NavLink so child paths don't bleed active state. */
  end?: boolean
}

export type SidebarNavSection = {
  label: string
  items: SidebarNavItem[]
}

/**
 * Top-level admin destinations — Shopify-style ordering puts overview first,
 * then commerce data, then catalogue.
 */
export const primarySidebarNav: SidebarNavItem[] = [
  { label: "Home", to: "/", end: true, icon: IconHome },
  { label: "Orders", to: "/orders", icon: IconOrders },
  { label: "Products", to: "/products", icon: IconProducts },
  { label: "Customers", to: "/customers", icon: IconCustomers },
  { label: "Categories", to: "/product-categories", icon: IconCategories },
]

export const contentSidebarSection: SidebarNavSection = {
  label: "Content",
  items: [
    { label: "Articles", to: "/content/articles", icon: IconArticles },
    { label: "Pages", to: "/content/pages", icon: IconPages },
    { label: "Globals", to: "/content/globals", icon: IconGlobals },
  ],
}

export const settingsSidebarSection: SidebarNavSection = {
  label: "Settings",
  items: [
    { label: "Connectors", to: "/settings/connectors", icon: IconConnectors },
  ],
}

/** Flat list of all sidebar links for tests and accessibility audits. */
export function getAllSidebarNavItems(): SidebarNavItem[] {
  return [
    ...primarySidebarNav,
    ...contentSidebarSection.items,
    ...settingsSidebarSection.items,
  ]
}

/**
 * Mobile bottom tab bar — 4 slots only (Shopify pattern: Home, Orders,
 * Products, More). "More" is rendered as a sheet trigger by `MobileTabBar`.
 */
export type MobileTabItem =
  | { kind: "link"; label: string; to: string; end?: boolean; icon: IconComponent }
  | { kind: "more"; label: string; icon: IconComponent }

export const mobileTabBar: MobileTabItem[] = [
  { kind: "link", label: "Home", to: "/", end: true, icon: IconHome },
  { kind: "link", label: "Orders", to: "/orders", icon: IconOrders },
  { kind: "link", label: "Products", to: "/products", icon: IconProducts },
  { kind: "more", label: "More", icon: IconMore },
]

/** Single export point for the settings nav icon (used by drawers/empty states). */
export { IconSettings }
