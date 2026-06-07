import { type ReactNode, useId } from "react"

type ListPaginationProps = {
  "aria-label": string
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

const DEFAULT_PAGE_SIZES = [10, 25, 50]

/**
 * Page controls: page size select, previous/next, and status line.
 * Page indices are 1-based for display and callbacks.
 */
export function ListPagination({
  "aria-label": ariaLabel,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className = "",
}: ListPaginationProps): ReactNode {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)
  const selectId = useId()

  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  const navLabel = (
    <span className="text-xs text-content-tertiary tabular-nums">
      {start}–{end} of {totalItems}
    </span>
  )

  const navButtonClass =
    "inline-flex h-8 items-center rounded-md border border-border-default bg-surface-default px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-default disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-default disabled:hover:text-content-secondary"

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 bg-surface-default px-3 py-2.5 sm:px-4 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {navLabel}
      <div className="flex flex-wrap items-center gap-3">
        {pageSizeOptions.length > 1 ? (
          <div className="flex items-center gap-2">
            <label
              htmlFor={selectId}
              className="text-xs text-content-tertiary"
              id={`${selectId}-label`}
            >
              Rows
            </label>
            <select
              id={selectId}
              aria-labelledby={`${selectId}-label`}
              className="h-8 rounded-md border border-border-default bg-surface-default px-2 text-xs text-content-primary transition-colors hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <p className="text-xs text-content-tertiary tabular-nums" aria-live="polite">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={navButtonClass}
            onClick={() => onPageChange(safePage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            type="button"
            className={navButtonClass}
            onClick={() => onPageChange(safePage + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </nav>
  )
}
