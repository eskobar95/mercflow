import type { ReactNode } from "react"
import { SeoStructuredDataSettingsForm } from "@/components/seo/SeoStructuredDataSettingsForm"
import { PageHeader } from "@/components/ui/PageHeader"

import { settingsSeoBreadcrumbs } from "@/config/settingsBreadcrumbs"

export function SeoStructuredDataSettingsPage(): ReactNode {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="SEO — Structured data"
        description="Toggle JSON-LD output per page type. Storefront injects blocks from MercFlow store SEO APIs."
        breadcrumbs={settingsSeoBreadcrumbs("Structured data")}
      />
      <SeoStructuredDataSettingsForm />
    </div>
  )
}
