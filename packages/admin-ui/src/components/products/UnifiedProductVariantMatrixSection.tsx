import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { splitOptionValuesCsv, type ProductOptionRowModel } from "@/lib/products/productOptionMatrix"

type UnifiedProductVariantMatrixSectionProps = {
  baseId: string
  optionRows: ProductOptionRowModel[]
  addOptionRow: () => void
  updateOptionRow: (index: number, patch: Partial<ProductOptionRowModel>) => void
  removeOptionRow: (index: number) => void
}

export function UnifiedProductVariantMatrixSection({
  baseId,
  optionRows,
  addOptionRow,
  updateOptionRow,
  removeOptionRow,
}: UnifiedProductVariantMatrixSectionProps): ReactNode {
  return (
    <section aria-labelledby={`${baseId}-step-2`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${baseId}-step-2`} className="text-lg font-semibold text-content-primary">
          Step 2 — Variant matrix
        </h2>

        <Button type="button" variant="secondary" onClick={addOptionRow}>
          Add option
        </Button>
      </div>

      <Card elevation="flat" className="space-y-4 p-6">
        {optionRows.length === 0 ? (
          <p className="text-sm text-content-secondary">Add at least one option row.</p>
        ) : (
          optionRows.map((row, rowIndex) => (
            <div key={typeof row.medusaOptionId === "string" ? row.medusaOptionId : `${baseId}-opt-${rowIndex}`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-[12rem] flex-1 space-y-2">
                  <FormField label={`Option ${rowIndex + 1}`} htmlFor={`${baseId}-opt-${rowIndex}`}>
                    <Input
                      id={`${baseId}-opt-${rowIndex}`}
                      type="text"
                      placeholder='e.g. "Size"'
                      value={row.title}
                      autoComplete="off"
                      onChange={(e) => {
                        updateOptionRow(rowIndex, { title: e.target.value })
                      }}
                    />
                  </FormField>
                </div>
                <div className="min-w-[16rem] flex-[2] space-y-2">
                  <FormField
                    label="Values"
                    htmlFor={`${baseId}-opt-values-${rowIndex}`}
                    hint="Comma-separated (S, M, L)."
                  >
                    <Input
                      id={`${baseId}-opt-values-${rowIndex}`}
                      type="text"
                      value={row.values.join(", ")}
                      autoComplete="off"
                      onChange={(e) => {
                        updateOptionRow(rowIndex, {
                          values: splitOptionValuesCsv(e.target.value),
                        })
                      }}
                    />
                  </FormField>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    removeOptionRow(rowIndex)
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </section>
  )
}
