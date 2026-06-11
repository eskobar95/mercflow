import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"

const TEMPLATE_LABELS: Record<string, string> = {
  "order-confirmation": "Order confirmation",
  "shipping-update": "Shipping update",
  "order-cancellation": "Order cancellation",
  "customer-welcome": "Customer welcome",
}

function formatTemplateKey(templateKey: string): string {
  const label = TEMPLATE_LABELS[templateKey]
  if (label !== undefined) {
    return label
  }
  return templateKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function EmailTemplateKeyBadge({ templateKey }: { templateKey: string }): ReactNode {
  return <Badge variant="neutral">{formatTemplateKey(templateKey)}</Badge>
}
