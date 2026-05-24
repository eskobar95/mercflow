import { Card } from "@/components/ui/Card"
import type { AdminCustomer } from "@/features/customers/customersAdminTypes"
import {
  customerDisplayName,
  customerEmailLabel,
} from "@/features/customers/customerFormatting"

type CustomerProfileCardProps = {
  readonly customer: AdminCustomer
}

export function CustomerProfileCard({
  customer,
}: CustomerProfileCardProps): JSX.Element {
  const phoneLabel = customer.phone?.trim() === "" ? "—" : customer.phone ?? "—"

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-content-primary">
            {customerDisplayName(customer)}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <dt className="text-content-secondary">Email</dt>
              <dd className="font-medium text-content-primary">{customerEmailLabel(customer)}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-content-secondary">Phone</dt>
              <dd className="font-medium text-content-primary">{phoneLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  )
}
