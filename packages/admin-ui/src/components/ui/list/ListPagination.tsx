import { useId } from "react"

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
}: ListPaginationProps): JSX.Element {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)
  const selectId = useId()

  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  const navLabel = (
    <span className="text-sm text-content-secondary">
      Showing {start}–{end} of {totalItems}
    </span>
  )

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border-default bg-surface-raised px-6 py-3 ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {navLabel}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor={selectId}
            className="text-sm text-content-secondary"
            id={`${selectId}-label`}
          >
            Rows per page
          </label>
          <select
            id={selectId}
            aria-labelledby={`${selectId}-label`}
            className="rounded-md border border-border-default bg-surface-default px-2 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
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
        <p className="text-sm text-content-secondary" aria-live="polite">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(safePage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-50"
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
