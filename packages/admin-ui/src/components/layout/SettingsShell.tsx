import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { SettingsShellSidebar } from "@/components/layout/SettingsShellSidebar"

/**
 * Settings layout — persistent secondary sidebar + child route outlet (ADR-012).
 * Wraps all `/settings/*` routes; `/settings` index redirects to `/settings/general`.
 */
export function SettingsShell(): ReactNode {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-border-default bg-surface-raised md:w-56 md:border-b-0 md:border-r">
        <SettingsShellSidebar />
      </aside>
      <div className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
