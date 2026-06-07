import type { ReactNode } from "react"

type PageTransitionProps = {
  children: ReactNode
  /**
   * Current router location `key` (or pathname) so inner content re-mounts on navigation
   * and the enter animation runs. Omitted in tests or non-routed stories — no remount key.
   */
  routeKey?: string
}

/**
 * Route-level view wrapper. **`AdminShell` wraps the router `<Outlet />` with this
 * component** and passes `routeKey={location.key}` so all pages share one transition pattern.
 * Individual pages should not wrap themselves — avoid double application.
 */
export function PageTransition({ children, routeKey }: PageTransitionProps): JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 flex-col" data-mercflow-page-transition="root">
      <div
        key={routeKey}
        className="mercflow-page-transition min-h-0 min-w-0 flex-1"
        data-mercflow-page-transition="content"
        data-navigation-key={routeKey ?? undefined}
      >
        {children}
      </div>
    </div>
  )
}
