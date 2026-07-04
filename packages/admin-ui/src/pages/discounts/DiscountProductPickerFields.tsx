import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { Input } from "@/components/ui/Input"
import {
  listAdminProductsForPicker,
  type AdminProductPickerRow,
} from "@/features/discounts/productsAdminApi"

type DiscountProductPickerFieldsProps = {
  productIds: string[]
  onProductIdsChange: (ids: string[]) => void
  disabled?: boolean
}

export function DiscountProductPickerFields({
  productIds,
  onProductIdsChange,
  disabled = false,
}: DiscountProductPickerFieldsProps): ReactNode {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [products, setProducts] = useState<AdminProductPickerRow[]>([])
  const [productsError, setProductsError] = useState<string | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      window.clearTimeout(timer)
    }
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoadingProducts(true)
    setProductsError(null)

    void listAdminProductsForPicker({ q: debouncedSearch, limit: 100 })
      .then((rows) => {
        if (!cancelled) {
          setProducts(rows)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProductsError(error instanceof Error ? error.message : "Failed to load products")
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProducts(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const toggleProduct = (id: string, checked: boolean): void => {
    const nextIds = checked ? [...productIds, id] : productIds.filter((entry) => entry !== id)
    onProductIdsChange(nextIds)
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-content-primary">Select products</legend>
      <Input
        id="discount-product-search"
        value={search}
        disabled={disabled}
        placeholder="Search products by name"
        aria-label="Search products"
        onChange={(event) => {
          setSearch(event.target.value)
        }}
      />
      {loadingProducts ? (
        <p className="text-sm text-content-secondary">Loading products…</p>
      ) : null}
      {productsError !== null ? (
        <p className="text-sm text-feedback-danger-content" role="alert">
          {productsError}
        </p>
      ) : null}
      {!loadingProducts && products.length === 0 ? (
        <p className="text-sm text-content-secondary">No products found in your catalog.</p>
      ) : null}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {products.map((product) => (
          <Checkbox
            key={product.id}
            id={`discount-product-${product.id}`}
            label={`${product.title} (${product.status})`}
            checked={productIds.includes(product.id)}
            disabled={disabled}
            onCheckedChange={(checked) => {
              toggleProduct(product.id, checked === true)
            }}
          />
        ))}
      </div>
      {productIds.length > 0 ? (
        <p className="text-xs text-content-tertiary">{productIds.length} product(s) selected</p>
      ) : null}
    </fieldset>
  )
}
