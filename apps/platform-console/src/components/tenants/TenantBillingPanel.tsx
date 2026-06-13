import { useState } from "react"

import { SuspendTenantModal } from "@/components/tenants/SuspendTenantModal"
import type { PlatformTenant, PlatformTenantBilling } from "@/lib/platformTenantsApi"
import {
  buildStripeCustomerDashboardUrl,
  canSuspendTenantBilling,
  formatBillingCurrency,
  formatBillingInterval,
  formatBillingRenewalDate,
  formatPlanTierLabel,
  normalizeBillingSubscriptionStatus,
} from "@/lib/tenantBilling"

type BillingStatusBadgeProps = {
  status: string
}

function BillingStatusBadge({ status }: BillingStatusBadgeProps): React.ReactElement {
  const normalized = normalizeBillingSubscriptionStatus(status)

  if (normalized === "active") {
    return (
      <span className="inline-flex rounded-full bg-feedback-success-subtle px-2.5 py-0.5 text-xs font-medium text-feedback-success-content">
        Active
      </span>
    )
  }

  if (normalized === "past_due") {
    return (
      <span className="inline-flex rounded-full bg-feedback-warning-subtle px-2.5 py-0.5 text-xs font-medium text-feedback-warning-content">
        Past due
      </span>
    )
  }

  if (normalized === "canceled") {
    return (
      <span className="inline-flex rounded-full bg-feedback-danger-subtle px-2.5 py-0.5 text-xs font-medium text-feedback-danger-content">
        Canceled
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-content-secondary">
      {status}
    </span>
  )
}

type PlanTierBadgeProps = {
  planTier: string
}

function PlanTierBadge({ planTier }: PlanTierBadgeProps): React.ReactElement {
  return (
    <span className="inline-flex rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent-text">
      {formatPlanTierLabel(planTier)}
    </span>
  )
}

type TenantBillingPanelProps = {
  tenant: PlatformTenant
  billing: PlatformTenantBilling | null
  billingStatus: "loading" | "error" | "ok"
  billingError: string | null
  getToken: () => Promise<string | null>
  onSuspended: () => void
}

export function TenantBillingPanel({
  tenant,
  billing,
  billingStatus,
  billingError,
  getToken,
  onSuspended,
}: TenantBillingPanelProps): React.ReactElement {
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const renewalDate = billing ? formatBillingRenewalDate(billing.current_period_end) : null
  const showSuspend = canSuspendTenantBilling(billing, tenant.is_disabled)

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Billing</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Platform subscription details from MercFlow billing index.
          </p>
        </div>

        {showSuspend ? (
          <button
            type="button"
            className="rounded-md border border-feedback-danger-content px-3 py-1.5 text-sm font-medium text-feedback-danger-content transition-colors hover:bg-feedback-danger-subtle"
            onClick={() => {
              setIsSuspendModalOpen(true)
            }}
          >
            Suspend tenant
          </button>
        ) : null}
      </div>

      {billingStatus === "loading" ? (
        <p className="mt-4 text-sm text-content-secondary">Loading billing…</p>
      ) : null}

      {billingStatus === "error" && billingError !== null ? (
        <p className="mt-4 text-sm text-feedback-danger-content">{billingError}</p>
      ) : null}

      {billingStatus === "ok" && billing === null ? (
        <p className="mt-4 text-sm text-content-secondary">No platform billing</p>
      ) : null}

      {billingStatus === "ok" && billing !== null ? (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Plan
            </dt>
            <dd className="mt-1">
              <PlanTierBadge planTier={billing.plan_tier} />
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Status
            </dt>
            <dd className="mt-1">
              <BillingStatusBadge status={billing.subscription_status} />
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Interval
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {formatBillingInterval(billing.billing_interval)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Currency
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {formatBillingCurrency(billing.billing_currency)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Renews
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {renewalDate ?? "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
              Stripe
            </dt>
            <dd className="mt-1">
              <a
                href={buildStripeCustomerDashboardUrl(billing.stripe_customer_id)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-accent-text hover:underline"
              >
                View in Stripe
              </a>
            </dd>
          </div>
        </dl>
      ) : null}

      <SuspendTenantModal
        tenant={isSuspendModalOpen ? tenant : null}
        getToken={getToken}
        onClose={() => {
          setIsSuspendModalOpen(false)
        }}
        onSuspended={() => {
          onSuspended()
          setIsSuspendModalOpen(false)
        }}
      />
    </section>
  )
}
