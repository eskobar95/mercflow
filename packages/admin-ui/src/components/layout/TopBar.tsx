import type { ReactNode } from "react"
import { BrandAvatar } from "@/components/ui/BrandAvatar"
import { IconSearch } from "@/components/ui/icons"

import { usePageChromeValue } from "./pageChrome"

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
 * App top bar — the single page header (Linear-style chrome bar).
 *
 * The bar owns page identity and primary actions so pages never repeat their
 * own title or action cluster in the body:
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Title ⟨14⟩ │ Filter Sort              ⟨page action icons⟩    │
 *   └─────────────────────────────────────────────────────────────┘
 *
 *   - `title` comes from the active route handle; `titleBadge` + `toolbar` +
 *     `actions` are injected per page via `usePageChrome`. The `toolbar` (list
 *     filter/sort) sits left next to the title so the body can start straight at
 *     the table — no separate control row between the chrome and the data. Page
 *     `actions` are round icon buttons (`IconButton`) with tooltips on the right.
 *   - The workspace/account avatar is NOT here — it lives at the foot of the
 *     sidebar (Linear/Notion pattern), so the bar carries only page identity +
 *     contextual actions.
 *   - There is no generic "Create" here anymore: the create affordance is a
 *     contextual page action, so it is defined exactly once.
 *   - Global search is NOT in this bar on desktop — it lives in the sidebar
 *     header (Linear pattern), so there is a single search entry point and the
 *     chrome bar stays quiet. On mobile (no visible sidebar) a compact search
 *     icon is kept here.
 *   - Topbar height matches the mobile nav sheet header at 56px (h-14) so the
 *     chrome lines up exactly when the sheet slides in.
 *   - Mobile: brand circle avatar lives top-left and is the menu trigger; a
 *     subtle ring appears around it when the sheet is open.
 */
export function TopBar({
  title,
  onToggleMobileMenu,
  mobileMenuOpen = false,
}: TopBarProps): ReactNode {
  const { titleBadge, toolbar, actions } = usePageChromeValue()

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

      {/* Page identity — title + optional live badge, then list toolbar (desktop) */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="min-w-0 shrink-0 truncate text-interface font-semibold tracking-tight text-content-primary md:text-base">
          {title}
        </h1>
        {titleBadge}
        {toolbar ? (
          <div
            key="topbar-toolbar"
            className="mercflow-chrome-in ml-1 hidden min-w-0 items-center gap-1.5 md:flex"
          >
            <span className="mr-0.5 h-5 w-px shrink-0 bg-border-subtle" aria-hidden />
            {toolbar}
          </div>
        ) : null}
      </div>

      {/* Right cluster: page action icons → (mobile search) */}
      <div className="flex items-center gap-1.5">
        {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}

        {/* Mobile-only global search (desktop search lives in the sidebar) */}
        <button
          type="button"
          aria-label="Search MercFlow"
          className="flex h-9 w-9 items-center justify-center rounded-full text-content-secondary transition-[background-color,color,transform] duration-150 hover:bg-surface-subtle hover:text-content-primary active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100 md:hidden"
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <IconSearch size={17} />
        </button>
      </div>
    </header>
  )
}
