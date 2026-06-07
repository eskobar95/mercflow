import { getCurrencyFormatter, getDateTimeFormatter } from "@/utils/intlFormatCache"

export function formatStripeAmount(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100
  try {
    return getCurrencyFormatter(undefined, currencyCode).format(major)
  } catch {
    return `${major.toFixed(2)} ${currencyCode.toUpperCase()}`
  }
}

export function formatPaymentDate(epoch: number): string {
  try {
    return getDateTimeFormatter(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(epoch * 1000))
  } catch {
    return new Date(epoch * 1000).toISOString()
  }
}
