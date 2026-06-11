import type { ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { EMAIL_SETTINGS_TABS, parseEmailSettingsTab } from "@/config/emailSettingsTabs"
import { cn } from "@/lib/cn"

export function EmailSettingsTabNav(): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseEmailSettingsTab(searchParams.get("tab"))

  return (
    <nav aria-label="Email settings sections" className="border-b border-border-subtle">
      <ul className="-mb-px flex flex-wrap gap-1">
        {EMAIL_SETTINGS_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <li key={tab.id}>
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                  isActive
                    ? "border-accent text-content-primary"
                    : "border-transparent text-content-secondary hover:border-border-default hover:text-content-primary",
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setSearchParams({ tab: tab.id })
                }}
              >
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
