type TopBarProps = {
  title: string
  onMenuToggle?: () => void
  showMenuToggle?: boolean
  menuExpanded?: boolean
}

/**
 * Sticky app header for the main column. Shell chrome only; no data fetching.
 */
export function TopBar({
  title,
  onMenuToggle,
  showMenuToggle = false,
  menuExpanded = false,
}: TopBarProps): JSX.Element {
  return (
    <header className="z-sticky flex h-16 shrink-0 items-center gap-3 border-b border-border-default bg-surface-raised px-4 shadow-sm md:px-6">
      {showMenuToggle ? (
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-content-primary hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuExpanded}
          onClick={onMenuToggle}
        >
          <span className="flex flex-col gap-1" aria-hidden>
            <span className="block h-0.5 w-5 rounded-full bg-content-primary" />
            <span className="block h-0.5 w-5 rounded-full bg-content-primary" />
            <span className="block h-0.5 w-5 rounded-full bg-content-primary" />
          </span>
        </button>
      ) : null}
      <p className="min-w-0 truncate text-lg font-medium text-content-primary">{title}</p>
    </header>
  )
}
