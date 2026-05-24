type FilterResultsSummaryProps = {
  totalItems: number
  filteredItems: number
  onClear: () => void
}

export function FilterResultsSummary({
  totalItems,
  filteredItems,
  onClear,
}: FilterResultsSummaryProps): JSX.Element | null {
  const hiddenCount = totalItems - filteredItems
  if (hiddenCount <= 0) return null

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-subtle/60 px-4 py-2">
      <span className="text-xs text-content-tertiary">
        Showing{" "}
        <span className="font-medium text-content-secondary">{filteredItems}</span>{" "}
        of{" "}
        <span className="font-medium text-content-secondary">{totalItems}</span>
      </span>
      <span aria-hidden className="h-3 w-px bg-border-default" />
      <span className="text-xs text-content-tertiary">
        <span className="font-medium text-content-secondary">{hiddenCount}</span>{" "}
        hidden by filters
      </span>
      <button
        type="button"
        className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-content-tertiary transition-colors hover:text-content-secondary"
        onClick={onClear}
      >
        Clear Filters
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
          <path
            d="M2 2l5 5M7 2L2 7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
