import {
  IconArticles,
  IconBilling,
  IconCatalogue,
  IconCustomData,
  IconCategories,
  IconConnectors,
  IconCustomers,
  IconEmail,
  IconFeed,
  IconGlobals,
  IconInventory,
  IconPurchaseOrders,
  IconSuppliers,
  IconHome,
  IconOrders,
  IconPackaging,
  IconPages,
  IconProducts,
  IconSettings,
  IconSubscriptions,
  IconTeam,
  IconWorkspace,
  type IconComponent,
} from "@/components/ui/icons"
import { SETTINGS_PATHS } from "@/config/settingsSections"

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
  {
    label: "Customers",
    to: "/customers",
    icon: IconCustomers,
    subItems: [
      { label: "Customers", to: "/customers", end: true, icon: IconCustomers },
      { label: "Subscriptions", to: "/subscriptions", icon: IconSubscriptions },
    ],
  },
]

export const feedSidebarSection: SidebarNavSection = {
  label: "Feed",
  items: [{ label: "Overview", to: "/feed", end: true, icon: IconFeed }],
}

export const inventorySidebarSection: SidebarNavSection = {
  label: "Inventory",
  items: [
    { label: "Overview", to: "/inventory", end: true, icon: IconInventory },
    {
      label: "Purchase orders",
      to: "/inventory/purchase-orders",
      icon: IconPurchaseOrders,
    },
    { label: "Suppliers", to: "/inventory/suppliers", icon: IconSuppliers },
  ],
}

export const contentSidebarSection: SidebarNavSection = {
  label: "Content",
  items: [
    { label: "Articles", to: "/content/articles", icon: IconArticles },
    { label: "Pages", to: "/content/pages", icon: IconPages },
    { label: "Globals", to: "/content/globals", icon: IconGlobals },
  ],
}

const seoSettingsSubItems: SidebarSubItem[] = [
  { label: "Organisation", to: "/settings/seo/organisation", icon: IconGlobals },
  { label: "Structured data", to: "/settings/seo/structured-data", icon: IconGlobals },
  { label: "Slugs", to: "/settings/seo/slug", icon: IconGlobals },
  { label: "Redirects", to: "/settings/seo/redirects", icon: IconGlobals },
  { label: "Sitemap", to: "/settings/seo/sitemap", icon: IconGlobals },
  { label: "Robots.txt", to: "/settings/seo/robots", icon: IconGlobals },
]

/**
 * Settings sub-navigation — nested groups for Shipping and SEO (M013).
 * Landing page lives at `/settings`; each domain has a dedicated route.
 */
export const settingsSidebarSection: SidebarNavSection = {
  label: "Settings",
  items: [
    { label: "Overview", to: SETTINGS_PATHS.root, end: true, icon: IconSettings },
    { label: "General", to: SETTINGS_PATHS.general, icon: IconSettings },
    {
      label: "Communications",
      to: SETTINGS_PATHS.email,
      icon: IconEmail,
      subItems: [
        { label: "Email", to: SETTINGS_PATHS.email, end: true, icon: IconEmail },
      ],
    },
    {
      label: "Shipping",
      to: SETTINGS_PATHS.shippingPackaging,
      icon: IconPackaging,
      subItems: [
        {
          label: "Packaging",
          to: SETTINGS_PATHS.shippingPackaging,
          end: true,
          icon: IconPackaging,
        },
        {
          label: "Carriers",
          to: SETTINGS_PATHS.shippingCarriers,
          icon: IconConnectors,
        },
      ],
    },
    { label: "Payments", to: SETTINGS_PATHS.payments, icon: IconBilling },
    { label: "Subscriptions", to: SETTINGS_PATHS.subscriptions, icon: IconSubscriptions },
    { label: "Custom data", to: SETTINGS_PATHS.customData, icon: IconCustomData },
    {
      label: "SEO",
      to: SETTINGS_PATHS.seo,
      icon: IconGlobals,
      subItems: seoSettingsSubItems,
    },
    { label: "Integrations", to: SETTINGS_PATHS.integrations, icon: IconConnectors },
    { label: "Store details", to: SETTINGS_PATHS.storeDetails, icon: IconWorkspace },
    { label: "Team", to: "/settings/team", icon: IconTeam },
    { label: "Billing", to: "/settings/billing", icon: IconBilling },
  ],
}

/**
 * Mobile bottom tab bar — 4 direct destinations. The fifth "More" affordance
 * lives in the topbar as the brand avatar (see `TopBar`), so every slot here
 * is a real route the user can land on. Order mirrors `primarySidebarNav`
 * for muscle-memory parity between desktop and mobile.
 */
type MobileTabItem = {
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

