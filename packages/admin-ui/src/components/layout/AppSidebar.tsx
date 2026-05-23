import { NavLink } from "react-router-dom"

import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarNavSection,
} from "@/config/sidebarNav"

type AppSidebarProps = {
  onNavigate?: () => void
  onClose?: () => void
}

/**
 * App navigation rail — Asana / Mercury synthesis.
 *
 * Visual language:
 *   - #131316 near-black background (Asana). Pure chrome — not branded.
 *   - Off-white labels (85% opacity); selected row is a neutral light-grey
 *     wash (8% white), NOT a colored highlight. Color is reserved for action.
 *   - Compact 36px rows, 18px monoline icons.
 *   - Section labels are tiny uppercase 11px at 55% opacity.
 *   - Brand mark: 28px rounded square — white "M" on accent blue.
 *
 * Desktop: 240px fixed. Mobile: full width inside a fullscreen sheet.
 */

const itemBase =
  "group/nav relative flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"

function itemClass({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${itemBase} bg-surface-sidebarActive text-content-onSidebarActive`
  }
  return `${itemBase} text-content-onSidebar hover:bg-surface-sidebarHover`
}

function NavItem({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate?: () => void
}): JSX.Element {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={itemClass} onClick={onNavigate}>
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={
              isActive
                ? "shrink-0 text-content-onSidebarActive"
                : "shrink-0 text-content-onSidebarMuted transition-colors group-hover/nav:text-content-onSidebar"
            }
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function Section({
  section,
  onNavigate,
}: {
  section: SidebarNavSection
  onNavigate?: () => void
}): JSX.Element {
  return (
    <div className="mt-6">
      <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-label text-content-onSidebarMuted">
        {section.label}
      </p>
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

export function AppSidebar({ onNavigate, onClose }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-full shrink-0 flex-col bg-surface-sidebar md:w-60"
      aria-label="Main navigation"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4 md:h-16">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber text-content-inverse shadow-sm"
          aria-hidden
        >
          <span className="text-[13px] font-bold leading-none">M</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-onSidebar">
            MercFlow
          </p>
          <p className="truncate text-[11px] font-medium text-content-onSidebarMuted">
            Workspace
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Luk menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-content-onSidebarMuted transition-colors duration-150 hover:bg-surface-sidebarHover hover:text-content-onSidebar active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
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
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <Section section={contentSidebarSection} onNavigate={onNavigate} />
        <Section section={settingsSidebarSection} onNavigate={onNavigate} />
      </nav>
    </aside>
  )
}
