import { NavLink } from "react-router-dom"

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  const base =
    "block rounded-md px-2 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
  if (isActive) {
    return `${base} bg-surface-raised text-content-primary shadow-sm`
  }
  return `${base} text-content-secondary hover:bg-surface-default hover:text-content-primary`
}

const subNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
  const base =
    "block rounded-md py-1.5 pr-3 pl-8 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
  if (isActive) {
    return `${base} bg-surface-raised text-content-primary shadow-sm`
  }
  return `${base} text-content-secondary hover:bg-surface-default hover:text-content-primary`
}

function NavSectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <p className="mt-4 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-content-tertiary first:mt-0">
      {children}
    </p>
  )
}

/**
 * Primary navigation — Shopify-inspired grouping, token-backed surfaces (no heavy borders).
 */
export function AppSidebar(): JSX.Element {
  return (
    <aside
      className="flex w-56 shrink-0 flex-col bg-surface-subtle md:w-60"
      aria-label="Main navigation"
    >
      <div className="px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
          MercFlow
        </p>
        <p className="text-sm font-semibold text-content-primary">Admin</p>
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4"
        aria-label="Application"
      >
        <NavSectionLabel>Overview</NavSectionLabel>
        <NavLink to="/" className={navLinkClass} end>
          Dashboard
        </NavLink>

        <NavSectionLabel>Commerce</NavSectionLabel>
        <NavLink to="/products" className={navLinkClass}>
          Products
        </NavLink>
        <NavLink to="/orders" className={navLinkClass}>
          Orders
        </NavLink>
        <NavLink to="/customers" className={navLinkClass}>
          Customers
        </NavLink>
        <NavLink to="/categories" className={navLinkClass}>
          Categories
        </NavLink>

        <NavSectionLabel>Content</NavSectionLabel>
        <NavLink to="/content/articles" className={subNavLinkClass}>
          Articles
        </NavLink>
        <NavLink to="/content/pages" className={subNavLinkClass}>
          Pages
        </NavLink>
        <NavLink to="/content/globals" className={subNavLinkClass}>
          Globals
        </NavLink>

        <NavSectionLabel>Settings</NavSectionLabel>
        <NavLink to="/settings/connectors" className={subNavLinkClass}>
          Connectors
        </NavLink>
      </nav>
    </aside>
  )
}
