import { type ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import type { MetafieldDefinitionDto } from "@/features/metafields/types"

import { MetafieldTwoTierFields } from "./MetafieldTwoTierFields"

type CategoryOption = {
  id: string
  label: string
}

type ProductCategoryMetafieldsSectionProps = {
  selectedCategories: CategoryOption[]
  definitions: readonly MetafieldDefinitionDto[]
  drafts: Record<string, string>
  fieldErrors: Record<string, string>
  expandedSecondaryIds: ReadonlySet<string>
  disabled?: boolean
  onDraftChange: (definitionId: string, draft: string) => void
  onToggleSecondary: (definitionId: string) => void
}

function formatCategoryHeaderLabel(categories: readonly CategoryOption[]): string {
  if (categories.length === 0) {
    return "Category metafields"
  }
  if (categories.length === 1) {
    return categories[0]?.label ?? "Category metafields"
  }
  return categories.map((category) => category.label).join(", ")
}

export function ProductCategoryMetafieldsSection({
  selectedCategories,
  definitions,
  drafts,
  fieldErrors,
  expandedSecondaryIds,
  disabled = false,
  onDraftChange,
  onToggleSecondary,
}: ProductCategoryMetafieldsSectionProps): ReactNode {
  if (selectedCategories.length === 0) {
    return null
  }

  const headerLabel = formatCategoryHeaderLabel(selectedCategories)

  return (
    <section aria-labelledby="category-metafields-heading" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="category-metafields-heading" className="text-lg font-semibold text-content-primary">
          Category metafields
        </h2>
        <Badge variant="accent">{headerLabel}</Badge>
        <Badge variant="neutral">
          {definitions.length} {definitions.length === 1 ? "metafield" : "metafields"}
        </Badge>
      </div>

      <Card elevation="flat" className="space-y-4 p-6">
        {definitions.length === 0 ? (
          <p className="text-sm text-content-secondary">
            No category-scoped metafield definitions match the selected{" "}
            {selectedCategories.length === 1 ? "category" : "categories"} yet.
          </p>
        ) : (
          <MetafieldTwoTierFields
            definitions={definitions}
            drafts={drafts}
            fieldErrors={fieldErrors}
            expandedSecondaryIds={expandedSecondaryIds}
            disabled={disabled}
            onDraftChange={onDraftChange}
            onToggleSecondary={onToggleSecondary}
          />
        )}
      </Card>
    </section>
  )
}
