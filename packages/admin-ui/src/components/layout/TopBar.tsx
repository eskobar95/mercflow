import { IconSearch } from "@/components/ui/icons"

type TopBarProps = {
  title: string
}

/**
 * App top bar — Mercury / Stripe synthesis.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Title          [        Search ⌘K        ]   [+]   │
 *   └─────────────────────────────────────────────────────┘
 *
 *   - White card surface with hairline bottom border (Mercury chrome rule).
 *   - Search field is the visual anchor — long pill-rounded rectangle (Mercury).
 *   - Right cluster: a single primary "Create" action (Stripe pattern), then
 *     workspace avatar. No notifications icon yet (will land with real data).
 *   - Title is the active route name (Asana greeting bar inspiration).
 *
 * Mobile (<md): search collapses to icon, no avatar — primary nav is the
 * bottom MobileTabBar.
 */
export function TopBar({ title }: TopBarProps): JSX.Element {
  return (
    <header className="z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border-app bg-surface-appCard px-4 md:h-16 md:px-6">
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-content-primary md:text-base">
        {title}
      </h1>

      {/* Desktop: full search + create + avatar */}
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          className="group/search inline-flex h-9 w-[280px] items-center gap-2 rounded-full border border-border-default bg-surface-appCanvas px-3.5 text-left text-[13px] text-content-tertiary transition-all duration-150 hover:border-border-strong hover:bg-surface-appCard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          aria-label="Search MercFlow"
        >
          <IconSearch size={15} className="shrink-0 text-content-tertiary transition-colors group-hover/search:text-content-secondary" />
          <span className="flex-1">Search</span>
          <kbd className="ml-auto rounded border border-border-default bg-surface-appCard px-1.5 py-px font-mono text-[10px] font-medium text-content-tertiary">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber px-3.5 text-[13px] font-semibold text-content-inverse shadow-sm transition-all duration-150 hover:bg-amber-strong active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          aria-label="Create new"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create
        </button>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-content-primary text-[11px] font-semibold text-content-inverse"
          aria-label="Workspace owner"
          title="Nicklas Eskou"
        >
          NE
        </div>
      </div>

      {/* Mobile: search icon + create icon */}
      <div className="flex items-center gap-1 md:hidden">
        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-colors duration-150 hover:bg-surface-subtle active:scale-[0.95]"
        >
          <IconSearch size={17} />
        </button>
        <button
          type="button"
          aria-label="Create new"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber text-content-inverse shadow-sm transition-all duration-150 hover:bg-amber-strong active:scale-[0.95]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </header>
  )
}
