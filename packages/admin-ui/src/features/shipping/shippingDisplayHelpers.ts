import type { AdminShippingOption, AdminShippingOptionRule } from "@medusajs/types"

export function formatShippingProfileType(type: string): string {
  const normalized = type.trim().toLowerCase()
  if (normalized === "default") return "Default"
  if (normalized === "gift_card") return "Gift card"
  if (normalized === "custom") return "Custom"
  return type
}

export function resolveShippingOptionCarrierLabel(option: AdminShippingOption): string {
  const providerLabel = option.provider?.id?.trim()
  if (providerLabel) return providerLabel
  const typeLabel = option.type?.label?.trim()
  if (typeLabel) return typeLabel
  return "—"
}

export function formatShippingOptionPrice(option: AdminShippingOption): string {
  const firstPrice = option.prices?.[0]
  if (!firstPrice) return option.price_type === "calculated" ? "Calculated" : "—"
  const amount = firstPrice.amount
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—"
  const currency =
    typeof firstPrice.currency_code === "string" && firstPrice.currency_code.trim() !== ""
      ? firstPrice.currency_code.toUpperCase()
      : null
  const formatted = (amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency ? `${formatted} ${currency}` : formatted
}

function summarizeRule(rule: AdminShippingOptionRule): string {
  const value = Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "")
  return `${rule.attribute.trim()} ${rule.operator} ${value}`.trim()
}

export function formatShippingOptionConditions(option: AdminShippingOption): string {
  const rules = option.rules ?? []
  return rules.length === 0 ? "No conditions" : rules.map(summarizeRule).join("; ")
}

export function formatShippingPriceType(priceType: AdminShippingOption["price_type"]): string {
  if (priceType === "flat") return "Flat rate"
  if (priceType === "calculated") return "Weight-based"
  return priceType
}
