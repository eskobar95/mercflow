import type { JSX } from "react"

import { Badge } from "@/components/ui/Badge"

const STATUS_VARIANT: Record<
  string,
  "neutral" | "accent" | "success" | "warning" | "danger"
> = {
  draft: "neutral",
  ordered: "accent",
  partially_received: "warning",
  received: "success",
  cancelled: "danger",
}

export function PoStatusBadge({ status }: { status: string }): JSX.Element {
  const variant = STATUS_VARIANT[status] ?? "neutral"
  const label = status.replace(/_/g, " ")
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}
