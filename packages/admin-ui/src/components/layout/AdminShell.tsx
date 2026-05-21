import { Suspense, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { PageTransition } from "@/components/ui/PageTransition"
import { useRouteTitle } from "@/hooks/useRouteTitle"

import { AppSidebar } from "./AppSidebar"
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
 * Global admin chrome: sidebar, top bar, and scrollable main with error and lazy boundaries.
 * Sidebar collapses below the `md` breakpoint (768px) behind a menu toggle.
 */
export function AdminShell(): JSX.Element {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const title = useRouteTitle()

  const closeMobileNav = (): void => {
    setMobileNavOpen(false)
  }

  const toggleMobileNav = (): void => {
    setMobileNavOpen((open) => !open)
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-surface-canvas">
      <a
        href="#main-content"
        className="sr-only z-toast focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:border focus:border-border-default focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content-primary focus:shadow-md"
      >
        Skip to main content
      </a>
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-modal-backdrop bg-surface-overlay md:hidden"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />
      ) : null}
      <div
        className={
          mobileNavOpen
            ? "fixed inset-y-0 left-0 z-modal flex md:static"
            : "hidden md:flex md:shrink-0"
        }
      >
        <AppSidebar onNavigate={closeMobileNav} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          showMenuToggle
          menuExpanded={mobileNavOpen}
          onMenuToggle={toggleMobileNav}
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
      </div>
    </div>
  )
}
