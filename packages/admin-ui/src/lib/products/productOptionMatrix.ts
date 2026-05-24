/** Currency used for SKU pricing in MercFlow catalogue forms (minor units handled at persistence). */
export const PRODUCT_FORM_PRICE_CURRENCY = "dkk" as const

export type ProductOptionRowModel = {
  /** Medusa `product_option` id when editing; absent on fresh create rows. */
  medusaOptionId?: string | null
  title: string
  /** Separate values trim non-empty splits on comma optional */
  values: string[]
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
  const cleaned = options
    .map((row) => {
      const title = row.title.trim()
      const uniq = [...new Set(row.values.map((v) => v.trim()).filter(Boolean))]
      return title !== "" ? { title, values: uniq } : null
    })
    .filter((row): row is { title: string; values: string[] } => row !== null)
    .filter((row) => row.values.length > 0)

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

/**
 * Merges previous price/stock by combo key onto newly generated combos.
 */
export function mergePresetVariantEconomics(params: {
  combos: Array<Pick<VariantRowModel, "comboKey" | "selections">>
  previousRows: VariantRowModel[]
  medusaVariantIdsByKey?: Partial<Record<string, string>>
}): VariantRowModel[] {
  const byKeyFromPrevious = new Map(
    params.previousRows.map((row) => [row.comboKey, row] as const),
  )

  return params.combos.map((combo): VariantRowModel => {
    const previous = byKeyFromPrevious.get(combo.comboKey)

    const medusaVariantId =
      previous?.medusaVariantId ??
      params.medusaVariantIdsByKey?.[combo.comboKey] ??
      null

    const priceDkk = previous?.comboKey === combo.comboKey ? previous.priceDkk : ""
    const stock = previous?.comboKey === combo.comboKey ? previous.stock : ""

    return {
      comboKey: combo.comboKey,
      selections: combo.selections,
      priceDkk,
      stock,
      medusaVariantId: medusaVariantId ?? undefined,
    }
  })
}
