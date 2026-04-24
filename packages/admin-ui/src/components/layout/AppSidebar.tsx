import { NavLink } from "react-router-dom"

const navItemClass = ({ isActive }: { isActive: boolean }): string => {
  const base =
    "block rounded-md border-l-4 py-2 pr-3 pl-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
  if (isActive) {
    return `${base} border-l-border-focus bg-surface-raised text-content-primary`
  }
  return `${base} border-l-transparent text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
}

/**
 * Primary navigation for the app shell. Expand with product routes in later tasks.
 */
export function AppSidebar(): JSX.Element {
  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-border-default bg-surface-subtle"
      aria-label="Main navigation"
    >
      <div className="border-b border-border-default px-4 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
          MercFlow
        </p>
        <p className="text-sm font-semibold text-content-primary">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Application">
        <NavLink to="/" className={navItemClass} end>
          Home
        </NavLink>
        <NavLink to="/products" className={navItemClass}>
          Products
        </NavLink>
        <NavLink to="/product-categories" className={navItemClass}>
          Product categories
        </NavLink>
        <NavLink to="/list-demo" className={navItemClass}>
          List demo
        </NavLink>
      </nav>
    </aside>
  )
}
