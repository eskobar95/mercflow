/**
 * Formats totals returned by Medusa Admin order APIs — amounts are smallest currency units.
 * MVP: divide by 100 (common for currencies such as EUR/USD). See MER-22 — adjust if your
 * storefront uses zero-decimal currencies without server-side normalization.
 */
export function formatMinorAmount(
  amountMinor: bigint,
  currencyCode: string
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(Number(amountMinor) / 100)
  } catch {
    return `${currencyCode.toUpperCase()} ${amountMinor}`
  }
}
