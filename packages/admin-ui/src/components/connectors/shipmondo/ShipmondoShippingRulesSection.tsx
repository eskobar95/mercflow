import { type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import type { ShipmondoShippingRulesDto } from "@/features/connectors/shipmondoTypes"

import { ShipmondoCarrierCatalogTable } from "./ShipmondoCarrierCatalogTable"
import { ShipmondoPricingRulesFields } from "./ShipmondoPricingRulesFields"
import { useShipmondoShippingRulesSection } from "./useShipmondoShippingRulesSection"

type ShipmondoShippingRulesSectionProps = {
  configured: boolean
  shippingRules: ShipmondoShippingRulesDto
}

export function ShipmondoShippingRulesSection({
  configured,
  shippingRules,
}: ShipmondoShippingRulesSectionProps): ReactNode {
  const {
    ui,
    dispatch,
    carriersMutation,
    saveRulesMutation,
    handleSaveRulesClick,
    fetchDisabled,
    saveDisabled,
  } = useShipmondoShippingRulesSection({ configured, shippingRules })

  const {
    markupMinorDraft,
    freeShippingDraftText,
    catalogRows,
    enabledByProductCode,
    catalogError,
    saveError,
    freeShippingParseError,
  } = ui

  return (
    <Card elevation="flat">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-content-primary">Shipping pricing rules</p>
        <p className="text-xs text-content-tertiary">
          Pricing is configured per store (no deployments). Carrier lists call Shipmondo&apos;s catalogue for{" "}
          <span className="font-mono">country_code=DK</span> using your saved credentials — live rates reuse{" "}
          <span className="font-mono">GET /store/connectors/shipmondo/rules</span>.
        </p>
      </div>

      {!configured ? (
        <p className="mt-4 text-sm text-content-secondary">
          Save Shipmondo API credentials above before syncing carrier prices or assigning rules.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-6">
        <ShipmondoCarrierCatalogTable
          catalogRows={catalogRows}
          enabledByProductCode={enabledByProductCode}
          catalogError={catalogError}
          fetchDisabled={fetchDisabled}
          carriersIsPending={carriersMutation.isPending}
          onFetchCarriers={() => carriersMutation.mutate()}
          onToggleCarrier={(code) => dispatch({ type: "toggleCarrier", code })}
        />

        <ShipmondoPricingRulesFields
          markupMinorDraft={markupMinorDraft}
          freeShippingDraftText={freeShippingDraftText}
          dispatch={dispatch}
        />

        {freeShippingParseError ? (
          <div
            role="alert"
            className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
          >
            {freeShippingParseError}
          </div>
        ) : null}

        {saveError ? (
          <div
            role="alert"
            className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
          >
            {saveError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" disabled={saveDisabled} onClick={handleSaveRulesClick}>
            {saveRulesMutation.isPending ? "Saving rules…" : "Save shipping rules"}
          </Button>
          <p className="text-xs text-content-tertiary">
            Persisted instantly on the backend — storefront checkout code should reuse{" "}
            <span className="font-mono">@mercflow/connector-module/mercflow-shipmondo-checkout-pricing</span> when
            computing final amounts.
          </p>
        </div>
      </div>
    </Card>
  )
}
