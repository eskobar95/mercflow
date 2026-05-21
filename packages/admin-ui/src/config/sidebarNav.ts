export type SidebarNavItem = {
  label: string
  to: string
  end?: boolean
}

export type SidebarNavSection = {
  label: string
  items: SidebarNavItem[]
}

export const primarySidebarNav: SidebarNavItem[] = [
  { label: "Products", to: "/products" },
  { label: "Orders", to: "/orders" },
  { label: "Customers", to: "/customers" },
  { label: "Categories", to: "/product-categories" },
]

export const contentSidebarSection: SidebarNavSection = {
  label: "Content",
  items: [
    { label: "Articles", to: "/content/articles" },
    { label: "Pages", to: "/content/pages" },
    { label: "Globals", to: "/content/globals" },
  ],
}

export const settingsSidebarSection: SidebarNavSection = {
  label: "Settings",
  items: [{ label: "Connectors", to: "/settings/connectors" }],
}

/** Flat list of all sidebar links for tests and accessibility audits. */
export function getAllSidebarNavItems(): SidebarNavItem[] {
  return [
    ...primarySidebarNav,
    ...contentSidebarSection.items,
    ...settingsSidebarSection.items,
  ]
}
