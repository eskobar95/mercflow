import { UserButton } from "@clerk/react"
import { Outlet } from "react-router-dom"

import { PlatformSidebar } from "@/components/layout/PlatformSidebar"

export function PlatformShell(): React.ReactElement {
  return (
    <div className="flex min-h-[100dvh] bg-surface-appCanvas">
      <PlatformSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface-raised px-6">
          <p className="text-sm text-content-secondary">
            Internal operator tool — cross-tenant visibility
          </p>
          <UserButton />
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
