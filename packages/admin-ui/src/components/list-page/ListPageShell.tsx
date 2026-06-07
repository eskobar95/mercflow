import type { ReactNode } from "react"

import { useScrollAwareFooter } from "@/hooks/useScrollAwareFooter"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

/** Id of the AdminShell scroll container the sticky footer reacts to. */
const MAIN_CONTENT_SCROLL_ID = "main-content"

type ListPageShellProps = {
  /** Filter / sort controls — duplicated on mobile below the TopBar. */
  listControls: ReactNode
  /** Collapsible chip row under the TopBar (optional). */
  filterBar?: ReactNode
  children: ReactNode
  /** Sticky pagination footer; receives scroll-shadow flag from the shell. */
  pagination: (footerFloating: boolean) => ReactNode
  bulkActions?: ReactNode
  /** Changes to this key reset scroll-footer shadow detection. */
  footerScrollKey: string
}

/**
 * Shared full-bleed list page layout used across catalogue, orders, customers, etc.
 * Title and primary actions live in TopBar via `usePageChrome`; this shell owns
 * toolbar controls, filter chips, table body, sticky pagination, and bulk bar.
 */
export function ListPageShell({
  listControls,
  filterBar,
  children,
  pagination,
  bulkActions,
  footerScrollKey,
}: ListPageShellProps): ReactNode {
  const { floating: footerFloating } = useScrollAwareFooter(
    MAIN_CONTENT_SCROLL_ID,
    footerScrollKey,
  )

  return (
    <div className="flex min-h-full flex-col bg-surface-appCard">
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2.5 md:hidden">
        {listControls}
      </div>

      {filterBar}

      <div className="flex flex-1 flex-col">{children}</div>

      <div
        className={cn(
          "sticky bottom-0 z-sticky",
          transitionShadowEnter,
          footerFloating ? "shadow-md" : "shadow-none",
        )}
      >
        {pagination(footerFloating)}
      </div>

      {bulkActions}
    </div>
  )
}
