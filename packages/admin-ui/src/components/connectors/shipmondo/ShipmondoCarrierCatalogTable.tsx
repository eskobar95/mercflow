import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import type { ShipmondoCarrierProductDto } from "@/features/connectors/shipmondoTypes"

import { formatMinorAsDkk } from "./shipmondoRulesUiState"

type ShipmondoCarrierCatalogTableProps = {
  catalogRows: ShipmondoCarrierProductDto[]
  enabledByProductCode: Record<string, boolean>
  catalogError: string | null
  fetchDisabled: boolean
  carriersIsPending: boolean
  onFetchCarriers: () => void
  onToggleCarrier: (code: string) => void
}

export function ShipmondoCarrierCatalogTable({
  catalogRows,
  enabledByProductCode,
  catalogError,
  fetchDisabled,
  carriersIsPending,
  onFetchCarriers,
  onToggleCarrier,
}: ShipmondoCarrierCatalogTableProps): ReactNode {
  return (
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
          onClick={onFetchCarriers}
        >
          {carriersIsPending ? "Fetching carriers…" : "Fetch carriers"}
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
                      onCheckedChange={() => onToggleCarrier(row.productCode)}
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
  )
}
