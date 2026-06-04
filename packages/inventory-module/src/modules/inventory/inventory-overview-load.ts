import type { InventoryOverviewRow } from "./inventory-overview-types"
import { computeAvailable, isLowStock } from "./inventory-overview-math"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function variantTitle(row: Record<string, unknown>): string {
  const product = row.product
  const productTitle =
    isRecord(product) && typeof product.title === "string" ? product.title : ""
  const variantTitle =
    typeof row.title === "string" && row.title.trim() !== "" ? row.title : ""
  if (productTitle && variantTitle) {
    return `${productTitle} — ${variantTitle}`
  }
  return variantTitle || productTitle || "Variant"
}

function aggregateLevelsFromInventoryItem(item: Record<string, unknown>): {
  stocked: number
  reserved: number
} {
  const levels = item.location_levels
  if (!Array.isArray(levels)) {
    return { stocked: 0, reserved: 0 }
  }
  let stocked = 0
  let reserved = 0
  for (const level of levels) {
    if (!isRecord(level)) {
      continue
    }
    stocked += readNumber(level.stocked_quantity)
    reserved += readNumber(level.reserved_quantity)
  }
  return { stocked, reserved }
}

function aggregateVariantInventory(row: Record<string, unknown>): {
  stocked: number
  reserved: number
} {
  const items = row.inventory_items
  if (!Array.isArray(items) || items.length === 0) {
    const fallback = readNumber(row.inventory_quantity)
    return { stocked: fallback, reserved: 0 }
  }

  let stocked = 0
  let reserved = 0
  for (const link of items) {
    if (!isRecord(link)) {
      continue
    }
    const item = link.inventory_item ?? link.inventory
    if (!isRecord(item)) {
      continue
    }
    const totals = aggregateLevelsFromInventoryItem(item)
    stocked += totals.stocked
    reserved += totals.reserved
  }

  if (stocked === 0 && reserved === 0) {
    const fallback = readNumber(row.inventory_quantity)
    return { stocked: fallback, reserved: 0 }
  }

  return { stocked, reserved }
}

export function buildOverviewRowsFromVariants(params: {
  variantRows: unknown[]
  incomingByVariant: Map<string, number>
  lowStockThreshold: number
}): InventoryOverviewRow[] {
  const rows: InventoryOverviewRow[] = []

  for (const raw of params.variantRows) {
    if (!isRecord(raw) || typeof raw.id !== "string") {
      continue
    }
    const { stocked, reserved } = aggregateVariantInventory(raw)
    const available = computeAvailable(stocked, reserved)
    const incoming = params.incomingByVariant.get(raw.id) ?? 0
    rows.push({
      variant_id: raw.id,
      sku: typeof raw.sku === "string" ? raw.sku : null,
      title: variantTitle(raw),
      stocked,
      reserved,
      available,
      incoming,
      is_low_stock: isLowStock(available, params.lowStockThreshold),
    })
  }

  return rows
}

export function filterAndPaginateOverviewRows(
  rows: InventoryOverviewRow[],
  params: {
    search: string
    filter: "all" | "low_stock"
    page: number
    limit: number
  }
): { rows: InventoryOverviewRow[]; count: number } {
  const needle = params.search.trim().toLowerCase()
  let filtered = rows
  if (needle !== "") {
    filtered = filtered.filter((row) => {
      const haystack = `${row.title} ${row.sku ?? ""} ${row.variant_id}`.toLowerCase()
      return haystack.includes(needle)
    })
  }
  if (params.filter === "low_stock") {
    filtered = filtered.filter((row) => row.is_low_stock)
  }

  const count = filtered.length
  const offset = (params.page - 1) * params.limit
  return {
    rows: filtered.slice(offset, offset + params.limit),
    count,
  }
}
