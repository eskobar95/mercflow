import { describe, expect, it } from "vitest"

import {
  buildVariantComboKey,
  buildVariantRowsFromOptionMatrix,
  DEFAULT_SINGLE_OPTION_TITLE,
  DEFAULT_SINGLE_OPTION_VALUE,
  mergePresetVariantEconomics,
  splitOptionValuesCsv,
} from "@/lib/products/productOptionMatrix"

describe("productOptionMatrix helpers", (): void => {
  it("splits comma- and semicolon-separated option values", (): void => {
    expect(splitOptionValuesCsv("S, M; L")).toEqual(["S", "M", "L"])
  })

  it("builds deterministic combo keys", (): void => {
    expect(
      buildVariantComboKey({ Color: "Blue", Size: "M" }),
    ).toMatchInlineSnapshot('"Color=Blue|Size=M"')

    expect(buildVariantComboKey({ Size: "M", Color: "Blue" })).toBe(
      buildVariantComboKey({ Color: "Blue", Size: "M" }),
    )
  })

  it("expands Cartesian combinations for nested options", (): void => {
    const combos = buildVariantRowsFromOptionMatrix([
      { title: "Size", values: ["S", "M"] },
      { title: "Color", values: ["Red"] },
    ])

    expect(combos).toHaveLength(2)

    expect(
      combos.map((row) => buildVariantComboKey(row.selections)).sort(),
    ).toEqual(
      ["Color=Red|Size=M", "Color=Red|Size=S"].sort((a, b) => a.localeCompare(b)),
    )
  })

  it("defaults to Standard variant rows when merchants skip options", (): void => {
    const combos = buildVariantRowsFromOptionMatrix([])

    expect(combos).toHaveLength(1)
    expect(combos[0]?.selections[DEFAULT_SINGLE_OPTION_TITLE]).toBe(DEFAULT_SINGLE_OPTION_VALUE)
  })

  it("preserves economics when combos rotate", (): void => {
    const previousEconomicsRow = mergePresetVariantEconomics({
      combos: buildVariantRowsFromOptionMatrix([{ title: "Size", values: ["S", "M"] }]),
      previousRows: [],
    })

    previousEconomicsRow[0] = {
      ...previousEconomicsRow[0]!,
      priceDkk: "10",
      stock: "5",
      medusaVariantId: undefined,
    }
    previousEconomicsRow[1] = {
      ...previousEconomicsRow[1]!,
      priceDkk: "12",
      stock: "3",
      medusaVariantId: undefined,
    }

    const nextCombos = buildVariantRowsFromOptionMatrix([
      { title: "Size", values: ["S", "M", "L"] },
    ])

    const mergedRows = mergePresetVariantEconomics({
      combos: nextCombos,
      previousRows: previousEconomicsRow,
    })

    const byKey = new Map(mergedRows.map((variantRow) => [variantRow.comboKey, variantRow]))
    expect(byKey.get("Size=S")?.priceDkk).toBe("10")
    expect(byKey.get("Size=M")?.priceDkk).toBe("12")
    expect(byKey.get("Size=L")?.priceDkk).toBe("")
  })
})
