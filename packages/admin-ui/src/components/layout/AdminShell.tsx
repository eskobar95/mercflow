import { Suspense, useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { PageTransition } from "@/components/ui/PageTransition"
import { useRouteTitle } from "@/hooks/useRouteTitle"

import { AppSidebar } from "./AppSidebar"
import { MobileTabBar } from "./MobileTabBar"
import { TopBar } from "./TopBar"

/**
 * Renders the active route with the shared `PageTransition` (keyed by location so enter
 * motion runs on navigation). Placed inside `Suspense` so lazy routes keep the shell fallback.
 */
function RoutedMainOutlet(): JSX.Element {
  const { key } = useLocation()
  return (
    <PageTransition routeKey={key}>
      <Outlet />
    </PageTransition>
  )
}

/**
 * Global admin chrome — Shopify-style three-zone composition.
 *
 *   ┌──────────┬──────────────────────────┐
 *   │          │   TopBar (chrome.card)   │
 *   │ Sidebar  ├──────────────────────────┤
 *   │ (navy)   │   Outlet (app canvas)    │
 *   │          │                          │
 *   └──────────┴──────────────────────────┘
 *
 * Below the `md` breakpoint the sidebar is hidden and a `MobileTabBar`
 * docks at the bottom. The "More" tab opens a navy sheet containing the
 * full sidebar — same component, full continuity with desktop.
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

  /** Always dismiss the sheet on route change — including taps from inside the sheet. */
  useEffect(() => {
    setMoreSheetOpen(false)
  }, [location.pathname])

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

      {/* Mobile drawer scrim + sheet (rendered via portal-like fixed layer). */}
      {moreSheetOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-modal-backdrop bg-surface-overlay md:hidden"
          aria-label="Close navigation menu"
          onClick={closeMoreSheet}
        />
      ) : null}
      {/* Mobile fullscreen nav sheet — covers the whole viewport, close via X or tap outside. */}
      <div
        id="mobile-nav-sheet"
        className={
          moreSheetOpen
            ? "fixed inset-0 z-modal flex md:hidden"
            : "hidden"
        }
        aria-hidden={!moreSheetOpen}
      >
        <AppSidebar onNavigate={closeMoreSheet} onClose={closeMoreSheet} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} />
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
        <MobileTabBar
          moreOpen={moreSheetOpen}
          onToggleMore={toggleMoreSheet}
        />
      </div>
    </div>
  )
}
