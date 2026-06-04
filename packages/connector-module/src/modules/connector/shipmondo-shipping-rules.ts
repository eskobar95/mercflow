import { z } from "zod"

/**
 * Normalized Shipmondo shipping rule settings consumed by MercFlow admin + storefront helpers.
 */
export type ShipmondoShippingRulesNormalized = {
  markupAmountMinor: number
  freeShippingThresholdMinor: number
  enabledCarrierCodes: string[]
}

/**
 * Persisted connector_config.rules_json payload (MercFlow canonical keys).
 */
export type ShipmondoRulesJsonStored = {
  markup_amount_minor: number
  free_shipping_threshold_minor: number
  enabled_carrier_codes: string[]
}

const RULES_UPPER = 99_999_999

/** Validation for inbound admin PATCH payloads (camelCase REST). */
export const shipmondoPatchShippingRulesBodySchema = z
  .object({
    markupAmountMinor: z.number().int().min(0).max(RULES_UPPER),
    /**
     * Free shipping applies when cart subtotal (excl. shipping) is at or above this amount (minor units).
     */
    freeShippingThresholdMinor: z.number().int().min(0).max(RULES_UPPER),
    /**
     * Shipmondo `product_code` values that remain selectable — empty ⇒ unrestricted (caller shows all fetched products until toggles are persisted).
     */
    enabledCarrierCodes: z.array(z.string().trim().min(1).max(200)).max(200),
  })
  .strict()

export type ShipmondoPatchShippingRulesBody = z.infer<
  typeof shipmondoPatchShippingRulesBodySchema
>

export function defaultShipmondoShippingRules(): ShipmondoShippingRulesNormalized {
  return {
    markupAmountMinor: 0,
    freeShippingThresholdMinor: 0,
    enabledCarrierCodes: [],
  }
}

export function normalizeShipmondoRulesFromStoredJson(
  raw: unknown | null | undefined
): ShipmondoShippingRulesNormalized {
  if (typeof raw !== "object" || raw === null) {
    return defaultShipmondoShippingRules()
  }

  const r = raw as Record<string, unknown>
  const mk = typeof r.markup_amount_minor === "number" ? Math.trunc(r.markup_amount_minor) : Number.NaN
  const th =
    typeof r.free_shipping_threshold_minor === "number"
      ? Math.trunc(r.free_shipping_threshold_minor)
      : Number.NaN
  const codesRaw = r.enabled_carrier_codes

  let enabledCarrierCodes: string[] = []
  if (Array.isArray(codesRaw)) {
    enabledCarrierCodes = codesRaw.filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
    )
  }

  if (!Number.isFinite(mk) || mk < 0 || mk > RULES_UPPER) {
    return defaultShipmondoShippingRules()
  }
  if (!Number.isFinite(th) || th < 0 || th > RULES_UPPER) {
    return defaultShipmondoShippingRules()
  }

  return {
    markupAmountMinor: mk,
    freeShippingThresholdMinor: th,
    enabledCarrierCodes,
  }
}

export function shipmondoRulesToStored(
  normalized: ShipmondoShippingRulesNormalized
): ShipmondoRulesJsonStored {
  shipmondoPatchShippingRulesBodySchema.parse(normalized)
  return {
    markup_amount_minor: normalized.markupAmountMinor,
    free_shipping_threshold_minor: normalized.freeShippingThresholdMinor,
    enabled_carrier_codes: normalized.enabledCarrierCodes,
  }
}

/** Returns whether the Shipmondo product stays selectable once rules are authored. */
export function isShipmondoProductSelectable(
  carrierProductCode: string,
  rules: ShipmondoShippingRulesNormalized
): boolean {
  const trimmed = carrierProductCode.trim()
  if (trimmed === "") {
    return false
  }
  if (rules.enabledCarrierCodes.length === 0) {
    return true
  }
  const allow = new Set(rules.enabledCarrierCodes.map((c) => c.trim()))
  return allow.has(trimmed)
}

/**
 * Applies connector-configured markup + optional free shipping threshold against a Shipmondo base retail price (minor currency units).
 * Integrations invoke this after resolving `basePriceMinorFromProvider` from fulfillment logic.
 */
export function calculateShipmondoCheckoutShippingMinor(input: {
  cartSubtotalExShippingMinor: number
  carrierProductCode: string
  basePriceMinorFromProvider: number
  rules: ShipmondoShippingRulesNormalized
}): {
  /** `-1` when the product code is excluded by connector rules — callers hide the corresponding rate. */
  priceMinor: number
  reason: "free_shipping_threshold" | "priced" | "disabled"
} {
  if (!isShipmondoProductSelectable(input.carrierProductCode, input.rules)) {
    return { priceMinor: -1, reason: "disabled" }
  }

  if (
    input.rules.freeShippingThresholdMinor > 0 &&
    input.cartSubtotalExShippingMinor >= input.rules.freeShippingThresholdMinor
  ) {
    return { priceMinor: 0, reason: "free_shipping_threshold" }
  }

  const baseSafe = Number.isFinite(input.basePriceMinorFromProvider)
    ? Math.max(0, Math.round(input.basePriceMinorFromProvider))
    : 0

  const next = Math.max(
    0,
    Math.min(RULES_UPPER, Math.round(baseSafe + input.rules.markupAmountMinor))
  )
  return { priceMinor: next, reason: "priced" }
}
