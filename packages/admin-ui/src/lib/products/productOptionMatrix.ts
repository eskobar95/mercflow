/** Currency used for SKU pricing in MercFlow catalogue forms (minor units handled at persistence). */
export const PRODUCT_FORM_PRICE_CURRENCY = "dkk" as const

export type ProductOptionRowModel = {
  /** Medusa `product_option` id when editing; absent on fresh create rows. */
  medusaOptionId?: string | null
  title: string
  /** Separate values trim non-empty splits on comma optional */
  values: string[]
  /** Raw CSV while editing so trailing commas are not stripped on each keystroke. */
  valuesInput?: string
}

/** True when at least one option row has a non-empty title and one or more values. */
export function hasDefinedProductOptions(options: ProductOptionRowModel[]): boolean {
  for (const row of options) {
    const title = row.title.trim()
    if (title === "") {
      continue
    }
    const hasValue = row.values.some((value) => value.trim() !== "")
    if (hasValue) {
      return true
    }
  }
  return false
}

export type VariantRowModel = {
  /** Stable lookup key derived from selections (sorted). */
  comboKey: string
  /** Option title → value picked for this row. */
  selections: Record<string, string>
  /** Major DKK input (parsed at save). Empty string indicates missing user input (validation fails). */
  priceDkk: string
  /** Integer stock qty at primary stock location (empty fails validation). */
  stock: string
  /** Medusa `product_variant` id when editing existing rows. */
  medusaVariantId?: string | null
}

/**
 * Parses a comma-/semicolon-separated string into distinct trimmed option values (non-empty).
 */
export function splitOptionValuesCsv(raw: string): string[] {
  return raw
    .split(/[,;]/u)
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "")
}

export function readOptionValuesInput(row: ProductOptionRowModel): string {
  return row.valuesInput ?? row.values.join(", ")
}

export function normalizeOptionValuesInput(raw: string): {
  valuesInput: string
  values: string[]
} {
  const values = splitOptionValuesCsv(raw)
  return { valuesInput: values.join(", "), values }
}

/**
 * Builds deterministic stable key across option reordering (sort titles lexicographically).
 */
export function buildVariantComboKey(selections: Record<string, string>): string {
  const keys = Object.keys(selections).sort((a, b) => a.localeCompare(b))
  return keys.map((key) => `${key}=${selections[key]}`).join("|")
}

/** Default matrix when merchants skip option rows entirely (single SKU). */
export const DEFAULT_SINGLE_OPTION_TITLE = "Variant"
export const DEFAULT_SINGLE_OPTION_VALUE = "Standard"

/**
 * Cartesian product of option titles × string[] values → selection records.
 * Empty options ⇒ one row labelled `Standard` via {@link DEFAULT_SINGLE_OPTION_TITLE}.
 */
export function buildVariantRowsFromOptionMatrix(
  options: ProductOptionRowModel[],
): Array<Pick<VariantRowModel, "comboKey" | "selections">> {
  const cleaned: Array<{ title: string; values: string[] }> = []
  for (const row of options) {
    const title = row.title.trim()
    if (title === "") {
      continue
    }

    const uniq = [
      ...new Set(
        row.values.flatMap((value) => {
          const trimmed = value.trim()
          return trimmed !== "" ? [trimmed] : []
        }),
      ),
    ]

    if (uniq.length > 0) {
      cleaned.push({ title, values: uniq })
    }
  }

  if (cleaned.length === 0) {
    const selections = { [DEFAULT_SINGLE_OPTION_TITLE]: DEFAULT_SINGLE_OPTION_VALUE }
    return [{ selections, comboKey: buildVariantComboKey(selections) }]
  }

  const combinations: Record<string, string>[] = []

  const expand = (
    dimensionIndex: number,
    accumulator: Record<string, string>,
  ): void => {
    if (dimensionIndex >= cleaned.length) {
      combinations.push({ ...accumulator })
      return
    }

    const { title, values } = cleaned[dimensionIndex]!

    if (values === undefined || values.length === 0) {
      return
    }

    for (const value of values) {
      expand(dimensionIndex + 1, { ...accumulator, [title]: value })
    }
  }

  expand(0, {})

  return combinations.map((selections) => ({
    selections,
    comboKey: buildVariantComboKey(selections),
  }))
}
