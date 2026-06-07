import type { ReactNode } from "react"
import { Card } from "@/components/ui/Card"
import { SubscriptionsTable } from "@/components/subscriptions"
import { useCustomerSubscriptionsSection } from "@/features/subscriptions"

type CustomerSubscriptionsSectionProps = {
  customerId: string
}

/**
 * Read-only subscriptions card shown on customer detail (MER-43).
 */
export function CustomerSubscriptionsSection({
  customerId,
}: CustomerSubscriptionsSectionProps): ReactNode {
  const { data, loading, errorMessage } = useCustomerSubscriptionsSection(customerId)

  let body: ReactNode

  if (errorMessage !== null) {
    body = (
      <div className="border-t border-border-subtle px-6 py-6 text-sm text-feedback-danger-content">
        {errorMessage}
      </div>
    )
  } else {
    body = (
      <div className="border-t border-border-subtle">
        <SubscriptionsTable rows={data?.data ?? []} isLoading={loading} />
      </div>
    )
  }

  return (
    <Card className="overflow-hidden rounded-md shadow-sm">
      <div className="border-b border-border-subtle px-6 py-4">
        <h2 className="text-interface font-semibold text-content-primary">Subscriptions</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Recurring subscription rows stored in MercFlow.
        </p>
      </div>
      {body}
    </Card>
  )
}
