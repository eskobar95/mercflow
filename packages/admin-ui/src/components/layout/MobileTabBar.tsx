import { NavLink } from "react-router-dom"

import { mobileTabBar } from "@/config/sidebarNav"

type MobileTabBarProps = {
  moreOpen: boolean
  onToggleMore: () => void
}

/**
 * Mobile bottom tab bar — Material 3-style pill indicator.
 *
 * Active slot:  amber pill chip behind icon + amber icon + amber label.
 * Inactive slot: no chip, muted icon + muted label.
 *
 * Height: 56px (h-14), backdrop-blur for premium feel when content scrolls under.
 * Labels: sentence-case (not ALLCAPS) — cleaner and less aggressive.
 */

const labelBase = "mt-0.5 text-[11px] font-medium leading-none transition-colors duration-200"

function TabSlotInner({
  icon: Icon,
  label,
  isActive,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  isActive: boolean
}): JSX.Element {
  return (
    <>
      {/* Pill chip sits behind the icon */}
      <span
        className={[
          "relative flex items-center justify-center rounded-full transition-all duration-200",
          "h-8 w-12",
          isActive ? "bg-surface-sidebarActive" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon
          size={20}
          className={[
            "transition-colors duration-200",
            isActive ? "text-amber-text" : "text-content-tertiary",
          ].join(" ")}
        />
      </span>
      <span
        className={[
          labelBase,
          isActive ? "text-amber-text" : "text-content-tertiary",
        ].join(" ")}
      >
        {label}
      </span>
    </>
  )
}

const slotBase =
  "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0 focus-visible:outline-none"

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
              <TabSlotInner icon={Icon} label={item.label} isActive={moreOpen} />
            </button>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={slotBase}
          >
            {({ isActive }) => (
              <TabSlotInner icon={Icon} label={item.label} isActive={isActive} />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
