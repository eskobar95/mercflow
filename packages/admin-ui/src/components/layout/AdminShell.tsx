import { Suspense } from "react"
import { Outlet } from "react-router-dom"

import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"

import { AppSidebar } from "./AppSidebar"
import { TopBar } from "./TopBar"

/**
 * Global admin chrome: sidebar, top bar, and scrollable main with error and lazy boundaries.
 * Route content renders in `<Outlet />` inside the main region.
 */
export function AdminShell(): JSX.Element {
  return (
    <div className="flex min-h-screen w-full min-w-0">
      <a
        href="#main-content"
        className="sr-only z-toast focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:border focus:border-border-default focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-content-primary focus:shadow-md"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Dashboard" />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto focus:outline-none"
        >
          <ErrorBoundary>
            <Suspense fallback={<MainLoadingFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
