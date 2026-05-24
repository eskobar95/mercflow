/** Extract structured carrier products from opaque Shipmondo JSON responses. */

export type ShipmondoCarrierProductNormalized = {
  /** Shipmondo's service identifier (`product_code` style values). */
  productCode: string
  carrierCode: string | null
  name: string
  basePriceMinor: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function coerceToMinorUnitsFromUnknownPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value)) {
      return Math.round(value)
    }
    return Math.round(value * 100)
  }

  if (typeof value !== "string") {
    return null
  }

  const t = value.trim()
  if (t === "") {
    return null
  }

  const n = Number(t.replace(",", "."))
  if (!Number.isFinite(n)) {
    return null
  }

  /** Heuristic: small floats are majors — multiply by ×100 unless they already resemble minor units. */
  if (Math.abs(n) >= 500_000) {
    return Math.round(n)
  }

  const scaled = Math.round(n * 100)
  return Number.isFinite(scaled) ? scaled : null
}

function extractPriceMinorFromCarrierProductRow(raw: Record<string, unknown>): number | null {
  const numericKeys = [
    "sales_price_minor",
    "sales_price_without_vat_minor",
    "price_minor",
    "amount_minor",
  ] as const

  for (const key of numericKeys) {
    const v = raw[key]
    if (typeof v === "number" && Number.isFinite(v)) {
      return Math.round(v)
    }
    if (typeof v === "string") {
      const coerced = coerceToMinorUnitsFromUnknownPrice(v)
      if (coerced !== null) {
        return coerced
      }
    }
  }

  /** Nested `{ price: { amount }}` style payloads. */
  const price = raw.price
  if (isRecord(price)) {
    for (const field of ["amount", "excluding_vat", "including_vat", "sales_price_without_vat"] as const) {
      const out = coerceToMinorUnitsFromUnknownPrice(price[field])
      if (out !== null) {
        return out
      }
    }
  }

  for (const entry of ["sales_price", "sales_price_without_vat", "price", "minimum_price"]) {
    const out = coerceToMinorUnitsFromUnknownPrice(raw[entry])
    if (out !== null) {
      return out
    }
  }

  return null
}

function coerceNonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function extractProductRowsRoot(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed
  }

  if (!isRecord(parsed)) {
    return []
  }

  const keys = ["carrier_products", "products", "data", "items", "carrierProducts"] as const
  for (const key of keys) {
    const v = parsed[key]
    if (Array.isArray(v)) {
      return v
    }
  }

  return []
}

/** Parses opaque JSON into an admin-renderable catalogue row list. */
export function parseShipmondoCarrierProductsEnvelope(parsed: unknown): ShipmondoCarrierProductNormalized[] {
  const rows = extractProductRowsRoot(parsed)

  const out: ShipmondoCarrierProductNormalized[] = []

  for (const raw of rows) {
    if (!isRecord(raw)) {
      continue
    }

    const productCodeRaw =
      coerceNonEmptyText(raw.product_code) ??
      coerceNonEmptyText(raw.code) ??
      coerceNonEmptyText(raw.id) ??
      coerceNonEmptyText(raw.sku)

    if (productCodeRaw === null) {
      continue
    }

    const carrierCodeRaw =
      coerceNonEmptyText(raw.carrier_code) ??
      coerceNonEmptyText(raw.carrier) ??
      coerceNonEmptyText(raw.carrier_name)

    const name =
      coerceNonEmptyText(raw.name) ??
      coerceNonEmptyText(raw.description) ??
      coerceNonEmptyText(raw.title) ??
      productCodeRaw

    const basePriceMinor = extractPriceMinorFromCarrierProductRow(raw)
    if (basePriceMinor === null) {
      continue
    }

    out.push({
      productCode: productCodeRaw,
      carrierCode: carrierCodeRaw,
      name,
      basePriceMinor,
    })
  }

  out.sort((a, b) => {
    const byCarrier = (a.carrierCode ?? "").localeCompare(b.carrierCode ?? "")
    if (byCarrier !== 0) {
      return byCarrier
    }
    return a.productCode.localeCompare(b.productCode)
  })

  return out
}
