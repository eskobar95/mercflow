import type { JSX } from "react"
import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ProductCategoryCrudForm } from "@/components/product-categories/ProductCategoryCrudForm"
import { buildHierarchyRowsFromCategories } from "@/features/product-categories/buildHierarchyRows"
import { buildParentCategorySelectOptions } from "@/features/product-categories/buildParentCategorySelectOptions"
import { useProductCategoryTreePicklist } from "@/hooks/useProductCategoryTreePicklist"

/**
 * Create category — POST /admin/product-categories (Medusa). Configure
 * `VITE_MEDUSA_ADMIN_BACKEND_URL` for live API; parent list loads in tree order.
 */
export function ProductCategoryNewPage(): JSX.Element {
  const navigate = useNavigate()
  const { categories, loading, errorMessage, reload } = useProductCategoryTreePicklist()

  const parentSelectOptions = useMemo(() => {
    const rows = buildHierarchyRowsFromCategories(categories)
    return buildParentCategorySelectOptions(rows, new Set())
  }, [categories])

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-content-primary">
          New product category
        </h1>
        <ProductCategoryCrudForm
          mode="create"
          initialName=""
          initialHandle=""
          initialParentCategoryId={null}
          initialIsActive
          parentSelectOptions={parentSelectOptions}
          parentOptionsLoading={loading}
          parentOptionsError={errorMessage}
          onReloadParentOptions={reload}
          onCreated={(c) => {
            navigate(`/product-categories/${encodeURIComponent(c.id)}`)
          }}
        />
        <p className="mt-4 text-center text-sm text-content-tertiary">
          <Link
            to="/product-categories"
            className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            Back to product categories
          </Link>
        </p>
      </div>
    </div>
  )
}
