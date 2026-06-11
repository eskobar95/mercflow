import type { ReactNode } from "react"
import { useRef, useState } from "react"

import { useClerkSession } from "@/components/auth/ClerkAuthGuard"
import { IconChevronDown, IconLogOut } from "@/components/ui/icons"
import { useAdminSession } from "@/hooks/useAdminSession"

import { ENTER_EASE } from "@/constants/motion"

/**
 * Account control docked at the foot of the rail (Linear/Notion pattern).
 *
 * When Clerk is active the display name, initials, and org name come from the
 * Clerk session. When Clerk is absent (local dev without a publishable key) we
 * fall back to the Medusa `/admin/users/me` endpoint as before.
 *
 * Sign-out is delegated to `clerk.signOut()` when Clerk is configured; in the
 * no-Clerk path the button is a no-op (a future iteration can wipe the local
 * JWT and redirect to login).
 */
export function UserAccountButton(): ReactNode {
  const clerkSession = useClerkSession()
  const { session: medusaSession } = useAdminSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const displayName = clerkSession?.displayName ?? medusaSession.displayName
  const initials = clerkSession?.initials ?? medusaSession.initials
  const subLabel = clerkSession?.orgName ?? clerkSession?.email ?? medusaSession.role

  function handleSignOut(): void {
    setMenuOpen(false)
    clerkSession?.signOut()
  }

  return (
    <div className="relative shrink-0 border-t border-border-onSidebar px-3 py-3">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account: ${displayName}`}
        aria-haspopup={clerkSession ? "menu" : undefined}
        aria-expanded={clerkSession ? menuOpen : undefined}
        title="Account"
        onClick={() => {
          if (clerkSession) setMenuOpen((o) => !o)
        }}
        className="group/account flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-[background-color,transform] duration-fast hover:bg-surface-sidebarHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
        style={{ transitionTimingFunction: ENTER_EASE }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sidebarActive text-2xs font-semibold text-content-onSidebar ring-1 ring-inset ring-border-onSidebar"
          aria-hidden
        >
          {initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-content-onSidebar">
            {displayName}
          </span>
          {subLabel ? (
            <span className="truncate text-2xs font-medium text-content-onSidebarMuted">
              {subLabel}
            </span>
          ) : null}
        </span>
        <IconChevronDown
          size={14}
          className="shrink-0 text-content-onSidebarMuted transition-colors group-hover/account:text-content-onSidebar"
        />
      </button>

      {clerkSession && menuOpen ? (
        <>
          {/* Backdrop to close on outside click */}
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-popover"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
          />
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 z-popover mb-1 overflow-hidden rounded-lg border border-border-onSidebar bg-surface-sidebar py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-content-onSidebar transition-colors hover:bg-surface-sidebarHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <IconLogOut size={16} className="shrink-0 text-content-onSidebarMuted" />
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
