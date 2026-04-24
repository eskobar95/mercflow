type TopBarProps = {
  title: string
}

/**
 * Sticky app header for the main column. Shell chrome only; no data fetching.
 */
export function TopBar({ title }: TopBarProps): JSX.Element {
  return (
    <header
      className="z-sticky flex h-16 shrink-0 items-center border-b border-border-default bg-surface-raised px-6 shadow-sm"
    >
      <p className="text-lg font-medium text-content-primary">{title}</p>
    </header>
  )
}
