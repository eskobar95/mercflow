import { useMemo } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { mobileTabBar } from "@/config/sidebarNav"

/**
 * Mobile bottom navigation — 4 destinations, sliding accent indicator.
 *
 * The "More" trigger no longer lives here; the brand avatar in the topbar
 * owns that role. Every slot in this bar is a real route, so the bar acts
 * purely as primary navigation and never as overflow.
 *
 * Visual signature:
 *   - 64px tall, white surface, hairline top border (no shadow — sits flush
 *     against the canvas like Mercury/Stripe mobile).
 *   - 2px-tall amber accent bar at the top of the active slot, slides
 *     between slots with the iOS drawer curve. This is the memorable
 *     detail: instead of a heavy pill background you get a quiet pointer
 *     that tracks your route.
 *   - Active label gains accent-text + semibold weight; icon stroke widens.
 *   - Press feedback: scale(0.97) on the slot.
 *
 * The accent uses a transform on a single absolutely-positioned element so
 * it animates with GPU compositing rather than 4 separate background fades.
 */

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

function matchesActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function MobileTabBar(): JSX.Element {
  const location = useLocation()
  const slotCount = mobileTabBar.length

  const activeIndex = useMemo(() => {
    const path = location.pathname
    const idx = mobileTabBar.findIndex((item) =>
      matchesActive(path, item.to, item.end)
    )
    return idx === -1 ? -1 : idx
  }, [location])

  return (
    <nav
      className="relative z-sticky flex h-16 shrink-0 border-t border-border-app bg-surface-appCard md:hidden"
      aria-label="Primary"
    >
      {/* Sliding accent — sits above all slots, transforms to the active one. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[2px] rounded-full bg-accent"
        style={{
          width: `${100 / slotCount}%`,
          transform: `translateX(${activeIndex < 0 ? -100 : activeIndex * 100}%) scaleX(0.35)`,
          opacity: activeIndex < 0 ? 0 : 1,
          transition: `transform 320ms ${EASE}, opacity 200ms ${EASE}`,
          transformOrigin: "center",
        }}
      />

      {mobileTabBar.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="group/tab flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-transform duration-100 active:scale-[0.97] focus-visible:outline-none"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  className={[
                    "transition-colors duration-200",
                    isActive
                      ? "text-accent-text"
                      : "text-content-tertiary group-hover/tab:text-content-secondary",
                  ].join(" ")}
                  style={{ transitionTimingFunction: EASE }}
                />
                <span
                  className={[
                    "text-2xs leading-none tracking-tight transition-colors duration-200",
                    isActive
                      ? "font-semibold text-accent-text"
                      : "font-medium text-content-tertiary group-hover/tab:text-content-secondary",
                  ].join(" ")}
                  style={{ transitionTimingFunction: EASE }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
