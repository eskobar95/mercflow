import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"

type EditorSectionProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

/**
 * Card wrapper with a Linear-style micro-label header — unifies the visual
 * rhythm of every editor block across the product tabs.
 */
export function EditorSection({ title, description, action, children }: EditorSectionProps): ReactNode {
  return (
    <Card compact elevation="flat">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xs font-semibold uppercase tracking-label text-content-tertiary">{title}</h2>
          {description !== undefined ? (
            <p className="mt-1 text-xs text-content-tertiary">{description}</p>
          ) : null}
        </div>
        {action !== undefined ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}
