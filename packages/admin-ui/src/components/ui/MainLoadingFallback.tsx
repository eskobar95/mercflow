import type { ReactNode } from "react"
/**
 * Default Suspense fallback for the main content region.
 * Swap for route-level skeletons when data-backed pages land.
 */
export function MainLoadingFallback(): ReactNode {
  return (
    <output
      aria-live="polite"
      aria-label="Loading"
      className="flex min-h-0 flex-1 flex-col gap-4 p-8"
    >
      <div className="h-6 w-48 animate-pulse rounded-md bg-surface-subtle" />
      <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-surface-subtle" />
      <div className="h-4 w-3/4 max-w-lg animate-pulse rounded-md bg-surface-subtle" />
    </output>
  )
}
