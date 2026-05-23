import { NavLink } from "react-router-dom"

import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarNavSection,
} from "@/config/sidebarNav"

type AppSidebarProps = {
  /** Called after navigation (closes mobile sheet). */
  onNavigate?: () => void
  /**
   * When provided, renders an X close button in the sidebar header.
   * Used by the mobile fullscreen sheet so the user can dismiss without
   * having to reach the bottom tab bar.
   */
  onClose?: () => void
}

const baseItemClass =
  "group/nav-item relative flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"

function navItemClass({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${baseItemClass} bg-surface-sidebarActive text-content-onSidebarActive`
  }
  return `${baseItemClass} text-content-onSidebar hover:bg-surface-sidebarHover hover:text-content-onSidebar`
}

function SidebarNavLink({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate?: () => void
}): JSX.Element {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={navItemClass}
      onClick={onNavigate}
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-amber"
            />
          ) : null}
          <Icon
            size={18}
            className={
              isActive
                ? "shrink-0 text-content-onSidebarActive"
                : "shrink-0 text-content-onSidebarMuted transition-colors group-hover/nav-item:text-content-onSidebar"
            }
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
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
    <div className="mt-6">
      <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-label text-content-onSidebarMuted">
        {section.label}
      </p>
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <SidebarNavLink
            key={item.to}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Primary navigation rail for the MercFlow admin shell.
 *
 * Desktop: fixed 240px wide navy rail.
 * Mobile: rendered inside a fullscreen sheet — `onClose` triggers when the
 * X button in the header is tapped, `onNavigate` closes the sheet on link tap.
 */
export function AppSidebar({ onNavigate, onClose }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-full shrink-0 flex-col bg-surface-sidebar md:w-[15rem]"
      aria-label="Main navigation"
    >
      {/* Header: logo + optional close button (mobile only) */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4 md:h-16">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber text-[#1A1A2E] shadow-sm"
          aria-hidden
        >
          <span className="text-[13px] font-bold leading-none">M</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-onSidebar">
            MercFlow
          </p>
          <p className="truncate text-2xs font-medium uppercase tracking-label text-content-onSidebarMuted">
            Admin
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Luk menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-content-onSidebarMuted transition-colors hover:bg-surface-sidebarHover hover:text-content-onSidebar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav
        className="flex flex-1 flex-col overflow-y-auto px-3 pb-6"
        aria-label="Application"
      >
        <div className="flex flex-col gap-0.5">
          {primarySidebarNav.map((item) => (
            <SidebarNavLink
              key={item.to}
              item={item}
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
