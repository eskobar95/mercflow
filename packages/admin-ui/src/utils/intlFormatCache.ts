const currencyFormatterCache = new Map<string, Intl.NumberFormat>()
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>()

function currencyCacheKey(locale: string | undefined, currencyCode: string): string {
  return `${locale ?? "default"}::${currencyCode.trim().toUpperCase()}`
}

function dateTimeCacheKey(locale: string | undefined, options: Intl.DateTimeFormatOptions): string {
  return `${locale ?? "default"}::${JSON.stringify(options)}`
}

function instantiateCurrencyFormatter(
  locale: string | undefined,
  currencyCode: string,
): Intl.NumberFormat {
  const code = currencyCode.trim().toUpperCase()
  return Reflect.construct(Intl.NumberFormat, [
    locale,
    {
      style: "currency",
      currency: code,
    },
  ]) as Intl.NumberFormat
}

function instantiateDateTimeFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return Reflect.construct(Intl.DateTimeFormat, [locale, options]) as Intl.DateTimeFormat
}

/**
 * Returns a cached `Intl.NumberFormat` for currency display (avoids rebuilding formatters per call).
 */
export function getCurrencyFormatter(
  locale: string | undefined,
  currencyCode: string,
): Intl.NumberFormat {
  const key = currencyCacheKey(locale, currencyCode)
  const cached = currencyFormatterCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const formatter = instantiateCurrencyFormatter(locale, currencyCode)
  currencyFormatterCache.set(key, formatter)
  return formatter
}

/**
 * Returns a cached `Intl.DateTimeFormat` for the given locale and options.
 */
export function getDateTimeFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = dateTimeCacheKey(locale, options)
  const cached = dateTimeFormatterCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const formatter = instantiateDateTimeFormatter(locale, options)
  dateTimeFormatterCache.set(key, formatter)
  return formatter
}
