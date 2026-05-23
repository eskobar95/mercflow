import { Suspense, useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { PageTransition } from "@/components/ui/PageTransition"
import { useRouteTitle } from "@/hooks/useRouteTitle"

import { AppSidebar } from "./AppSidebar"
import { MobileNavSheet } from "./MobileNavSheet"
import { MobileTabBar } from "./MobileTabBar"
import { TopBar } from "./TopBar"

/** Drawer motion follows iOS — feels familiar to anyone with an iPhone. */
const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

function RoutedMainOutlet(): JSX.Element {
  const { key } = useLocation()
  return (
    <PageTransition routeKey={key}>
      <Outlet />
    </PageTransition>
  )
}

/**
 * Global admin chrome.
 *
 *   ┌──────────┬──────────────────────────┐
 *   │          │   TopBar                 │
 *   │ Sidebar  ├──────────────────────────┤
 *   │ (Asana   │   Outlet                 │
 *   │  near    │                          │
 *   │  black)  │                          │
 *   └──────────┴──────────────────────────┘
 *
 * Below `md` the sidebar is hidden and `MobileTabBar` docks at the bottom.
 * The "More" tab opens `MobileNavSheet` — a light, iOS-grouped-cards menu,
 * intentionally NOT a copy of the dark desktop rail. Motion is asymmetric:
 * 280ms slide-in (drawer ease), 200ms slide-out (snappier release). Backdrop
 * uses opacity transition so it can be interrupted mid-flight.
 */
export function AdminShell(): JSX.Element {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const title = useRouteTitle()
  const location = useLocation()

  const closeMoreSheet = useCallback((): void => {
    setMoreSheetOpen(false)
  }, [])

  const toggleMoreSheet = useCallback((): void => {
    setMoreSheetOpen((open) => !open)
  }, [])

  // Always dismiss the sheet on route change.
  useEffect(() => {
    setMoreSheetOpen(false)
  }, [location.pathname])

  // Lock background scroll while the sheet is open — common drawer hygiene.
  useEffect(() => {
    if (!moreSheetOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [moreSheetOpen])

  // Escape closes the sheet — small thing, big keyboard-user delta.
  useEffect(() => {
    if (!moreSheetOpen) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") closeMoreSheet()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [moreSheetOpen, closeMoreSheet])

  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-surface-appCanvas md:flex-row">
      <a
        href="#main-content"
        className="sr-only z-toast focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:border focus:border-border-default focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content-primary focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar — fixed left rail. */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar />
      </div>

      {/* Mobile drawer — backdrop + sheet. Both stay mounted so transitions can play in both directions. */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeMoreSheet}
        aria-hidden={!moreSheetOpen}
        tabIndex={moreSheetOpen ? 0 : -1}
        className="fixed inset-0 z-modal-backdrop bg-surface-overlay md:hidden motion-reduce:transition-none"
        style={{
          opacity: moreSheetOpen ? 1 : 0,
          pointerEvents: moreSheetOpen ? "auto" : "none",
          transition: `opacity 240ms ${SHEET_EASE}`,
        }}
      />
      <div
        id="mobile-nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        aria-hidden={!moreSheetOpen}
        className="fixed inset-0 z-modal flex md:hidden motion-reduce:transition-none"
        style={{
          transform: moreSheetOpen ? "translateX(0)" : "translateX(-100%)",
          // Asymmetric timing: 280ms open (decisive), 200ms close (snappy release).
          transition: moreSheetOpen
            ? `transform 280ms ${SHEET_EASE}`
            : `transform 200ms cubic-bezier(0.23, 1, 0.32, 1)`,
          willChange: "transform",
          pointerEvents: moreSheetOpen ? "auto" : "none",
        }}
      >
        <MobileNavSheet open={moreSheetOpen} onClose={closeMoreSheet} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          onToggleMobileMenu={toggleMoreSheet}
          mobileMenuOpen={moreSheetOpen}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto focus:outline-none"
        >
          <ErrorBoundary>
            <Suspense fallback={<MainLoadingFallback />}>
              <RoutedMainOutlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <MobileTabBar />
      </div>
    </div>
  )
}
