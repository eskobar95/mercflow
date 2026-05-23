import { BrandAvatar } from "@/components/ui/BrandAvatar"
import { IconSearch } from "@/components/ui/icons"

type TopBarProps = {
  title: string
  /**
   * Mobile-only: handler for the brand-avatar tap. The avatar acts as the
   * primary menu trigger on mobile (replacing the old "More" tab bar slot).
   */
  onToggleMobileMenu?: () => void
  /** Whether the menu the avatar controls is currently open. */
  mobileMenuOpen?: boolean
}

/**
 * App top bar — Mercury / Stripe synthesis.
 *
 * Layout (mobile):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  (M)  Title                            [🔍]  [+]    │
 *   └─────────────────────────────────────────────────────┘
 *
 * Layout (desktop ≥md):
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Title          [        Search ⌘K        ]   [+]   │
 *   └─────────────────────────────────────────────────────┘
 *
 *   - Topbar height matches the mobile nav sheet header at 56px (h-14) so
 *     the chrome lines up exactly when the sheet slides in.
 *   - Mobile: brand circle avatar lives top-left and is the menu trigger.
 *     A subtle ring appears around it when the sheet is open so the user
 *     always knows that's the affordance they need to dismiss it.
 *   - Desktop: the brand avatar lives in the sidebar header, so the topbar
 *     keeps its current title + search + create cluster.
 */
export function TopBar({
  title,
  onToggleMobileMenu,
  mobileMenuOpen = false,
}: TopBarProps): JSX.Element {
  return (
    <header className="z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border-app bg-surface-appCard px-3 md:h-16 md:px-6">
      {/* Mobile: brand avatar = menu trigger */}
      {onToggleMobileMenu ? (
        <div className="md:hidden">
          <BrandAvatar
            size={36}
            interactive
            active={mobileMenuOpen}
            onClick={onToggleMobileMenu}
            ariaLabel={mobileMenuOpen ? "Close menu" : "Open menu"}
            ariaControls="mobile-nav-sheet"
            ariaExpanded={mobileMenuOpen}
          />
        </div>
      ) : null}

      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-content-primary md:text-base">
        {title}
      </h1>

      {/* Desktop: full search + create + workspace avatar */}
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          className="group/search inline-flex h-9 w-[280px] items-center gap-2 rounded-full border border-border-default bg-surface-appCanvas px-3.5 text-left text-[13px] text-content-tertiary transition-[background-color,border-color,color] duration-150 hover:border-border-strong hover:bg-surface-appCard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
          aria-label="Search MercFlow"
        >
          <IconSearch
            size={15}
            className="shrink-0 text-content-tertiary transition-colors group-hover/search:text-content-secondary"
          />
          <span className="flex-1">Search</span>
          <kbd className="ml-auto rounded border border-border-default bg-surface-appCard px-1.5 py-px font-mono text-[10px] font-medium text-content-tertiary">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-content-inverse shadow-sm transition-[background-color,transform,box-shadow] duration-150 hover:bg-accent-strong hover:shadow-md active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-content-inverse shadow-sm transition-[background-color,transform] duration-150 hover:bg-accent-strong active:scale-[0.95]"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
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
