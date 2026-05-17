import { Suspense } from "react"
import { Outlet, useLocation, useMatches } from "react-router-dom"

import type { MercflowRouteHandle } from "@/appRouter"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { PageTransition } from "@/components/ui/PageTransition"

import { AppSidebar } from "./AppSidebar"
import { TopBar } from "./TopBar"

function useShellTitle(): string {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const handle = last?.handle as MercflowRouteHandle | undefined
  return handle?.title ?? "MercFlow"
}

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
 * Route content renders in `<Outlet />` inside the main region.
 */
export function AdminShell(): JSX.Element {
  const title = useShellTitle()

  return (
    <div className="flex min-h-screen w-full min-w-0 md:min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-toast focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:border focus:border-border-default focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content-primary focus:shadow-md"
      >
        Skip to main content
      </a>
      <AppSidebar />
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
      </div>
    </div>
  )
}
