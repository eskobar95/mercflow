import { getCurrencyFormatter } from "@/utils/intlFormatCache"

function getMinorUnitDivisor(currencyCode: string, locale: string): number {
  const code = currencyCode.trim().toUpperCase()
  try {
    const { minimumFractionDigits } = getCurrencyFormatter(locale, code).resolvedOptions()
    const fractionDigits = minimumFractionDigits ?? 2
    return 10 ** fractionDigits
  } catch {
    return 100
  }
}

/**
 * Formats Medusa admin monetary amounts as minor units (e.g. øre, cents, or whole yen),
 * using the currency's fraction digit count from `Intl.NumberFormat` (covers 0-, 2-, and 3-decimal ISO 4217 currencies).
 */
export function formatAdminCurrency(
  amountMinor: number,
  currencyCode: string,
  locale = "da-DK"
): string {
  const code = currencyCode.trim().toUpperCase()
  const divisor = getMinorUnitDivisor(code, locale)
  const fractionDigits = Math.max(0, Math.round(Math.log10(divisor)))
  try {
    return getCurrencyFormatter(locale, code).format(amountMinor / divisor)
  } catch {
    return `${(amountMinor / divisor).toFixed(fractionDigits)} ${code}`
  }
}
