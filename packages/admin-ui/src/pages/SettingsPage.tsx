import type { ReactNode } from "react"

import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard"
import { PageHeader } from "@/components/ui/PageHeader"
import { SETTINGS_LANDING_SECTIONS } from "@/config/settingsSections"

/**
 * Settings landing — grid of cards linking to each settings sub-section.
 * Operators reach any settings area in at most two clicks (sidebar → card).
 */
export function SettingsPage(): ReactNode {
  return (
    <div className="pb-12">
      <PageHeader
        title="Settings"
        description="Configure your store, integrations, shipping, payments, and SEO infrastructure."
      />

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
        {SETTINGS_LANDING_SECTIONS.map((section) => (
          <SettingsSectionCard key={section.to} section={section} />
        ))}
      </div>
    </div>
  )
}
