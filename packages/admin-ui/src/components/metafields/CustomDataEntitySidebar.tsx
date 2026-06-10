import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/cn"
import type { CustomDataEntityKey } from "@/features/metafields/types"

type EntityOption = {
  key: CustomDataEntityKey
  label: string
  available: boolean
}

const ENTITY_OPTIONS: EntityOption[] = [
  { key: "product", label: "Products", available: true },
  { key: "category", label: "Categories", available: true },
  { key: "variant", label: "Variants", available: false },
  { key: "order", label: "Orders", available: false },
  { key: "customer", label: "Customers", available: false },
]

type CustomDataEntitySidebarProps = {
  activeEntity: CustomDataEntityKey
  onSelectEntity: (entity: CustomDataEntityKey) => void
}

export function CustomDataEntitySidebar({
  activeEntity,
  onSelectEntity,
}: CustomDataEntitySidebarProps): ReactNode {
  return (
    <nav aria-label="Custom data entities" className="space-y-1">
      {ENTITY_OPTIONS.map((option) => {
        const isActive = option.available && option.key === activeEntity
        const baseClass =
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors"

        if (!option.available) {
          return (
            <div
              key={option.key}
              className={cn(baseClass, "cursor-not-allowed text-content-tertiary")}
              aria-disabled="true"
            >
              <span>{option.label}</span>
              <Badge variant="neutral">Coming soon</Badge>
            </div>
          )
        }

        return (
          <button
            key={option.key}
            type="button"
            className={cn(
              baseClass,
              isActive
                ? "bg-surface-subtle font-medium text-content-primary"
                : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
            )}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              onSelectEntity(option.key)
            }}
          >
            {option.label}
          </button>
        )
      })}
    </nav>
  )
}
