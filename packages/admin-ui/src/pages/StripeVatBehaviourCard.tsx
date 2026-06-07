import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { StripeConnectorDetailDto } from "@/features/connectors/stripeConnectorApi"

type StripeVatBehaviourCardProps = {
  detail: StripeConnectorDetailDto | null
  vatValue: StripeConnectorDetailDto["vat_mode"]
  vatSaving: boolean
  vatError: string | null
  onVatChange: (value: StripeConnectorDetailDto["vat_mode"]) => void
}

export function StripeVatBehaviourCard({
  detail,
  vatValue,
  vatSaving,
  vatError,
  onVatChange,
}: StripeVatBehaviourCardProps): ReactNode {
  return (
    <Card className="p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-content-primary">VAT behaviour</h2>
        <p className="text-sm text-content-secondary">
          Storefront integrations should query <code className="text-xs">GET /store/connectors/stripe/vat</code> for the
          authoritative flag (<code className="text-xs">vat_mode</code>).
        </p>
      </div>

      <div className="mt-6">
        <fieldset className="space-y-4" aria-describedby="vat-behaviour-hint">
          <legend className="sr-only">VAT inclusive or exclusive catalogue pricing</legend>
          <RadioGroup
            disabled={vatSaving || detail?.configured !== true}
            value={vatValue}
            onValueChange={(value) =>
              value === "inclusive" || value === "exclusive" ? onVatChange(value) : undefined
            }
          >
            <RadioGroupItem
              value="inclusive"
              label="Inclusive — catalog/list prices already include VAT"
              id="stripe-vat-inclusive"
            />
            <RadioGroupItem value="exclusive" label="Exclusive — VAT is added downstream" id="stripe-vat-exclusive" />
          </RadioGroup>
        </fieldset>

        <p id="vat-behaviour-hint" className="mt-4 text-xs text-content-tertiary">
          {vatSaving ? "Updating VAT preference…" : null}
          {vatError !== null ? <span className="text-feedback-danger-content">{vatError}</span> : null}
        </p>
      </div>
    </Card>
  )
}
