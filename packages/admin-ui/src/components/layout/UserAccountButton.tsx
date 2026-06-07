import type { ReactNode } from "react"

import { IconChevronDown } from "@/components/ui/icons"

import { useAdminSession } from "@/hooks/useAdminSession"

import { ENTER_EASE } from "@/constants/motion"

/**
 * Account control docked at the foot of the rail (Linear/Notion pattern). The
 * workspace identity lives in the header; the signed-in admin lives here.
 * Identity comes from {@link useAdminSession} — never hardcoded in layout.
 */
export function UserAccountButton(): ReactNode {
  const { session } = useAdminSession()

  return (
    <div className="shrink-0 border-t border-border-onSidebar px-3 py-3">
      <button
        type="button"
        aria-label={`Account: ${session.displayName}`}
        title="Account"
        className="group/account flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-[background-color,transform] duration-fast hover:bg-surface-sidebarHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
        style={{ transitionTimingFunction: ENTER_EASE }}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sidebarActive text-2xs font-semibold text-content-onSidebar ring-1 ring-inset ring-border-onSidebar"
          aria-hidden
        >
          {session.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-content-onSidebar">
            {session.displayName}
          </span>
          <span className="truncate text-2xs font-medium text-content-onSidebarMuted">
            {session.role}
          </span>
        </span>
        <IconChevronDown
          size={14}
          className="shrink-0 text-content-onSidebarMuted transition-colors group-hover/account:text-content-onSidebar"
        />
      </button>
    </div>
  )
}
