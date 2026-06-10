import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import type { MetafieldValueType } from "@/features/metafields/types"
import { labelForMetafieldValueType } from "@/features/metafields/valueTypeLabels"

type MetafieldTypeBadgeProps = {
  type: MetafieldValueType
}

export function MetafieldTypeBadge({ type }: MetafieldTypeBadgeProps): ReactNode {
  return <Badge variant="neutral">{labelForMetafieldValueType(type)}</Badge>
}
