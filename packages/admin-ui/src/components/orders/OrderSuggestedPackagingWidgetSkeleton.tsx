import type { ReactNode } from "react"

export function OrderSuggestedPackagingWidgetSkeleton(): ReactNode {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="rounded-md border border-border-subtle bg-surface-default p-4 animate-pulse"
    >
      <div className="h-4 max-w-[10rem] rounded-sm bg-surface-subtle" />
      <div className="mt-3 h-4 max-w-xs rounded-sm bg-surface-subtle" />
      <div className="mt-2 h-4 max-w-[14rem] rounded-sm bg-surface-subtle" />
    </div>
  )
}
