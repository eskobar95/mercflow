import type { ReactNode } from "react"
import { SeoOrganizationSettingsForm } from "@/components/seo/SeoOrganizationSettingsForm"
import { PageHeader } from "@/components/ui/PageHeader"

export function SeoOrganizationSettingsPage(): ReactNode {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="SEO — Organisation"
        description="Storefront URL and organisation identity for JSON-LD, canonical URLs, and public SEO routes."
      />
      <SeoOrganizationSettingsForm />
    </div>
  )
}
