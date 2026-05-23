import { IconSearch } from "@/components/ui/icons"

type TopBarProps = {
  title: string
}

/**
 * Sticky app header for the operational shell.
 *
 * Visual language:
 *   - Pure white over the cool `surface.appCanvas` so the chrome reads as
 *     a distinct band, not as another cream tone.
 *   - Hair-thin `border.app` divider, no shadow — Shopify pattern.
 *   - Title is the current route handle (28px semibold) so the header
 *     mirrors the active sidebar destination.
 *   - Right side hosts a quiet "Search" affordance (cmd-K stub) — primary
 *     navigation lives in the sidebar/tab bar, not here.
 *
 * Mobile menu toggle was relocated to the bottom `MobileTabBar` ("More"
 * slot), so the top bar stays clean on phones.
 */
export function TopBar({ title }: TopBarProps): JSX.Element {
  return (
    <header className="z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border-app bg-surface-appCard px-4 md:h-16 md:px-6">
      <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-content-primary md:text-xl">
        {title}
      </h1>
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border-app bg-surface-appCanvas px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-default hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          aria-label="Search MercFlow"
        >
          <IconSearch size={16} className="text-content-tertiary" />
          <span>Search</span>
          <kbd className="ml-1 rounded border border-border-app bg-surface-appCard px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary">
            ⌘K
          </kbd>
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-canvas text-2xs font-semibold uppercase tracking-label text-amber-text"
          aria-label="Workspace owner"
        >
          NE
        </div>
      </div>
    </header>
  )
}
