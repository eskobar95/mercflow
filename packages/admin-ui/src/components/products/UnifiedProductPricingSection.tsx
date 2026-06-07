import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { formErrorClass } from "@/components/ui/formStyles"
import { Input } from "@/components/ui/Input"
import type { UnifiedCatalogProductFormErrors } from "@/hooks/products/useUnifiedCatalogProductForm"
import {
  PRODUCT_FORM_PRICE_CURRENCY,
  type VariantRowModel,
} from "@/lib/products/productOptionMatrix"

import { summarizeVariantRow } from "./unifiedProductFormUtils"

type UnifiedProductPricingSectionProps = {
  baseId: string
  variantRowsPreview: VariantRowModel[]
  fieldErrors: UnifiedCatalogProductFormErrors
  updateEconomicsRow: (
    comboKey: string,
    patch: Partial<Pick<VariantRowModel, "priceDkk" | "stock">>,
  ) => void
}

export function UnifiedProductPricingSection({
  baseId,
  variantRowsPreview,
  fieldErrors,
  updateEconomicsRow,
}: UnifiedProductPricingSectionProps): ReactNode {
  return (
    <section aria-labelledby={`${baseId}-step-3`} className="space-y-4">
      <h2 id={`${baseId}-step-3`} className="text-lg font-semibold text-content-primary">
        Step 3 — Pricing &amp; inventory
      </h2>

      <Card elevation="flat" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm" aria-label="Variant pricing grid">
            <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Variant
                </th>
                <th scope="col" className="px-4 py-3">
                  Attributes
                </th>
                <th scope="col" className="px-4 py-3">
                  Price ({PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})
                </th>
                <th scope="col" className="px-4 py-3">
                  Stock qty
                </th>
              </tr>
            </thead>
            <tbody>
              {variantRowsPreview.map((row) => (
                <tr key={row.comboKey} className="border-t border-border-subtle">
                  <td className="align-top px-4 py-3 text-content-primary">
                    {summarizeVariantRow(row.selections)}
                  </td>
                  <td className="align-top px-4 py-3 text-xs text-content-secondary">
                    {Object.keys(row.selections).length === 0
                      ? "—"
                      : Object.keys(row.selections)
                          .sort((a, b) => a.localeCompare(b))
                          .map((key) => `${key}: ${row.selections[key]}`)
                          .join(" · ")}
                  </td>
                  <td className="align-top px-4 py-3">
                    <div className="space-y-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Price ${summarizeVariantRow(row.selections)} (${PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})`}
                        autoComplete="off"
                        placeholder="149.95"
                        value={row.priceDkk}
                        error={Boolean(fieldErrors[`price_${row.comboKey}`])}
                        aria-invalid={Boolean(fieldErrors[`price_${row.comboKey}`])}
                        onChange={(event) => {
                          updateEconomicsRow(row.comboKey, { priceDkk: event.target.value })
                        }}
                      />
                      {fieldErrors[`price_${row.comboKey}`] !== undefined ? (
                        <p className={formErrorClass} role="alert">
                          {fieldErrors[`price_${row.comboKey}`]}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="align-top px-4 py-3">
                    <div className="space-y-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Stock ${summarizeVariantRow(row.selections)}`}
                        autoComplete="off"
                        placeholder="25"
                        value={row.stock}
                        error={Boolean(fieldErrors[`stock_${row.comboKey}`])}
                        aria-invalid={Boolean(fieldErrors[`stock_${row.comboKey}`])}
                        onChange={(event) => {
                          updateEconomicsRow(row.comboKey, { stock: event.target.value })
                        }}
                      />
                      {fieldErrors[`stock_${row.comboKey}`] !== undefined ? (
                        <p className={formErrorClass} role="alert">
                          {fieldErrors[`stock_${row.comboKey}`]}
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {variantRowsPreview.length === 0 ? (
          <p className="p-6 text-sm text-content-secondary">{fieldErrors.variants ?? "No variants."}</p>
        ) : null}
      </Card>
    </section>
  )
}
