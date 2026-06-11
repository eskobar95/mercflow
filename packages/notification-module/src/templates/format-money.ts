import type { BigNumberValue } from "@medusajs/types"

function toNumericAmount(value: BigNumberValue | undefined): number {
  if (value === undefined) {
    return 0
  }

  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === "object" && value !== null && "numeric" in value) {
    const numeric = (value as { numeric?: number }).numeric
    return typeof numeric === "number" ? numeric : 0
  }

  return 0
}

export function formatOrderMoney(
  amount: BigNumberValue | number | undefined,
  currencyCode: string
): string {
  const numeric =
    typeof amount === "number" ? amount : toNumericAmount(amount as BigNumberValue | undefined)

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(numeric / 100)
}
