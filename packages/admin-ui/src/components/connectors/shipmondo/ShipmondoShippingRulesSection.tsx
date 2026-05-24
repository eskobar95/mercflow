import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import {
  getShipmondoCarrierProductsAdmin,
  patchShipmondoShippingRulesAdmin,
} from "@/features/connectors/shipmondoConnectorApi"
import type {
  ShipmondoCarrierProductDto,
  ShipmondoShippingRulesDto,
} from "@/features/connectors/shipmondoTypes"
import { ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY } from "@/hooks/useShipmondoConnectorSettings"

type ShipmondoShippingRulesSectionProps = {
  configured: boolean
  shippingRules: ShipmondoShippingRulesDto
}

const DKK_PRICE_FORMATTER = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatMinorAsDkk(minorUnits: number): string {
  return DKK_PRICE_FORMATTER.format(minorUnits / 100)
}

function majorsInputToMinorOrNull(raw: string): number | null {
  const normalized = raw.trim().replace(/\s+/gu, "")
  if (normalized === "") {
    return null
  }
  const n = Number(normalized.replace(",", "."))
  if (!Number.isFinite(n) || n < 0 || n > 999_999) {
    return null
  }
  return Math.round(n * 100)
}

function buildEnabledSelections(
  carriers: ShipmondoCarrierProductDto[],
  allowFromServer: string[]
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  const whitelistActive = allowFromServer.length > 0
  const allowSet = whitelistActive ? new Set(allowFromServer) : null

  for (const row of carriers) {
    next[row.productCode] = whitelistActive ? (allowSet?.has(row.productCode) ?? false) : true
  }

  return next
}

