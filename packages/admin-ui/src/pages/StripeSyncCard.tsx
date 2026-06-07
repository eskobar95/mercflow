import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import type { StripeConnectorDetailDto } from "@/features/connectors/stripeConnectorApi"

import type { StripeSyncState } from "./stripeConnectorSettingsState"

type StripeSyncCardProps = {
  detail: StripeConnectorDetailDto | null
  syncState: StripeSyncState
  onSync: () => void
}

export function StripeSyncCard({ detail, syncState, onSync }: StripeSyncCardProps): ReactNode {
  return (
    <Card className="p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-prose">
          <h2 className="text-lg font-semibold text-content-primary">Product + price synchronization</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Runs server-side inside Medusa, matching each Medusa product to a Stripe Product (metadata{" "}
            <code className="text-xs">medusa_product_id</code>) and each variant × currency combo to Stripe Prices via{" "}
            <code className="text-xs">metadata.medusa_variant_id</code>.
          </p>
        </div>

        <Button
          variant="secondary"
          type="button"
          disabled={detail?.configured !== true || syncState.status === "working"}
          onClick={onSync}
          leadingIcon={syncState.status === "working" ? <Spinner size="sm" label="Syncing" /> : undefined}
        >
          Sync products now
        </Button>
      </div>

      {syncState.status === "working" ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-content-secondary">
          <Spinner size="sm" label="Stripe sync busy" aria-hidden /> {syncState.message}
        </p>
      ) : null}
      {syncState.status === "error" ? (
        <p role="alert" className="mt-4 text-sm text-feedback-danger-content">
          {syncState.message}
        </p>
      ) : null}
      {syncState.status === "success" ? (
        <p className="mt-4 text-sm text-feedback-success-content" aria-live="polite">
          Processed <strong>{syncState.result.products_processed}</strong> Medusa products; created Stripe products{" "}
          <strong>{syncState.result.stripe_products_created}</strong>, updates{" "}
          <strong>{syncState.result.stripe_products_updated}</strong>, Stripe prices{" "}
          <strong>{syncState.result.stripe_prices_created}</strong> (previous prices deactivated:{" "}
          <strong>{syncState.result.stripe_prices_deactivated}</strong>).
        </p>
      ) : null}
    </Card>
  )
}
