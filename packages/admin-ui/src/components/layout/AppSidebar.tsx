import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useResolvedPath } from "react-router-dom"

import { BrandAvatar } from "@/components/ui/BrandAvatar"
import { IconChevronRight } from "@/components/ui/icons"
import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
  type SidebarNavSection,
  type SidebarSubItem,
} from "@/config/sidebarNav"

type AppSidebarProps = {
  onNavigate?: () => void
}

/**
 * Desktop navigation rail — Asana surface + Linear nested groups.
 *
 *   - Background: #131316 near-black (Asana). Pure chrome, not branded.
 *   - Leaf items: 36px rows, 18px monoline icons, off-white labels.
 *   - Parent groups with sub-items: chevron-right that rotates 90° on
 *     expand. Sub-items live on a smooth grid-rows transition (no JS
 *     height calc, no layout thrash, fully interruptible).
 *   - Active sub-item keeps its parent visually grouped via a thin vertical
 *     guide rail on the left of the nested list.
 *
 * Used on desktop (≥ md). Mobile uses the dedicated `MobileNavSheet`.
 */

const itemBase =
  "group/nav relative flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"

function leafClass({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${itemBase} bg-surface-sidebarActive text-content-onSidebarActive`
  }
  return `${itemBase} text-content-onSidebar hover:bg-surface-sidebarHover`
}

function LeafItem({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate?: () => void
}): JSX.Element {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={leafClass} onClick={onNavigate}>
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

/**
 * Expandable parent — renders a button row + a grid-rows-collapsible
 * sub-list below. Auto-expands when one of its sub-items matches the
 * current route, so deep links never land inside a collapsed group.
 */
function ExpandableItem({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate?: () => void
}): JSX.Element {
  const subItems = item.subItems ?? []
  const location = useLocation()
  const parentPath = useResolvedPath(item.to)
  const hasActiveChild = subItems.some((sub) => {
    const subPath = sub.to
    if (sub.end) return location.pathname === subPath
    return (
      location.pathname === subPath ||
      location.pathname.startsWith(`${subPath}/`)
    )
  })
  const isParentRouteActive =
    location.pathname === parentPath.pathname ||
    location.pathname.startsWith(`${parentPath.pathname}/`)

  const [open, setOpen] = useState<boolean>(hasActiveChild || isParentRouteActive)

  // Auto-expand only on the *transition* from outside → inside this group
  // (e.g. clicking a top-level link that lands on a child). Once the user
  // manually toggles the chevron we respect their state; we don't keep
  // re-opening just because a child route is still active — that would
  // make the parent feel "locked" while you're inside it.
  const wasInsideRef = useRef<boolean>(hasActiveChild || isParentRouteActive)
  useEffect(() => {
    const isInside = hasActiveChild || isParentRouteActive
    if (isInside && !wasInsideRef.current) {
      setOpen(true)
    }
    wasInsideRef.current = isInside
  }, [hasActiveChild, isParentRouteActive])

  const Icon = item.icon

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={[
          itemBase,
          "w-full justify-between",
          hasActiveChild
            ? "text-content-onSidebar"
            : "text-content-onSidebar hover:bg-surface-sidebarHover",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon
            size={18}
            className={
              hasActiveChild
                ? "shrink-0 text-content-onSidebar"
                : "shrink-0 text-content-onSidebarMuted transition-colors group-hover/nav:text-content-onSidebar"
            }
          />
          <span className="truncate">{item.label}</span>
        </span>
        <IconChevronRight
          size={12}
          className={[
            "shrink-0 text-content-onSidebarMuted transition-transform duration-200",
            open ? "rotate-90" : "rotate-0",
          ].join(" ")}
        />
      </button>

      {/*
        Smooth height transition without JS:
        grid-template-rows: 0fr → 1fr collapses the child's intrinsic height.
        The inner div uses min-h-0 + overflow-hidden so it animates cleanly.
      */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-200"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          {/* Indent rail + sub-items list */}
          <ul className="relative ml-[19px] mt-0.5 flex flex-col gap-0.5 border-l border-border-onSidebar pl-2 pt-0.5">
            {subItems.map((sub) => (
              <SubLeaf key={sub.to} sub={sub} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function SubLeaf({
  sub,
  onNavigate,
}: {
  sub: SidebarSubItem
  onNavigate?: () => void
}): JSX.Element {
  return (
    <li>
      <NavLink
        to={sub.to}
        end={sub.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            "group/sub flex h-8 items-center rounded-md px-2.5 text-[12.5px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber",
            isActive
              ? "bg-surface-sidebarActive font-medium text-content-onSidebarActive"
              : "font-medium text-content-onSidebarMuted hover:bg-surface-sidebarHover hover:text-content-onSidebar",
          ].join(" ")
        }
      >
        <span className="truncate">{sub.label}</span>
      </NavLink>
    </li>
  )
}

function NavEntry({
  item,
  onNavigate,
}: {
  item: SidebarNavItem
  onNavigate?: () => void
}): JSX.Element {
  if (item.subItems && item.subItems.length > 0) {
    return <ExpandableItem item={item} onNavigate={onNavigate} />
  }
  return <LeafItem item={item} onNavigate={onNavigate} />
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
          <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}

export function AppSidebar({ onNavigate }: AppSidebarProps): JSX.Element {
  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col bg-surface-sidebar"
      aria-label="Main navigation"
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <BrandAvatar size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content-onSidebar">
            MercFlow
          </p>
          <p className="truncate text-[11px] font-medium text-content-onSidebarMuted">
            Workspace
          </p>
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col overflow-y-auto px-3 pb-6"
        aria-label="Application"
      >
        <div className="flex flex-col gap-0.5">
          {primarySidebarNav.map((item) => (
            <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <Section section={contentSidebarSection} onNavigate={onNavigate} />
        <Section section={settingsSidebarSection} onNavigate={onNavigate} />
      </nav>
    </aside>
  )
}
