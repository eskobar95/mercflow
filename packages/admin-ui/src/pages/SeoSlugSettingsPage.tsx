import type { ReactNode } from "react"
import { SeoSlugSettingsForm } from "@/components/seo/SeoSlugSettingsForm"
import { PageHeader } from "@/components/ui/PageHeader"

export function SeoSlugSettingsPage(): ReactNode {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO — Slugs"
        description="Configure how MercFlow transliterates Nordic characters when generating product and category handles."
      />
      <SeoSlugSettingsForm />
    </div>
  )
}
