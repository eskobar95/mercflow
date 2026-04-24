import { useMemo } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { CategoryContentTab } from "@/components/category-content/CategoryContentTab"
import { Card } from "@/components/ui/Card"
import {
  MOCK_PRODUCT_CATEGORIES,
  type ProductCategoryListRow,
} from "@/data/mockProductCategories"

type CategoryTabId = "overview" | "content"

export function ProductCategoryDetailPage(): JSX.Element {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab: CategoryTabId =
    searchParams.get("tab") === "content" ? "content" : "overview"

  const category = useMemo((): ProductCategoryListRow | undefined => {
    if (!categoryId) {
      return undefined
    }
    return MOCK_PRODUCT_CATEGORIES.find((c) => c.id === categoryId)
  }, [categoryId])

  if (!categoryId) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">Missing category identifier.</p>
        <Link
          to="/product-categories"
          className="mt-2 inline-block text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Back to product categories
        </Link>
      </div>
    )
  }

  const title = category?.name ?? categoryId
  const overviewTabId = "category-tab-overview"
  const contentTabId = "category-tab-content"

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/product-categories"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Product categories
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">{title}</h1>
        <p className="mt-1 text-sm text-content-tertiary">
          Mock category detail — content tab uses the Medusa admin category content API when{" "}
          <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> is set.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Category sections"
        className="mb-4 flex gap-1 border-b border-border-subtle"
      >
        <button
          type="button"
          role="tab"
          id={`${overviewTabId}-tab`}
          aria-selected={tab === "overview"}
          aria-controls={overviewTabId}
          tabIndex={tab === "overview" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "overview"
              ? "border-interactive-primary text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
          onClick={() => {
            setSearchParams({}, { replace: true })
          }}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          id={`${contentTabId}-tab`}
          aria-selected={tab === "content"}
          aria-controls={contentTabId}
          tabIndex={tab === "content" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "content"
              ? "border-interactive-primary text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
          onClick={() => {
            setSearchParams({ tab: "content" }, { replace: true })
          }}
        >
          Content
        </button>
      </div>

      <div
        role="tabpanel"
        id={overviewTabId}
        aria-labelledby={`${overviewTabId}-tab`}
        hidden={tab !== "overview"}
      >
        {tab === "overview" ? (
          <Card>
            <h2 className="text-lg font-semibold text-content-primary">Overview</h2>
            <p className="mt-2 text-sm text-content-secondary">
              Placeholder for catalog fields. Open the Content tab to edit description, SEO, and
              image IDs for this category ({categoryId}).
            </p>
            {category ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-content-tertiary">Handle</dt>
                  <dd className="font-mono text-content-primary">{category.handle}</dd>
                </div>
                <div>
                  <dt className="text-content-tertiary">Products</dt>
                  <dd className="text-content-primary">{category.productCount}</dd>
                </div>
              </dl>
            ) : null}
          </Card>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={contentTabId}
        aria-labelledby={`${contentTabId}-tab`}
        hidden={tab !== "content"}
      >
        {tab === "content" ? (
          <CategoryContentTab
            categoryId={categoryId}
            categoryTitleFallback={title}
          />
        ) : null}
      </div>
    </div>
  )
}
