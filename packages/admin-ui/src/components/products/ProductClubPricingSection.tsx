import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { formErrorClass } from "@/components/ui/formStyles"
import { Input } from "@/components/ui/Input"
import type {
  ClubPricingFieldErrors,
  ClubPricingLoadState,
} from "@/features/subscriptions/useClubPricingSection"
import { PRODUCT_FORM_PRICE_CURRENCY } from "@/lib/products/productOptionMatrix"
import type { VariantRowModel } from "@/lib/products/productOptionMatrix"

import { summarizeVariantRow } from "./unifiedProductFormUtils"

type ProductClubPricingSectionProps = {
  baseId: string
  variantRowsPreview: VariantRowModel[]
  loadState: ClubPricingLoadState
  fieldErrors: ClubPricingFieldErrors
  drafts: Record<string, { memberPriceDkk: string }>
  disabled?: boolean
  onMemberPriceChange: (variantId: string, memberPriceDkk: string) => void
  onRetry?: () => void
}

export function ProductClubPricingSection({
  baseId,
  variantRowsPreview,
  loadState,
  fieldErrors,
  drafts,
  disabled = false,
  onMemberPriceChange,
  onRetry,
}: ProductClubPricingSectionProps): ReactNode {
  if (loadState.status === "idle" || (loadState.status === "ready" && !loadState.clubEnabled)) {
    return null
  }

  const sectionId = `${baseId}-club-pricing`

  return (
    <section aria-labelledby={sectionId} className="space-y-4">
      <div>
        <h2 id={sectionId} className="text-lg font-semibold text-content-primary">
          Club member price
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Set an explicit member price per variant. Leave empty to use the store fallback discount
          for club members.
        </p>
      </div>

      {loadState.status === "loading" ? (
        <Card>
          <p className="text-sm text-content-tertiary" role="status">
            Loading club pricing…
          </p>
        </Card>
      ) : null}

      {loadState.status === "error" ? (
        <Card>
          <p className="text-sm text-feedback-danger-content" role="alert">
            {loadState.message}
          </p>
          {onRetry !== undefined ? (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              onClick={onRetry}
            >
              Retry
            </button>
          ) : null}
        </Card>
      ) : null}

      {loadState.status === "ready" && loadState.clubEnabled ? (
        <Card elevation="flat" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm" aria-label="Club member pricing grid">
              <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Variant
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Member price ({PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})
                  </th>
                </tr>
              </thead>
              <tbody>
                {variantRowsPreview.map((row) => {
                  const variantId = row.medusaVariantId
                  if (typeof variantId !== "string" || variantId.trim() === "") {
                    return null
                  }

                  const draft = drafts[variantId]
                  const fieldKey = `club_price_${variantId}`

                  return (
                    <tr key={variantId} className="border-t border-border-subtle">
                      <td className="align-top px-4 py-3 text-content-primary">
                        {summarizeVariantRow(row.selections)}
                      </td>
                      <td className="align-top px-4 py-3">
                        <div className="space-y-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            aria-label={`Club member price ${summarizeVariantRow(row.selections)} (${PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})`}
                            autoComplete="off"
                            placeholder="No member price — fallback discount applies"
                            value={draft?.memberPriceDkk ?? ""}
                            error={Boolean(fieldErrors[fieldKey])}
                            aria-invalid={Boolean(fieldErrors[fieldKey])}
                            disabled={disabled}
                            onChange={(event) => {
                              onMemberPriceChange(variantId, event.target.value)
                            }}
                          />
                          {fieldErrors[fieldKey] !== undefined ? (
                            <p className={formErrorClass} role="alert">
                              {fieldErrors[fieldKey]}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </section>
  )
}
