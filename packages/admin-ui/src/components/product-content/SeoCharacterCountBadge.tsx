import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"

type SeoCharacterCountBadgeProps = {
  current: number
  max: number
}

export function SeoCharacterCountBadge({
  current,
  max,
}: SeoCharacterCountBadgeProps): ReactNode {
  const overLimit = current > max

  return (
    <Badge variant={overLimit ? "danger" : "neutral"} aria-live="polite">
      {current} / {max}
    </Badge>
  )
}
