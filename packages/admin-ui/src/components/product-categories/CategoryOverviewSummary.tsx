import type { ReactNode } from "react"

import { formatCategoryDescriptionPreview } from "@/components/product-categories/descriptionPreview"
import { Card } from "@/components/ui/Card"
import type { AdminProductCategoryParsed } from "@/features/product-categories/types"

export function CategoryOverviewSummary({
  category,
  categoryId,
}: {
  category: AdminProductCategoryParsed
  categoryId: string
}): ReactNode {
  const preview = formatCategoryDescriptionPreview(category.description)

  return (
    <Card>
      <h2 className="text-lg font-semibold text-content-primary">About this category</h2>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
          Description preview
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          {preview ??
            "No plain-text description saved in Medusa for this category."}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-content-tertiary">Products linked</dt>
          <dd className="text-content-primary">{category.productCount}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border-subtle pt-4">
        <p className="text-xs text-content-tertiary">
          Category id <code>{categoryId}</code>
          {' · '}
          Last updated{' '}
          <time dateTime={category.updated_at}>
            {new Date(category.updated_at).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        </p>
      </div>
    </Card>
  )
}
