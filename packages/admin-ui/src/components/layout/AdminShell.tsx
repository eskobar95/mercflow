import { type ReactNode, Suspense, useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { PageTransition } from "@/components/ui/PageTransition"
import { useRouteTitle } from "@/hooks/useRouteTitle"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { DRAWER_EASE, ENTER_EASE, SHEET_CLOSE_MS, SHEET_OPEN_MS } from "@/constants/motion"

import { AppSidebar } from "./AppSidebar"
import { MobileNavSheet } from "./MobileNavSheet"
import { MobileTabBar } from "./MobileTabBar"
import { TopBar } from "./TopBar"

function RoutedMainOutlet(): ReactNode {
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
export function AdminShell(): ReactNode {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [navSheetWillChange, setNavSheetWillChange] = useState(false)
  const title = useRouteTitle()
  const location = useLocation()

  const closeMoreSheet = useCallback((): void => {
    setNavSheetWillChange(true)
    setMoreSheetOpen(false)
  }, [])

  const toggleMoreSheet = useCallback((): void => {
    setNavSheetWillChange(true)
    setMoreSheetOpen((open) => !open)
  }, [])

  const dismissMoreSheetNavigationToken = location.key

  useAdjustStateWhenKeyChanges(dismissMoreSheetNavigationToken, () => {
    setNavSheetWillChange(true)
    setMoreSheetOpen(false)
  })

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
        tabIndex={moreSheetOpen ? 0 : -1}
        className="fixed inset-0 z-modal-backdrop bg-surface-overlay md:hidden motion-reduce:transition-none"
        style={{
          opacity: moreSheetOpen ? 1 : 0,
          pointerEvents: moreSheetOpen ? "auto" : "none",
          transition: `opacity 240ms ${DRAWER_EASE}`,
        }}
      />
      <dialog
        id="mobile-nav-sheet"
        open={moreSheetOpen || undefined}
        aria-label="Main navigation"
        className="fixed inset-0 z-modal m-0 flex h-[100dvh] max-h-none w-full max-w-none border-0 bg-transparent p-0 md:hidden motion-reduce:transition-none"
        style={{
          transform: moreSheetOpen ? "translateX(0)" : "translateX(-100%)",
          transition: moreSheetOpen
            ? `transform ${SHEET_OPEN_MS}ms ${DRAWER_EASE}`
            : `transform ${SHEET_CLOSE_MS}ms ${ENTER_EASE}`,
          ...(navSheetWillChange ? { willChange: "transform" as const } : {}),
          pointerEvents: moreSheetOpen ? "auto" : "none",
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "transform") {
            return
          }
          setNavSheetWillChange(false)
        }}
      >
        <MobileNavSheet open={moreSheetOpen} onClose={closeMoreSheet} />
      </dialog>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          onToggleMobileMenu={toggleMoreSheet}
          mobileMenuOpen={moreSheetOpen}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto focus:outline-none"
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
