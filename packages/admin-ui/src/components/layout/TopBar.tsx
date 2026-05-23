type TopBarProps = {
  title: string
  onMenuToggle?: () => void
  showMenuToggle?: boolean
  menuExpanded?: boolean
}

/**
 * Sticky app header. Blends with the canvas via surface.default and a
 * hair-thin border (Claude editorial: subtle borders, no shadows).
 */
export function TopBar({
  title,
  onMenuToggle,
  showMenuToggle = false,
  menuExpanded = false,
}: TopBarProps): JSX.Element {
  return (
    <header className="z-sticky flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-default px-4 md:px-6">
      {showMenuToggle ? (
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-content-primary hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuExpanded}
          onClick={onMenuToggle}
        >
          <span className="flex flex-col gap-1" aria-hidden>
            <span className="block h-0.5 w-4 rounded-full bg-content-primary" />
            <span className="block h-0.5 w-4 rounded-full bg-content-primary" />
            <span className="block h-0.5 w-4 rounded-full bg-content-primary" />
          </span>
        </button>
      ) : null}
      <h1 className="min-w-0 truncate text-lg font-semibold text-content-primary">
        {title}
      </h1>
    </header>
  )
}
