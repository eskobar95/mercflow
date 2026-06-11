import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import type { SesDomainStatus } from "@/features/notifications/types"

const STATUS_VARIANT: Record<SesDomainStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  verified: "success",
  failed: "danger",
}

const STATUS_LABEL: Record<SesDomainStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  failed: "Failed",
}

export function SesDomainStatusBadge({ status }: { status: SesDomainStatus }): ReactNode {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
