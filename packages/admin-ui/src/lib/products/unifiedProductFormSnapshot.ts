import type { ProductOptionRowModel } from "@/lib/products/productOptionMatrix"

type VariantEconomicsSnapshot = {
  priceDkk: string
  stock: string
  medusaVariantId?: string | null
}

export type UnifiedCatalogFormSnapshot = {
  title: string
  description: string
  isPublished: boolean
  optionRows: ProductOptionRowModel[]
  economicsMap: Record<string, VariantEconomicsSnapshot>
  categoryIds: string[]
}

export function captureUnifiedCatalogFormSnapshot(params: {
  title: string
  description: string
  isPublished: boolean
  optionRows: ProductOptionRowModel[]
  economicsMap: Partial<
    Record<
      string,
      {
        priceDkk: string
        stock: string
        medusaVariantId?: string | null
      }
    >
  >
  selectedCategoryIds: ReadonlySet<string>
}): UnifiedCatalogFormSnapshot {
  const economicsMap: Record<string, VariantEconomicsSnapshot> = {}
  const economicsKeys = Object.keys(params.economicsMap).sort()

  for (const key of economicsKeys) {
    const row = params.economicsMap[key]
    if (row === undefined) {
      continue
    }
    economicsMap[key] = {
      priceDkk: row.priceDkk,
      stock: row.stock,
      medusaVariantId: row.medusaVariantId ?? null,
    }
  }

  return {
    title: params.title,
    description: params.description,
    isPublished: params.isPublished,
    optionRows: params.optionRows.map((row) => ({
      title: row.title,
      values: [...row.values],
    })),
    economicsMap,
    categoryIds: [...params.selectedCategoryIds].sort(),
  }
}

export function unifiedCatalogFormSnapshotsEqual(
  left: UnifiedCatalogFormSnapshot,
  right: UnifiedCatalogFormSnapshot,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
