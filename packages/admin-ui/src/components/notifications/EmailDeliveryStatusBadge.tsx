import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import type { EmailDeliveryStatus } from "@/features/notifications/emailDeliveryTypes"

const STATUS_VARIANT: Record<
  EmailDeliveryStatus,
  "neutral" | "accent" | "success" | "warning" | "danger"
> = {
  queued: "accent",
  sent: "success",
  failed: "danger",
  dead_letter: "warning",
}

const STATUS_LABEL: Record<EmailDeliveryStatus, string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  dead_letter: "Dead Letter",
}

export function EmailDeliveryStatusBadge({ status }: { status: EmailDeliveryStatus }): ReactNode {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
