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

/**
 * Shared layout fragment for every nav row. Density mirrors Shopify admin:
 * 36px tall, 18px icon, 13px label, 12px horizontal padding, tight gap.
 */
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
 * Primary navigation for the MercFlow admin shell.
 *
 * Visual language (Shopify-inspired):
 *   - Navy fill (`surface.sidebar` = brand.base) for strong chrome/content
 *     separation against the light app canvas.
 *   - Cream-on-navy labels (`content.onSidebar`) with muted icon stroke;
 *     amber-wash active row + left rail + amber-light label/icon.
 *   - Section headers are tight uppercase 11px in muted cream.
 *
 * Brand mark sits in a 28px amber square with cream "M" — the single
 * brand-color affordance in the sidebar, mirroring how Shopify uses its
 * green shopping bag mark on the dark rail.
 */
export function AppSidebar({ onNavigate }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-[15rem] shrink-0 flex-col bg-surface-sidebar"
      aria-label="Main navigation"
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md bg-amber text-[#1A1A2E] shadow-sm"
          aria-hidden
        >
          <span className="text-[13px] font-bold leading-none">M</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content-onSidebar">
            MercFlow
          </p>
          <p className="truncate text-2xs font-medium uppercase tracking-label text-content-onSidebarMuted">
            Admin
          </p>
        </div>
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
