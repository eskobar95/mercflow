import { NavLink } from "react-router-dom"

import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarNavSection,
} from "@/config/sidebarNav"

type AppSidebarProps = {
  /** Called after navigation (closes mobile drawer). */
  onNavigate?: () => void
}

const navItemClass = ({ isActive }: { isActive: boolean }): string => {
  const base =
    "flex items-center gap-2 rounded-md py-2 pl-3 pr-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
  if (isActive) {
    return `${base} bg-interactive-soft text-content-primary`
  }
  return `${base} text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
}

const subNavItemClass = ({ isActive }: { isActive: boolean }): string => {
  const base =
    "flex items-center gap-2 rounded-md py-1.5 pl-8 pr-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
  if (isActive) {
    return `${base} bg-interactive-soft font-medium text-content-primary`
  }
  return `${base} text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
}

function SidebarNavLink({
  item,
  className,
  onNavigate,
}: {
  item: SidebarNavItem
  className: typeof navItemClass
  onNavigate?: () => void
}): JSX.Element {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={className}
      onClick={onNavigate}
    >
      {item.label}
    </NavLink>
  )
}

function SidebarSection({
  section,
  onNavigate,
}: {
  section: SidebarNavSection
  onNavigate?: () => void
}): JSX.Element {
  return (
    <div className="mt-4">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-label text-content-tertiary">
        {section.label}
      </p>
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <SidebarNavLink
            key={item.to}
            item={item}
            className={subNavItemClass}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Primary navigation for the MercFlow admin shell (Shopify-inspired: light, grouped sections).
 */
export function AppSidebar({ onNavigate }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col border-r border-border-default bg-surface-default"
      aria-label="Main navigation"
    >
      <div className="border-b border-border-subtle px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-label text-content-tertiary">
          MercFlow
        </p>
        <p className="text-sm font-semibold text-content-primary">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto p-3" aria-label="Application">
        <div className="flex flex-col gap-0.5">
          {primarySidebarNav.map((item) => (
            <SidebarNavLink
              key={item.to}
              item={item}
              className={navItemClass}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <SidebarSection section={contentSidebarSection} onNavigate={onNavigate} />
        <SidebarSection section={settingsSidebarSection} onNavigate={onNavigate} />
      </nav>
    </aside>
  )
}
