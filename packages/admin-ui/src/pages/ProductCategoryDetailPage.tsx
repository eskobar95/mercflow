import type { ReactNode } from "react"
import { useMemo } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Breadcrumb } from "@/components/ui/Breadcrumb"

import { CategoryContentTab } from "@/components/category-content/CategoryContentTab"
import { CategoryMetafieldsSection } from "@/components/metafields/CategoryMetafieldsSection"
import { CategoryOverviewSummary } from "@/components/product-categories/CategoryOverviewSummary"
import { ProductCategoryCrudForm } from "@/components/product-categories/ProductCategoryCrudForm"
import { Card } from "@/components/ui/Card"
import { useAdminProductCategoryDetail } from "@/features/product-categories"
import { buildHierarchyRowsFromCategories } from "@/features/product-categories/buildHierarchyRows"
import { buildParentCategorySelectOptions } from "@/features/product-categories/buildParentCategorySelectOptions"
import { collectSelfAndDescendantCategoryIds } from "@/features/product-categories/collectCategoryDescendants"
import { useProductCategoryTreePicklist } from "@/hooks/useProductCategoryTreePicklist"
import { useListReturnHref } from "@/hooks/useListReturnHref"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type CategoryTabId = "overview" | "content"

export function ProductCategoryDetailPage(): ReactNode {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoriesListHref = useListReturnHref("/product-categories")
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const navigate = useNavigate()

  const tab: CategoryTabId =
    searchParams.get("tab") === "content" ? "content" : "overview"

  const { state, reload: reloadDetail } = useAdminProductCategoryDetail(categoryId)

  const {
    categories: picklistCategories,
    loading: picklistLoading,
    errorMessage: picklistError,
    reload: reloadPicklist,
  } = useProductCategoryTreePicklist()

  const parentSelectOptions = useMemo(() => {
    const rows = buildHierarchyRowsFromCategories(picklistCategories)
    const excluded = categoryId
      ? collectSelfAndDescendantCategoryIds(picklistCategories, categoryId)
      : new Set<string>()
    return buildParentCategorySelectOptions(rows, excluded)
  }, [picklistCategories, categoryId])

  const title = useMemo((): string => {
    if (state.status === "success") {
      return state.category.name
    }
    return categoryId ?? "Category"
  }, [categoryId, state])

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

  const overviewTabId = "category-tab-overview"
  const contentTabId = "category-tab-content"

  let blockingCard: ReactNode | null = null

  if (state.status === "config_error") {
    blockingCard = (
      <Card>
        <h2 className="text-lg font-semibold text-content-primary">Configuration</h2>
        <p className="mt-2 text-sm text-content-secondary">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={() => {
            void reloadDetail()
          }}
        >
          Retry
        </button>
      </Card>
    )
  } else if (state.status === "error") {
    blockingCard = (
      <Card>
        <h2 className="text-lg font-semibold text-content-primary">Unable to load category</h2>
        <p className="mt-2 text-sm text-content-secondary">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={() => {
            void reloadDetail()
          }}
        >
          Retry
        </button>
      </Card>
    )
  } else if (state.status === "not_found") {
    blockingCard = (
      <Card>
        <p className="text-sm text-content-secondary">
          No category was found for{' '}
          <code className="text-xs text-content-tertiary">{categoryId}</code>.
        </p>
        <Link
          to="/product-categories"
          className="mt-3 inline-flex text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Back to categories
        </Link>
      </Card>
    )
  }

  const showLoadingCard = blockingCard === null && (state.status === "idle" || state.status === "loading")

  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: "Categories", href: categoriesListHref },
          { label: title },
        ]}
      />
      <div className="mb-6 mt-3">
        <h1 className="text-2xl font-semibold text-content-primary">{title}</h1>
        <p className="mt-1 text-sm text-content-tertiary">
          Details from Medusa Admin product-category APIs (Medusa-compatible session or bearer token required).
        </p>
      </div>

      {showLoadingCard ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-6 animate-pulse"
        >
          <div className="h-6 max-w-xs rounded-sm bg-surface-default" />
          <div className="mt-4 h-4 max-w-lg rounded-sm bg-surface-default" />
          <div className="mt-2 h-4 max-w-md rounded-sm bg-surface-default" />
        </div>
      ) : null}

      {blockingCard}

      {state.status === "success" ? (
        <>
          <div
            role="tablist"
            aria-label="Category sections"
            className="mb-4 flex gap-1 border-b border-border-subtle"
          >
            <button
              type="button"
              role="tab"
              id={`${overviewTabId}-trigger`}
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
              id={`${contentTabId}-trigger`}
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
            aria-labelledby={`${overviewTabId}-trigger`}
            hidden={tab !== "overview"}
          >
            {tab === "overview" ? (
              <div className="space-y-6">
                <ProductCategoryCrudForm
                  key={categoryId}
                  mode="edit"
                  categoryId={categoryId}
                  initialName={state.category.name}
                  initialHandle={state.category.handle}
                  initialParentCategoryId={state.category.parent_category_id}
                  initialIsActive={state.category.is_active}
                  parentSelectOptions={parentSelectOptions}
                  parentOptionsLoading={picklistLoading}
                  parentOptionsError={picklistError}
                  onReloadParentOptions={reloadPicklist}
                  onUpdated={() => {
                    void reloadDetail()
                    void reloadPicklist()
                  }}
                  onDeleted={() => {
                    navigate("/product-categories")
                  }}
                />
                {hasBackend ? (
                  <CategoryMetafieldsSection categoryId={categoryId} />
                ) : (
                  <Card>
                    <p className="text-sm text-content-secondary">
                      Connect{" "}
                      <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to edit category
                      metafields.
                    </p>
                  </Card>
                )}
                <CategoryOverviewSummary category={state.category} categoryId={categoryId} />
              </div>
            ) : null}
          </div>

          <div
            role="tabpanel"
            id={contentTabId}
            aria-labelledby={`${contentTabId}-trigger`}
            hidden={tab !== "content"}
          >
            {tab === "content" ? (
              hasBackend ? (
                <CategoryContentTab categoryId={categoryId} categoryTitleFallback={title} />
              ) : (
                <Card>
                  <p className="text-sm text-content-secondary">
                    Connect{" "}
                    <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to load MercFlow
                    category CMS content for this tab.
                  </p>
                </Card>
              )
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
