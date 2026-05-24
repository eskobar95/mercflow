import type { JSX } from "react"
import { Link } from "react-router-dom"

import { formatCategoryDescriptionPreview } from "@/components/product-categories/descriptionPreview"
import { Card } from "@/components/ui/Card"
import type { AdminProductCategoryParsed } from "@/features/product-categories/types"

export function CategoryOverviewSummary({
  category,
  categoryId,
}: {
  category: AdminProductCategoryParsed
  categoryId: string
}): JSX.Element {
  const preview = formatCategoryDescriptionPreview(category.description)

  return (
    <Card>
      <h2 className="text-lg font-semibold text-content-primary">Overview</h2>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-content-tertiary">Handle</dt>
          <dd className="font-mono text-content-primary">{category.handle}</dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Status</dt>
          <dd className="text-content-primary">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                category.is_active
                  ? "border-border-subtle bg-surface-subtle text-content-secondary"
                  : "border-border-default bg-surface-raised text-content-tertiary"
              }`}
            >
              {category.is_active ? "Active" : "Inactive"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Parent</dt>
          <dd className="text-content-primary">
            {category.parent_category ? (
              <Link
                className="font-medium text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                to={`/product-categories/${encodeURIComponent(category.parent_category.id)}`}
              >
                {category.parent_category.name}
              </Link>
            ) : category.parent_category_id ? (
              <span className="text-content-secondary">
                Linked to{' '}
                <code className="text-xs text-content-tertiary">{category.parent_category_id}</code>{' '}
                (parent name not expanded on this payload)
              </span>
            ) : (
              <span className="text-content-secondary">Top-level category</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Products linked</dt>
          <dd className="text-content-primary">{category.productCount}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
          Description preview
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          {preview ??
            "No plain-text description saved in Medusa for this category."}
        </p>
      </div>

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
