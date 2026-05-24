/**
 * Formats Medusa admin monetary amounts (typically minor units, e.g. øre for DKK).
 */
export function formatAdminCurrency(
  amountMinor: number,
  currencyCode: string,
  locale = "da-DK"
): string {
  const code = currencyCode.trim().toUpperCase()
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).format(amountMinor / 100)
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${code}`
  }
}
