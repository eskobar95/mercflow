import type { AdminProduct } from "@medusajs/types"

import {
  buildVariantComboKey,
  DEFAULT_SINGLE_OPTION_TITLE,
  DEFAULT_SINGLE_OPTION_VALUE,
  type ProductOptionRowModel,
  type VariantRowModel,
} from "@/lib/products/productOptionMatrix"

import { readVariantSelections } from "@/lib/products/productUnifiedPersistence"

export function hydrateEditorModelsFromAdminProduct(product: AdminProduct): {
  optionRows: ProductOptionRowModel[]
  variantRows: VariantRowModel[]
} {
  const options = product.options

  let optionRows: ProductOptionRowModel[] = []

  if (Array.isArray(options) && options.length > 0) {
    optionRows = options.map((option) => {
      const values = (option.values ?? []).flatMap((value) => {
        const trimmed =
          typeof value.value === "string" ? value.value.trim() : String(value.value)
        return trimmed !== "" ? [trimmed] : []
      })

      return {
        medusaOptionId: option.id,
        title:
          typeof option.title === "string" && option.title.trim() !== ""
            ? option.title.trim()
            : "Untitled option",
        values,
      }
    })
  }

  const variantsList = Array.isArray(product.variants) ? product.variants : []

  const variantRows: VariantRowModel[] = variantsList.map((variant) => {
    let selections = readVariantSelections(variant)

    if (Object.keys(selections).length === 0) {
      selections = {
        [DEFAULT_SINGLE_OPTION_TITLE]:
          typeof variant.title === "string" && variant.title.trim() !== ""
            ? variant.title.trim()
            : DEFAULT_SINGLE_OPTION_VALUE,
      }
    }

    const comboKey = buildVariantComboKey(selections)

    let priceMinor: number | undefined
    const pricesList = variant.prices ?? []
    for (const price of pricesList) {
      if (typeof price.currency_code === "string" && price.currency_code.toLowerCase() === "dkk") {
        const raw = price.amount
        if (typeof raw === "number" && Number.isFinite(raw)) {
          priceMinor = raw
        }
        break
      }
    }

    const priceDkk =
      priceMinor !== undefined ? (priceMinor / 100).toFixed(2).replace(/\.00$/u, "") : ""

    const stockQty =
      typeof variant.inventory_quantity === "number" && Number.isFinite(variant.inventory_quantity)
        ? String(Math.max(0, Math.floor(variant.inventory_quantity)))
        : ""

    return {
      comboKey,
      selections,
      priceDkk,
      stock: stockQty,
      medusaVariantId: variant.id,
    }
  })

  return {
    optionRows,
    variantRows,
  }
}
