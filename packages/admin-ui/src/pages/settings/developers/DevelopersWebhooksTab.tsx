import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"

export function DevelopersWebhooksTab(): ReactNode {
  return (
    <Card className="p-6 lg:p-8">
      <h2 className="text-lg font-semibold text-content-primary">Webhook management coming soon</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-content-secondary">
        Webhooks let your storefront or external services receive real-time notifications when
        orders, products, or inventory change in your store. You will be able to register endpoints,
        choose events, and review delivery logs from this tab in a future release.
      </p>
    </Card>
  )
}
