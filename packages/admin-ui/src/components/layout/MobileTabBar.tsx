import { NavLink } from "react-router-dom"

import { mobileTabBar } from "@/config/sidebarNav"

type MobileTabBarProps = {
  moreOpen: boolean
  onToggleMore: () => void
}

/**
 * Mobile bottom navigation — Asana app + Material 3 pill indicator.
 *
 * 56px (h-14) fixed height, consistent across all routes. The active slot
 * receives an animated pill chip (`bg-amber-subtle` — soft blue accent fill)
 * behind the icon. Labels stay visible at all times in sentence-case.
 *
 * The "More" slot opens the full AppSidebar in a fullscreen sheet (managed
 * by AdminShell). Active state for "More" follows the same pill pattern.
 */

const slotBase =
  "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0 focus-visible:outline-none active:scale-[0.97] transition-transform duration-100"

function TabInner({
  Icon,
  label,
  active,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  active: boolean
}): JSX.Element {
  return (
    <>
      <span
        className={[
          "relative flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,color] duration-200",
          active ? "bg-amber-subtle" : "bg-transparent",
        ].join(" ")}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <Icon
          size={20}
          className={active ? "text-amber-text" : "text-content-tertiary"}
        />
      </span>
      <span
        className={[
          "mt-0.5 text-[11px] font-medium leading-none transition-colors duration-200",
          active ? "text-amber-text" : "text-content-tertiary",
        ].join(" ")}
      >
        {label}
      </span>
    </>
  )
}

export function MobileTabBar({
  moreOpen,
  onToggleMore,
}: MobileTabBarProps): JSX.Element {
  return (
    <nav
      className="z-sticky flex h-14 shrink-0 border-t border-border-app bg-surface-appCard/95 backdrop-blur-sm md:hidden"
      aria-label="Primary"
    >
      {mobileTabBar.map((item) => {
        const Icon = item.icon

        if (item.kind === "more") {
          return (
            <button
              key={item.label}
              type="button"
              className={slotBase}
              aria-expanded={moreOpen}
              aria-controls="mobile-nav-sheet"
              onClick={onToggleMore}
            >
              <TabInner Icon={Icon} label={item.label} active={moreOpen} />
            </button>
          )
        }

        return (
          <NavLink key={item.to} to={item.to} end={item.end} className={slotBase}>
            {({ isActive }) => (
              <TabInner Icon={Icon} label={item.label} active={isActive} />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
