import type { Dispatch, ReactNode } from "react"

import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

import type { ShipmondoRulesUiAction } from "./shipmondoRulesUiState"

type ShipmondoPricingRulesFieldsProps = {
  markupMinorDraft: number
  freeShippingDraftText: string
  dispatch: Dispatch<ShipmondoRulesUiAction>
}

export function ShipmondoPricingRulesFields({
  markupMinorDraft,
  freeShippingDraftText,
  dispatch,
}: ShipmondoPricingRulesFieldsProps): ReactNode {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="shipmondo-markup-minor" required>
          Checkout markup
        </Label>
        <Input
          id="shipmondo-markup-minor"
          inputMode="numeric"
          aria-describedby="shipmondo-markup-helper"
          value={`${markupMinorDraft}`}
          onChange={(event) => {
            const digitsOnly = event.target.value.replace(/\D/gu, "")
            if (digitsOnly === "") {
              dispatch({ type: "setMarkupMinorDraft", value: 0 })
              return
            }
            const next = Number.parseInt(digitsOnly, 10)
            dispatch({
              type: "setMarkupMinorDraft",
              value: Number.isFinite(next) ? Math.max(0, next) : 0,
            })
          }}
        />
        <p id="shipmondo-markup-helper" className="text-xs text-content-tertiary">
          Stored in øre/minor units (<span className="font-mono">100</span> equals <strong>1,00&nbsp;DKK</strong>).{" "}
          This value stacks on Shipmondo retail prices surfaced at checkout calculators.
        </p>
      </div>

      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="shipmondo-free-shipping-majors">Free shipping threshold (major DKK)</Label>
        <Input
          id="shipmondo-free-shipping-majors"
          inputMode="decimal"
          aria-describedby="shipmondo-free-helper"
          value={freeShippingDraftText}
          onChange={(event) => {
            dispatch({ type: "setFreeShippingDraftText", value: event.target.value })
          }}
        />
        <p id="shipmondo-free-helper" className="text-xs text-content-tertiary">
          Leave blank to disable automatic free Shipmondo shipping. When totals meet or exceed the threshold we zero
          the connector pricing layer for enabled products.
        </p>
      </div>
    </div>
  )
}
