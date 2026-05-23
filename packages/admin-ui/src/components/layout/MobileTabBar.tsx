import { NavLink } from "react-router-dom"

import { mobileTabBar } from "@/config/sidebarNav"

type MobileTabBarProps = {
  moreOpen: boolean
  onToggleMore: () => void
}

/**
 * Fixed 56px tab bar — consistent height regardless of page or safe-area.
 * Labels always visible below icons so every slot reads identically.
 * Active slot: amber icon + amber label + small amber dot above icon.
 */
const slotBase =
  "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-[3px] px-1 text-[10px] font-semibold uppercase tracking-label transition-colors focus-visible:outline-none"

function tabLinkClass({ isActive }: { isActive: boolean }): string {
  return `${slotBase} ${isActive ? "text-amber-text" : "text-content-tertiary"}`
}

export function MobileTabBar({
  moreOpen,
  onToggleMore,
}: MobileTabBarProps): JSX.Element {
  return (
    <nav
      className="z-sticky flex h-14 shrink-0 border-t border-border-app bg-surface-appCard md:hidden"
      aria-label="Primary"
    >
      {mobileTabBar.map((item) => {
        const Icon = item.icon

        if (item.kind === "more") {
          return (
            <button
              key={item.label}
              type="button"
              className={`${slotBase} ${moreOpen ? "text-amber-text" : "text-content-tertiary"}`}
              aria-expanded={moreOpen}
              aria-controls="mobile-nav-sheet"
              onClick={onToggleMore}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Icon size={20} />
                {moreOpen ? (
                  <span
                    aria-hidden
                    className="absolute -top-1 h-1 w-1 rounded-full bg-amber"
                  />
                ) : null}
              </span>
              <span>{item.label}</span>
            </button>
          )
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={tabLinkClass}
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Icon size={20} />
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute -top-1 h-1 w-1 rounded-full bg-amber"
                    />
                  ) : null}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
