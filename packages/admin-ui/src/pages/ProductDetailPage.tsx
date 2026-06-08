import { type ReactNode, useMemo } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"

import { usePageChrome } from "@/components/layout/pageChrome"
import { ProductContentSeoTab } from "@/components/products/content/ProductContentSeoTab"
import { ProductDetailActions } from "@/components/products/ProductDetailActions"
import { ProductSaveBar } from "@/components/products/editor/ProductSaveBar"
import { useProductEditor } from "@/components/products/editor/useProductEditor"
import { ProductOverviewTab } from "@/components/products/overview/ProductOverviewTab"
import { ProductRelationsTab } from "@/components/products/relations/ProductRelationsTab"
import { ProductVariantsTab } from "@/components/products/variants/ProductVariantsTab"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { useAdminProductDetail } from "@/hooks/products/useAdminProductDetail"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type DetailTab = "overview" | "variants" | "content" | "relations"

const TAB_IDS: DetailTab[] = ["overview", "variants", "content", "relations"]

function resolveTab(raw: string | null): DetailTab {
  return raw !== null && (TAB_IDS as string[]).includes(raw) ? (raw as DetailTab) : "overview"
}

function statusBadge(status: string | undefined): ReactNode {
  const variant =
    status === "published"
      ? "success"
      : status === "proposed"
        ? "warning"
        : status === "rejected"
          ? "danger"
          : "neutral"
  return (
    <Badge variant={variant} dot className="capitalize">
      {status ?? "draft"}
    </Badge>
  )
}

export function ProductDetailPage(): ReactNode {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const tab = resolveTab(searchParams.get("tab"))
  const detailQuery = useAdminProductDetail(hasBackend ? productId : undefined)
  const product = detailQuery.data
  const editor = useProductEditor({ product, productId: productId ?? "" })

  const title = product?.title?.trim() ? product.title : (productId ?? "Product")

  const setTab = (next: string): void => {
    if (next === "overview") {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ tab: next }, { replace: true })
    }
  }

  const chrome = useMemo(
    () => ({
      titleOverride: title,
      titleBadge: product !== undefined ? statusBadge(product.status) : null,
      actions:
        productId !== undefined && hasBackend ? (
          <ProductDetailActions productId={productId} productTitle={title} />
        ) : null,
    }),
    [title, product, productId, hasBackend],
  )
  usePageChrome(chrome)

  if (productId === undefined) {
    return (
      <div className="p-6">
        <Link to="/products" className="text-sm font-medium text-interactive-primary">
          ← Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 pb-2 md:p-6 md:pb-2">
      <Link
        to="/products"
        className="mb-3 inline-flex items-center gap-1 text-xs text-content-tertiary transition-colors duration-150 hover:text-content-secondary"
      >
        ← Products
      </Link>

      {!hasBackend ? (
        <p className="mb-4 rounded-md border border-border-subtle bg-surface-subtle px-4 py-2 text-xs text-content-secondary">
          Connect <code className="font-mono">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to edit live catalogue data.
        </p>
      ) : null}

      {detailQuery.isNotAuthenticatedHint ? (
        <p className="mb-4 rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-2 text-xs font-medium text-feedback-danger-content">
          Session expired — authenticate against Medusa Admin to load catalogue data.
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} baseId="product-detail" className="mb-5">
        <TabsList aria-label="Product sections" className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="content">Content &amp; SEO</TabsTrigger>
          <TabsTrigger value="relations">Relations</TabsTrigger>
        </TabsList>

        {detailQuery.isLoading && hasBackend ? (
          <Card compact>
            <div className="flex items-center gap-2 text-sm text-content-tertiary">
              <Spinner size="sm" /> Loading product…
            </div>
          </Card>
        ) : product === undefined ? (
          <Card compact>
            <p className="text-sm text-content-secondary">
              {detailQuery.errorMessage ?? "Connect to the Medusa backend to load this product."}
            </p>
          </Card>
        ) : (
          <>
            <TabsContent value="overview">
              <ProductOverviewTab
                product={product}
                productId={productId}
                editor={editor}
                onManageVariants={() => setTab("variants")}
              />
            </TabsContent>
            <TabsContent value="variants">
              <ProductVariantsTab product={product} productId={productId} />
            </TabsContent>
            <TabsContent value="content">
              <ProductContentSeoTab product={product} productId={productId} title={title} />
            </TabsContent>
            <TabsContent value="relations">
              <ProductRelationsTab metadata={editor.draft.metadata} onChange={editor.setMetadata} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <ProductSaveBar
        visible={editor.isDirty && tab !== "content"}
        saving={editor.isSaving}
        canSave={editor.canSave}
        onSave={() => {
          void editor.save()
        }}
        onDiscard={editor.discard}
      />
    </div>
  )
}
