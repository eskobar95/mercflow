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

const baseItemClass =
  "flex items-center gap-2.5 rounded-md text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"

const navItemClass = ({ isActive }: { isActive: boolean }): string => {
  const layout = `${baseItemClass} px-3 py-1.5`
  if (isActive) {
    return `${layout} bg-interactive-soft font-medium text-amber-text`
  }
  return `${layout} text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
}

const subNavItemClass = ({ isActive }: { isActive: boolean }): string => {
  const layout = `${baseItemClass} pl-9 pr-3 py-1.5`
  if (isActive) {
    return `${layout} bg-interactive-soft font-medium text-amber-text`
  }
  return `${layout} text-content-secondary hover:bg-surface-subtle hover:text-content-primary`
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
    <div className="mt-5">
      <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-label text-content-tertiary">
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
 * Primary navigation for the MercFlow admin shell.
 * Vellum-editorial chrome (Claude) with compact sidebar density (Perplexity)
 * and amber-only accent discipline (Harvest / Brand Kit).
 */
export function AppSidebar({ onNavigate }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-[15rem] shrink-0 flex-col border-r border-border-subtle bg-surface-subtle"
      aria-label="Main navigation"
    >
      <div className="flex h-16 shrink-0 items-center gap-2 px-4">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md bg-interactive-primary text-content-inverse"
          aria-hidden
        >
          <span className="text-xs font-semibold tracking-tight">M</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content-primary">
            MercFlow
          </p>
          <p className="truncate text-2xs font-medium uppercase tracking-label text-content-tertiary">
            Admin
          </p>
        </div>
      </div>
      <nav
        className="flex flex-1 flex-col overflow-y-auto px-3 pb-4"
        aria-label="Application"
      >
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
