import { NavLink } from "react-router-dom"

import { PLATFORM_NAV_ITEMS } from "@/config/platformNav"

export function PlatformSidebar(): React.ReactElement {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface-raised">
      <div className="border-b border-border-subtle px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
          MercFlow
        </p>
        <h1 className="text-base font-semibold text-content-primary">
          Platform Console
        </h1>
      </div>

      <nav aria-label="Platform sections" className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {PLATFORM_NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  [
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-sidebarActive text-content-primary"
                      : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
