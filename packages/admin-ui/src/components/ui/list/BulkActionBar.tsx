import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { IconClose } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

/**
 * Shared style for action controls placed inside the (dark) bulk bar — quiet on
 * the ink surface, tinting on hover, with press feedback. Use for buttons and
 * dropdown/dialog triggers passed as `children`.
 */
export const bulkActionButtonClass = cn(
  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-content-inverse/85",
  "transition-[background-color,color,transform] duration-fast ease-enter",
  "hover:bg-content-inverse/15 hover:text-content-inverse active:scale-[0.96]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content-inverse/40",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
)

type BulkActionBarProps = {
  /** Number of selected rows. The bar shows while this is > 0. */
  count: number
  /** Singular/plural noun for the count, e.g. "product". */
  noun?: string
  /** Clear the current selection. */
  onClear: () => void
  /** Action controls (buttons) shown to the right of the count. */
  children?: ReactNode
}

/**
 * Floating bulk-action bar (Linear / Notion pattern). It is always mounted and
 * animates in from the bottom when one or more rows are selected, so both the
 * enter and exit play smoothly and can be interrupted mid-flight.
 *
 * Motion: transform + opacity only (GPU), strong ease-out, ~200ms — under the
 * 300ms UI ceiling. `transform-origin` sits at the bottom since it rises from
 * the page edge. Honours `prefers-reduced-motion` by dropping the slide.
 *
 * Rendered through a portal to `document.body`: the page-transition wrapper
 * keeps a `transform` after its enter animation, which would otherwise make
 * this `fixed` bar resolve against that scrolling container instead of the
 * viewport (and sink below the fold).
 */
export function BulkActionBar({
  count,
  noun = "item",
  onClear,
  children,
}: BulkActionBarProps): JSX.Element | null {
  const visible = count > 0

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      // Centered over the content, lifted above the docked pagination footer.
      className="pointer-events-none fixed inset-x-0 bottom-6 z-dropdown flex justify-center px-4"
      aria-hidden={!visible}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-1.5 rounded-xl bg-content-primary py-1.5 pl-3 pr-1.5 text-content-inverse shadow-lg",
          "origin-bottom transition-[transform,opacity] duration-page ease-enter motion-reduce:transition-none",
          visible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "translate-y-3 opacity-0 motion-reduce:translate-y-0",
        )}
      >
        <span className="flex items-center gap-1.5 pr-1 text-sm">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-content-inverse/15 px-1.5 text-xs font-semibold tabular-nums">
            {count}
          </span>
          <span className="text-content-inverse/80">
            {count === 1 ? noun : `${noun}s`} selected
          </span>
        </span>

        {children ? (
          <>
            <span className="mx-0.5 h-5 w-px shrink-0 bg-content-inverse/20" aria-hidden />
            <div className="flex items-center gap-1">{children}</div>
          </>
        ) : null}

        <span className="mx-0.5 h-5 w-px shrink-0 bg-content-inverse/20" aria-hidden />
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          title="Clear selection (Esc)"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg text-content-inverse/70",
            "transition-[background-color,color,transform] duration-fast ease-enter",
            "hover:bg-content-inverse/15 hover:text-content-inverse active:scale-[0.92]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content-inverse/40",
            "motion-reduce:transition-none motion-reduce:active:scale-100",
          )}
        >
          <IconClose size={15} />
        </button>
      </div>
    </div>,
    document.body,
  )
}
