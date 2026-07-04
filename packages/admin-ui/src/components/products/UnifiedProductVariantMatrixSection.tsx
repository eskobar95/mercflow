import { type ReactNode, useState } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { IconPlus } from "@/components/ui/icons"
import { Input } from "@/components/ui/Input"
import {
  hasDefinedProductOptions,
  splitOptionValuesCsv,
  type ProductOptionRowModel,
} from "@/lib/products/productOptionMatrix"
import { useAdjustStateWhenSnapshotChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

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
  const hasDefinedOptions = hasDefinedProductOptions(optionRows)
  const [isBuilderExpanded, setIsBuilderExpanded] = useState(hasDefinedOptions)

  useAdjustStateWhenSnapshotChanges([hasDefinedOptions], () => {
    if (hasDefinedOptions) {
      setIsBuilderExpanded(true)
    }
  })

  useAdjustStateWhenSnapshotChanges(
    [optionRows.length, hasDefinedOptions],
    () => {
      if (optionRows.length === 0 && !hasDefinedOptions) {
        setIsBuilderExpanded(false)
      }
    },
  )

  const showCtaOnly = !isBuilderExpanded && !hasDefinedOptions

  const openOptionBuilder = (): void => {
    setIsBuilderExpanded(true)
    if (optionRows.length === 0) {
      addOptionRow()
    }
  }

  if (showCtaOnly) {
    return (
      <section aria-labelledby={`${baseId}-step-2`} className="space-y-4">
        <h2 id={`${baseId}-step-2`} className="text-lg font-semibold text-content-primary">
          Step 2 — Variant matrix
        </h2>

        <Button type="button" variant="secondary" onClick={openOptionBuilder}>
          <IconPlus size={16} aria-hidden />
          Add options like size or color
        </Button>
      </section>
    )
  }

  return (
    <section aria-labelledby={`${baseId}-step-2`} className="space-y-4">
      <h2 id={`${baseId}-step-2`} className="text-lg font-semibold text-content-primary">
        Step 2 — Variant matrix
      </h2>

      <Card elevation="flat" className="space-y-4 p-6">
        {optionRows.map((row, rowIndex) => (
          <div
            key={
              typeof row.medusaOptionId === "string"
                ? row.medusaOptionId
                : `${baseId}-opt-${rowIndex}`
            }
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[12rem] flex-1 space-y-2">
                <FormField label={`Option ${rowIndex + 1}`} htmlFor={`${baseId}-opt-${rowIndex}`}>
                  <Input
                    id={`${baseId}-opt-${rowIndex}`}
                    type="text"
                    placeholder='e.g. "Size"'
                    value={row.title}
                    autoComplete="off"
                    onChange={(event) => {
                      updateOptionRow(rowIndex, { title: event.target.value })
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
                    onChange={(event) => {
                      updateOptionRow(rowIndex, {
                        values: splitOptionValuesCsv(event.target.value),
                      })
                    }}
                  />
                </FormField>
              </div>
              {optionRows.length > 1 || hasDefinedOptions ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    removeOptionRow(rowIndex)
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>

            {rowIndex === 0 && hasDefinedOptions ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
                onClick={addOptionRow}
              >
                <IconPlus size={14} aria-hidden />
                Add another option
              </button>
            ) : null}
          </div>
        ))}
      </Card>
    </section>
  )
}