export function ShipmondoShippingRulesSection({
  configured,
  shippingRules,
}: ShipmondoShippingRulesSectionProps): JSX.Element {
  const queryClient = useQueryClient()

  const [markupMinorDraft, setMarkupMinorDraft] = useState<number>(shippingRules.markupAmountMinor)
  const [freeShippingDraftText, setFreeShippingDraftText] = useState<string>(
    shippingRules.freeShippingThresholdMinor === 0
      ? ""
      : String(shippingRules.freeShippingThresholdMinor / 100)
  )

  const [catalogRows, setCatalogRows] = useState<ShipmondoCarrierProductDto[]>([])
  const [enabledByProductCode, setEnabledByProductCode] = useState<Record<string, boolean>>({})

  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [freeShippingParseError, setFreeShippingParseError] = useState<string | null>(null)

  useEffect(() => {
    setMarkupMinorDraft(shippingRules.markupAmountMinor)
    setFreeShippingDraftText(
      shippingRules.freeShippingThresholdMinor === 0
        ? ""
        : String(shippingRules.freeShippingThresholdMinor / 100)
    )
  }, [shippingRules.freeShippingThresholdMinor, shippingRules.markupAmountMinor])

  useEffect(() => {
    if (catalogRows.length === 0) {
      setEnabledByProductCode({})
      return
    }

    setEnabledByProductCode(buildEnabledSelections(catalogRows, shippingRules.enabledCarrierCodes))
  }, [catalogRows, shippingRules.enabledCarrierCodes])

  const carriersMutation = useMutation({
    mutationFn: async (): Promise<ShipmondoCarrierProductDto[]> =>
      await getShipmondoCarrierProductsAdmin({ countryCode: "DK" }),
    onMutate: () => {
      setCatalogError(null)
    },
    onSuccess: (rows) => {
      setCatalogRows(rows)
    },
    onError: (reason: unknown) => {
      setCatalogError(reason instanceof Error ? reason.message : "Unable to fetch carriers.")
    },
  })

  const saveRulesMutation = useMutation({
    mutationFn: async (payload: ShipmondoShippingRulesDto): Promise<ShipmondoShippingRulesDto> =>
      patchShipmondoShippingRulesAdmin(payload),
    onMutate: () => {
      setSaveError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY })
    },
    onError: (reason: unknown) => {
      setSaveError(reason instanceof Error ? reason.message : "Unable to save shipping rules.")
    },
  })

  const handleToggleCarrier = (code: string): void => {
    setEnabledByProductCode((prev) => ({ ...prev, [code]: prev[code] !== true }))
  }

  const handleSaveRulesClick = (): void => {
    const enabledCarrierCodesPayload: string[] =
      catalogRows.length > 0
        ? catalogRows.filter((row) => enabledByProductCode[row.productCode]).map((row) => row.productCode)
        : [...shippingRules.enabledCarrierCodes]

    if (catalogRows.length > 0 && enabledCarrierCodesPayload.length === 0) {
      setSaveError("Enable at least one Shipmondo product before saving.")
      return
    }

    let freeMinor = 0

    if (freeShippingDraftText.trim() !== "") {
      const parsed = majorsInputToMinorOrNull(freeShippingDraftText)
      if (parsed === null) {
        setFreeShippingParseError("Use Danish major amounts (for example 499 or 499,95) or leave empty.")
        return
      }

      freeMinor = parsed
      setFreeShippingParseError(null)
    } else {
      setFreeShippingParseError(null)
    }

    const markup =
      typeof markupMinorDraft === "number" && Number.isFinite(markupMinorDraft)
        ? Math.max(0, Math.trunc(markupMinorDraft))
        : 0

    saveRulesMutation.mutate({
      markupAmountMinor: markup,
      freeShippingThresholdMinor: freeMinor,
      enabledCarrierCodes: enabledCarrierCodesPayload,
    })
  }

  const fetchDisabled = !configured || carriersMutation.isPending
  const saveDisabled = !configured || saveRulesMutation.isPending

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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="shipmondo-carrier-fetch">Carrier catalogue</Label>
              <p className="text-xs text-content-tertiary">
                Pull the latest negotiated Shipmondo products and Shipmondo base prices shown to shoppers before this
                module&apos;s markup.
              </p>
            </div>
            <Button
              id="shipmondo-carrier-fetch"
              type="button"
              variant="secondary"
              disabled={fetchDisabled}
              className="shrink-0"
              onClick={() => carriersMutation.mutate()}
            >
              {carriersMutation.isPending ? "Fetching carriers…" : "Fetch carriers"}
            </Button>
          </div>

          {catalogError ? (
            <div
              role="alert"
              className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
            >
              {catalogError}
            </div>
          ) : null}

          {catalogRows.length === 0 ? (
            <p className="text-sm text-content-secondary">
              Fetch carriers to populate the editable price table — nothing is synced until you explicitly save shipping
              rules.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border-subtle">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-content-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left">Carrier</th>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Shipmondo base</th>
                    <th className="px-4 py-2 text-left">Expose</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogRows.map((row) => (
                    <tr key={row.productCode} className="border-t border-border-subtle">
                      <td className="px-4 py-3 text-content-primary">{row.carrierCode ?? "—"}</td>
                      <td className="px-4 py-3 text-content-secondary">
                        <div className="font-medium text-content-primary">{row.productCode}</div>
                        <div className="text-xs text-content-tertiary">{row.name}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content-primary">{formatMinorAsDkk(row.basePriceMinor)}</td>
                      <td className="px-4 py-3">
                        <Switch
                          id={`shipmondo-carrier-enable-${row.productCode}`}
                          checked={enabledByProductCode[row.productCode] ?? false}
                          onCheckedChange={() => handleToggleCarrier(row.productCode)}
                          aria-label={`Expose Shipmondo product ${row.productCode}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                  setMarkupMinorDraft(0)
                  return
                }
                const next = Number.parseInt(digitsOnly, 10)
                setMarkupMinorDraft(Number.isFinite(next) ? Math.max(0, next) : 0)
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
              onChange={(event) => setFreeShippingDraftText(event.target.value)}
            />
            <p id="shipmondo-free-helper" className="text-xs text-content-tertiary">
              Leave blank to disable automatic free Shipmondo shipping. When totals meet or exceed the threshold we zero
              the connector pricing layer for enabled products.
            </p>
          </div>
        </div>

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
