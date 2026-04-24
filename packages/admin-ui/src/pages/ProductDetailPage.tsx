import { useMemo } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { ProductContentTab } from "@/components/product-content/ProductContentTab"
import { Card } from "@/components/ui/Card"
import { MOCK_PRODUCTS } from "@/data/mockProducts"

type ProductTabId = "overview" | "content"

export function ProductDetailPage(): JSX.Element {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab: ProductTabId =
    searchParams.get("tab") === "content" ? "content" : "overview"

  const product = useMemo(() => {
    if (!productId) {
      return undefined
    }
    return MOCK_PRODUCTS.find((p) => p.id === productId)
  }, [productId])

  if (!productId) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">Missing product identifier.</p>
        <Link
          to="/products"
          className="mt-2 inline-block text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Back to products
        </Link>
      </div>
    )
  }

  const title = product?.title ?? productId
  const overviewTabId = "product-tab-overview"
  const contentTabId = "product-tab-content"

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/products"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-content-primary">{title}</h1>
        <p className="mt-1 text-sm text-content-tertiary">
          Mock product detail — content tab uses the Medusa admin content API when{" "}
          <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> is set.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Product sections"
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
              gallery for this product ({productId}).
            </p>
            {product ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-content-tertiary">Status</dt>
                  <dd className="font-medium capitalize text-content-primary">{product.status}</dd>
                </div>
                <div>
                  <dt className="text-content-tertiary">SKU</dt>
                  <dd className="font-mono text-content-primary">{product.sku}</dd>
                </div>
                <div>
                  <dt className="text-content-tertiary">Collection</dt>
                  <dd className="text-content-primary">{product.collection}</dd>
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
          <ProductContentTab productId={productId} productTitleFallback={title} />
        ) : null}
      </div>
    </div>
  )
}
