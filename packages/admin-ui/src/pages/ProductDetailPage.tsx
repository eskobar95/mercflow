import { useMemo } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { ProductGalleryStrip } from "@/components/products/ProductGalleryStrip"
import { ProductVariantsTable } from "@/components/products/ProductVariantsTable"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"

import type { ProductListRow } from "@/data/mockProducts"
import { MOCK_PRODUCTS } from "@/data/mockProducts"

import type { DetailVariantRow } from "@/hooks/products/useAdminProductDetail"
import { buildVariantRows, useAdminProductDetail } from "@/hooks/products/useAdminProductDetail"

import { resolveMedusaAssetUrl } from "@/lib/products/resolveMedusaAssetUrl"
import { previewPlainText } from "@/lib/text/previewPlainText"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type DetailTabId = "overview" | "variants"

function mockVariantFallback(row: ProductListRow): DetailVariantRow[] {
  return [
    {
      id: `${row.id}-mock-variant`,
      name: `${row.title} · default variant`,
      skuLabel: row.sku,
      priceLabel: row.priceRangeLabel,
      stockLabel: row.stockTotal === null ? "–" : String(row.stockTotal),
    },
  ]
}

export function ProductDetailPage(): JSX.Element {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const tab: DetailTabId = searchParams.get("tab") === "variants" ? "variants" : "overview"

  const detailQuery = useAdminProductDetail(hasBackend ? productId : undefined)

  const mockFallback = useMemo(() => {
    if (productId === undefined) {
      return undefined
    }
    return MOCK_PRODUCTS.find((row) => row.id === productId)
  }, [productId])

  const title =
    detailQuery.data?.title?.trim()
      ? detailQuery.data.title
      : mockFallback?.title ?? productId ?? "Product"

  const variantRows = detailQuery.data
    ? buildVariantRows(detailQuery.data)
    : mockFallback
      ? mockVariantFallback(mockFallback)
      : []

  const overviewDescription =
    previewPlainText(
      typeof detailQuery.data?.description === "string" ? detailQuery.data.description : "",
      400,
    ) ?? "MercFlow renders the Medusa `description` field here once your catalogue fills it."

  const galleryAssets = useMemo(() => {
    if (!detailQuery.data) {
      return [] as Array<{ alt: string; src: string }>
    }

    type GalleryWire = {
      url?: string | null
      alt?: string | null
    }

    const entries: Array<{ alt: string; src: string }> = []

    const pushImage = (rawUrl: unknown, altFallback: string): void => {
      if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
        return
      }
      const resolved = resolveMedusaAssetUrl(rawUrl.trim())
      if (resolved !== null) {
        entries.push({ alt: `${title}: ${altFallback}`, src: resolved })
      }
    }

    pushImage(detailQuery.data.thumbnail, "Thumbnail")

    const gallery = detailQuery.data.images
    const images = Array.isArray(gallery)
      ? (gallery as GalleryWire[])
      : []
    for (const img of images) {
      const raw = img.url
      if (typeof raw !== "string") {
        continue
      }
      pushImage(raw, typeof img.alt === "string" && img.alt.trim() !== "" ? img.alt.trim() : "Gallery asset")
    }

    const dedup = new Map<string, { alt: string; src: string }>()
    for (const item of entries) {
      dedup.set(item.src, item)
    }
    return [...dedup.values()]
  }, [detailQuery.data, title])

  if (productId === undefined) {
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

  const overviewTabId = "product-tab-overview"
  const variantsTabId = "product-tab-variants"

  const statusLabel = mockFallback?.status ?? detailQuery.data?.status ?? "draft"

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link
          to="/products"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Products
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-content-primary">{title}</h1>
          <Badge variant="neutral" className="capitalize">
            {statusLabel}
          </Badge>
          {hasBackend ? (
            <Link
              to={`/products/${productId}/edit`}
              className="rounded-md border border-border-subtle bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary hover:border-border-strong"
            >
              Edit product
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-content-tertiary">
          {hasBackend
            ? "Detail view reads GET /admin/products/:id plus variant inventory summaries."
            : "Mock catalogue — content editing debuts in Sprint 3; routing already matches canonical `/products/:id` IDs."}
        </p>

        {!hasBackend ? (
          <p className="mt-3 rounded-md border border-border-subtle bg-surface-subtle px-4 py-2 text-xs text-content-secondary">
            Connect `VITE_MEDUSA_ADMIN_BACKEND_URL` locally to hydrate real variants, thumbnails, and
            inventory quantities.
          </p>
        ) : null}

        {detailQuery.isNotAuthenticatedHint ? (
          <p className="mt-3 text-sm font-medium text-feedback-danger-content">
            Session missing — authenticate against Medusa Admin (cookie or bearer token) to load catalogue
            data.
          </p>
        ) : null}

        {detailQuery.errorMessage !== null &&
        !(detailQuery.isNotAuthenticatedHint) ? (
          <p className="mt-3 text-sm text-feedback-danger-content">{detailQuery.errorMessage}</p>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Product read views"
        className="mb-4 flex flex-wrap gap-1 border-b border-border-subtle"
      >
        <button
          type="button"
          role="tab"
          id={`${overviewTabId}-tab`}
          aria-selected={tab === "overview"}
          aria-controls={overviewTabId}
          tabIndex={tab === "overview" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
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
          id={`${variantsTabId}-tab`}
          aria-selected={tab === "variants"}
          aria-controls={variantsTabId}
          tabIndex={tab === "variants" ? 0 : -1}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            tab === "variants"
              ? "border-interactive-primary text-content-primary"
              : "border-transparent text-content-secondary hover:text-content-primary"
          }`}
          onClick={() => {
            setSearchParams({ tab: "variants" }, { replace: true })
          }}
        >
          Variants
        </button>
      </div>

      {detailQuery.isLoading && hasBackend ? (
        <Card>
          <p className="text-sm text-content-tertiary">Loading catalogue details…</p>
        </Card>
      ) : null}

      <div
        role="tabpanel"
        id={overviewTabId}
        aria-labelledby={`${overviewTabId}-tab`}
        hidden={tab !== "overview"}
      >
        {tab === "overview" ? (
          <Card>
            <div className="space-y-2">
              <div>
                <h2 className="text-lg font-semibold text-content-primary">Overview</h2>
                <p className="text-xs text-content-tertiary">
                  Operators stay oriented with description + media thumbnails on the same MercFlow shell.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-content-tertiary">Summary</p>
                <p className="mt-1 text-sm text-content-secondary">{overviewDescription}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-content-tertiary">Media previews</p>
                <div className="mt-3">
                  <ProductGalleryStrip thumbnails={galleryAssets} />
                </div>
              </div>

              {/* TODO: [Admin: Product … Sprint 3] — restore ProductContentTab routes once write-path UX ships */}
            </div>
          </Card>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={variantsTabId}
        aria-labelledby={`${variantsTabId}-tab`}
        hidden={tab !== "variants"}
      >
        {tab === "variants" ? (
          <Card>
            <div className="space-y-2 pb-4">
              <h2 className="text-lg font-semibold text-content-primary">Variants &amp; inventory</h2>
              <p className="text-xs text-content-tertiary">
                Each row combines Medusa variant pricing plus `inventory_quantity` so fulfilment telemetry lives
                next to SKU context.
              </p>
            </div>
            <ProductVariantsTable variants={variantRows} />
          </Card>
        ) : null}
      </div>
    </div>
  )
}
