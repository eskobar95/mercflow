import { NavLink } from "react-router-dom"

import { mobileTabBar } from "@/config/sidebarNav"

type MobileTabBarProps = {
  /** Whether the secondary nav sheet is currently open (drives "More" active state). */
  moreOpen: boolean
  /** Toggle the secondary nav sheet (opened via the "More" slot). */
  onToggleMore: () => void
}

const slotBase =
  "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] text-[10px] font-semibold uppercase tracking-label transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-amber"

function tabLinkClass({ isActive }: { isActive: boolean }): string {
  if (isActive) {
    return `${slotBase} text-amber-text`
  }
  return `${slotBase} text-content-tertiary hover:text-content-primary`
}

/**
 * Primary navigation on phones (Shopify iOS pattern).
 *
 * Four fixed slots span the bottom of the viewport: Home, Orders, Products,
 * and a "More" sheet trigger that exposes the full sidebar (Customers,
 * Categories, Content sections, Settings). This replaces the desktop sidebar
 * entirely below the `md` breakpoint so mobile is operational, not "dead".
 *
 * The active slot uses an amber dot indicator over a cream-tinted icon
 * (matches the desktop sidebar active state in spirit but reads as a tab
 * indicator, not a fill).
 */
export function MobileTabBar({
  moreOpen,
  onToggleMore,
}: MobileTabBarProps): JSX.Element {
  return (
    <nav
      className="z-sticky flex h-[calc(theme(spacing.14)+env(safe-area-inset-bottom))] shrink-0 border-t border-border-app bg-surface-appCard md:hidden"
      aria-label="Primary"
    >
      {mobileTabBar.map((item) => {
        if (item.kind === "more") {
          const Icon = item.icon
          const activeClass = moreOpen
            ? "text-amber-text"
            : "text-content-tertiary"
          return (
            <button
              key={item.label}
              type="button"
              className={`${slotBase} ${activeClass}`}
              aria-expanded={moreOpen}
              aria-controls="mobile-nav-sheet"
              onClick={onToggleMore}
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <Icon
                  size={22}
                  className={
                    moreOpen
                      ? "text-amber-text"
                      : "text-content-secondary"
                  }
                />
                {moreOpen ? (
                  <span
                    aria-hidden
                    className="absolute -top-1.5 h-1 w-1 rounded-full bg-amber"
                  />
                ) : null}
              </span>
              <span>{item.label}</span>
            </button>
          )
        }

        const Icon = item.icon
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
                  <Icon
                    size={22}
                    className={
                      isActive
                        ? "text-amber-text"
                        : "text-content-secondary"
                    }
                  />
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute -top-1.5 h-1 w-1 rounded-full bg-amber"
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
