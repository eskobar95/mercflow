import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import type { DiscountFormType } from "@/features/discounts/discountFormTypes"

type DiscountTypeOption = {
  type: DiscountFormType
  title: string
  description: string
  available: boolean
}

const DISCOUNT_TYPE_OPTIONS: DiscountTypeOption[] = [
  {
    type: "product",
    title: "Product discount",
    description: "Reduce prices on products, collections, or your entire catalog.",
    available: true,
  },
  {
    type: "order",
    title: "Order discount",
    description: "Reduce the total order amount at checkout.",
    available: true,
  },
  {
    type: "buyget",
    title: "Buy X get Y",
    description: "Reward customers when they buy a qualifying quantity or amount.",
    available: true,
  },
  {
    type: "free_shipping",
    title: "Free shipping",
    description: "Waive shipping costs for qualifying orders.",
    available: true,
  },
]

type DiscountTypeSelectorProps = {
  selectedType: DiscountFormType | null
  onSelect: (type: DiscountFormType) => void
}

export function DiscountTypeSelector({
  selectedType,
  onSelect,
}: DiscountTypeSelectorProps): ReactNode {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {DISCOUNT_TYPE_OPTIONS.map((option) => {
        const isSelected = selectedType === option.type
        return (
          <button
            key={option.type}
            type="button"
            disabled={!option.available}
            aria-pressed={isSelected}
            className="text-left disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              if (option.available) {
                onSelect(option.type)
              }
            }}
          >
            <Card
              compact
              elevation="hover"
              className={
                isSelected
                  ? "h-full border-accent bg-accent-subtle"
                  : "h-full transition-colors hover:border-border-strong"
              }
            >
              <div className="flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-content-primary">{option.title}</h2>
                  {!option.available ? (
                    <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-medium text-content-secondary">
                      Coming soon
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-content-secondary">{option.description}</p>
              </div>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
