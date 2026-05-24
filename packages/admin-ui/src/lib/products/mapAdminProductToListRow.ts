import type { AdminPrice } from "@medusajs/types"

import type { ProductListRow } from "@/data/mockProducts"

import { resolveMedusaAssetUrl } from "@/lib/products/resolveMedusaAssetUrl"

type AdminProductWire = {
  id: string
  title?: string | null
  status?: string | null
  thumbnail?: string | null
  updated_at?: string | null
  variants?: VariantWire[] | null
}

type VariantWire = {
  sku?: string | null
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  prices?: AdminPrice[] | null
}

const DISPLAY_STATUS: Record<string, ProductListRow["status"]> = {
  draft: "draft",
  proposed: "proposed",
  published: "published",
  rejected: "draft",
}

function normalizeStatus(raw: string | null | undefined): ProductListRow["status"] {
  if (raw !== undefined && raw !== null && DISPLAY_STATUS[raw] !== undefined) {
    return DISPLAY_STATUS[raw]
  }
  return "draft"
}

/**
 * Converts Medusa `AdminPrice.amount` (smallest currency unit) to localized display strings.
 */
function formatMinorAmount(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${currencyCode.toUpperCase()} ${(amount / 100).toFixed(2)}`
  }
}

export function formatPriceRangeLabel(prices: AdminPrice[]): string {
  const amountsWithCurrency = prices
    .filter((p) => typeof p.amount === "number" && typeof p.currency_code === "string")
    .map((p) => ({ amount: p.amount, currency: p.currency_code }))

  if (amountsWithCurrency.length === 0) {
    return "–"
  }

  const currencies = [...new Set(amountsWithCurrency.map((p) => p.currency))]
  const baseline = amountsWithCurrency[0]
  if (baseline === undefined) {
    return "–"
  }
  const firstCurrency = currencies[0] ?? baseline.currency
  const sameCurrencyAmounts = amountsWithCurrency.filter((p) => p.currency === firstCurrency).map((p) => p.amount)
  const min = Math.min(...sameCurrencyAmounts)
  const max = Math.max(...sameCurrencyAmounts)

  if (min === max) {
    return formatMinorAmount(min, firstCurrency)
  }
  return `${formatMinorAmount(min, firstCurrency)} – ${formatMinorAmount(max, firstCurrency)}`
}

export function mapAdminProductToListRow(product: AdminProductWire, indexHue: number): ProductListRow {
  const variants = product.variants ?? []
  let stockTotal = 0
  let hasMeasuredStock = false
  for (const v of variants) {
    if (v.manage_inventory === false) {
      continue
    }
    if (typeof v.inventory_quantity === "number") {
      stockTotal += v.inventory_quantity
      hasMeasuredStock = true
    }
  }

  const priceLabels: string[] = []
  for (const v of variants) {
    const label = formatPriceRangeLabel(v.prices ?? [])
    if (label !== "–") {
      priceLabels.push(label)
    }
  }
  const priceRangeLabel = priceLabels.length === 0 ? "–" : [...new Set(priceLabels)].join(" · ")

  const sku = variants[0]?.sku?.trim() || "—"

  const thumbUrl = resolveMedusaAssetUrl(product.thumbnail ?? null)

  return {
    id: product.id,
    title: product.title?.trim() || product.id,
    status: normalizeStatus(product.status),
    collection: "—",
    sku,
    updatedAt:
      typeof product.updated_at === "string" && product.updated_at.trim() !== ""
        ? product.updated_at
        : new Date().toISOString(),
    thumbnailHue: indexHue % 360,
    thumbnailUrl: thumbUrl,
    variantsCount: variants.length,
    stockTotal: hasMeasuredStock ? stockTotal : null,
    priceRangeLabel,
  }
}
