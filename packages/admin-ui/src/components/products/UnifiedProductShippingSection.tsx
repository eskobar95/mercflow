import { type ReactNode, useId, useState } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import type { VariantRowModel } from "@/lib/products/productOptionMatrix"
import { countVariantsWithDistinctShippingDrafts, type VariantShippingDraft } from "@/lib/products/variantShippingDraft"

import { summarizeVariantRow } from "./unifiedProductFormUtils"

type Props = {
  baseId: string
  isPhysicalProduct: boolean
  variantRowsPreview: VariantRowModel[]
  shippingMap: Partial<Record<string, VariantShippingDraft>>
  onPhysicalProductChange: (value: boolean) => void
  onShippingRowChange: (comboKey: string, patch: Partial<VariantShippingDraft>) => void
  onApplyShippingToAllVariants: (sourceComboKey: string) => void
}

export function UnifiedProductShippingSection({
  baseId,
  isPhysicalProduct,
  variantRowsPreview,
  shippingMap,
  onPhysicalProductChange,
  onShippingRowChange,
  onApplyShippingToAllVariants,
}: Props): ReactNode {
  const toggleId = useId()
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false)
  const [applySourceComboKey, setApplySourceComboKey] = useState<string | null>(null)

  const overwriteCount =
    applySourceComboKey === null
      ? 0
      : countVariantsWithDistinctShippingDrafts({
          shippingMap,
          comboKeys: variantRowsPreview.map((row) => row.comboKey),
          sourceComboKey: applySourceComboKey,
        })

  return (
    <section aria-labelledby={`${baseId}-step-shipping`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={`${baseId}-step-shipping`} className="text-lg font-semibold text-content-primary">
          Step 4 — Shipping
        </h2>
        <Switch id={toggleId} label="Physical product" checked={isPhysicalProduct} onCheckedChange={onPhysicalProductChange} />
      </div>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none"
        style={{ gridTemplateRows: isPhysicalProduct ? "1fr" : "0fr", opacity: isPhysicalProduct ? 1 : 0, transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        aria-hidden={!isPhysicalProduct}
      >
        <div className="min-h-0 overflow-hidden">
          <Card elevation="flat" className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm" aria-label="Variant shipping dimensions">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3">Variant</th>
                    <th scope="col" className="px-4 py-3">Length (cm)</th>
                    <th scope="col" className="px-4 py-3">Width (cm)</th>
                    <th scope="col" className="px-4 py-3">Height (cm)</th>
                    <th scope="col" className="px-4 py-3">Weight (g)</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {variantRowsPreview.map((row) => {
                    const shipping = shippingMap[row.comboKey] ?? { lengthCm: "", widthCm: "", heightCm: "", weightG: "" }
                    const label = summarizeVariantRow(row.selections)
                    return (
                      <tr key={row.comboKey} className="border-t border-border-subtle">
                        <td className="px-4 py-3">{label}</td>
                        <td className="px-4 py-3"><Input aria-label={`Length ${label} (cm)`} value={shipping.lengthCm} onChange={(e) => onShippingRowChange(row.comboKey, { lengthCm: e.target.value })} /></td>
                        <td className="px-4 py-3"><Input aria-label={`Width ${label} (cm)`} value={shipping.widthCm} onChange={(e) => onShippingRowChange(row.comboKey, { widthCm: e.target.value })} /></td>
                        <td className="px-4 py-3"><Input aria-label={`Height ${label} (cm)`} value={shipping.heightCm} onChange={(e) => onShippingRowChange(row.comboKey, { heightCm: e.target.value })} /></td>
                        <td className="px-4 py-3"><Input aria-label={`Weight ${label} (g)`} value={shipping.weightG} onChange={(e) => onShippingRowChange(row.comboKey, { weightG: e.target.value })} /></td>
                        <td className="px-4 py-3">{variantRowsPreview.length > 1 ? <Button type="button" variant="secondary" onClick={() => { setApplySourceComboKey(row.comboKey); setApplyConfirmOpen(true) }}>Apply to all variants</Button> : null}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      <AlertDialog open={applyConfirmOpen} onOpenChange={setApplyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply dimensions to all variants?</AlertDialogTitle>
            <AlertDialogDescription>
              {overwriteCount > 0
                ? `This will overwrite shipping dimensions on ${overwriteCount} variant${overwriteCount === 1 ? "" : "s"} with existing values.`
                : "This will copy the dimensions from the selected row to every variant."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={() => { setApplyConfirmOpen(false); setApplySourceComboKey(null) }}>Cancel</AlertDialogCancel>
            <Button type="button" variant="primary" onClick={() => { if (applySourceComboKey) onApplyShippingToAllVariants(applySourceComboKey); setApplyConfirmOpen(false); setApplySourceComboKey(null) }}>Apply to all</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
