import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { labelForPackagingType } from "@/features/packaging/packagingTypeLabels"
import type { PackagingTypeKind } from "@/features/packaging/types"

type PackagingTypeBadgeProps = {
  type: PackagingTypeKind
}

export function PackagingTypeBadge({ type }: PackagingTypeBadgeProps): ReactNode {
  return <Badge variant="neutral">{labelForPackagingType(type)}</Badge>
}
