import type { UnifiedCatalogProductFormErrors } from "@/hooks/products/useUnifiedCatalogProductForm"
import type { VariantRowModel } from "@/lib/products/productOptionMatrix"

export function summarizeVariantRow(selections: VariantRowModel["selections"]): string {
  const keys = Object.keys(selections).sort((a, b) => a.localeCompare(b))

  const parts = keys.map((dimension) => selections[dimension])
  const joined = parts.join(" · ")

  if (joined.trim() === "") {
    return "Variant"
  }

  return joined
}

export function formatFieldErrorsIntoMessage(errors: UnifiedCatalogProductFormErrors): string {
  const parts = Object.values(errors)
  if (parts.length === 0) {
    return ""
  }
  return parts.join(" ")
}
