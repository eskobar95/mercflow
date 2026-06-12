import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { SettingsShellSidebar } from "@/components/layout/SettingsShellSidebar"

/**
 * Settings layout — persistent secondary sidebar + page outlet (ADR-012).
 *
 *   ┌──────────────┬─────────────────────────┐
 *   │ Settings nav │   <Outlet />            │
 *   │ (grouped)    │   (section page)        │
 *   └──────────────┴─────────────────────────┘
 */
export function SettingsShell(): ReactNode {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <SettingsShellSidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
