import { useCallback, useMemo, useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"

import { SubscriptionCancelDialog } from "@/components/subscriptions/SubscriptionCancelDialog"
import { SubscriptionDetailActions } from "@/components/subscriptions/SubscriptionDetailActions"
import { SubscriptionIntervalBadge } from "@/components/subscriptions/SubscriptionIntervalBadge"
import { SubscriptionPauseDialog } from "@/components/subscriptions/SubscriptionPauseDialog"
import { SubscriptionRenewalLogTable } from "@/components/subscriptions/SubscriptionRenewalLogTable"
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionStatusBadge"
import { Card } from "@/components/ui/Card"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { applyOptimisticSubscriptionStatus } from "@/features/subscriptions/applyOptimisticSubscriptionStatus"
import { useAdminSubscriptionDetail } from "@/features/subscriptions/useAdminSubscriptionDetail"
import { useSubscriptionStatusActions } from "@/features/subscriptions/useSubscriptionStatusActions"
import { useListReturnHref } from "@/hooks/useListReturnHref"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

function SubscriptionBackendMissingNotice(): ReactNode {
  return (
    <div className="p-6 text-sm text-content-secondary">
      Configure{" "}
      <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
        VITE_MEDUSA_ADMIN_BACKEND_URL
      </code>{" "}
      so this view can call the Medusa admin subscription APIs.
    </div>
  )
}

function SubscriptionDetailPageContent(): ReactNode {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const subscriptionsListHref = useListReturnHref("/subscriptions")
  const { detail, loading, errorMessage, refresh, replaceSubscription } =
    useAdminSubscriptionDetail(subscriptionId)

  const [pauseOpen, setPauseOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const onOptimisticStatus = useCallback(
    (id: string, status: string): void => {
      if (detail === null || detail.id !== id) {
        return
      }
      replaceSubscription(applyOptimisticSubscriptionStatus(detail, status))
    },
    [detail, replaceSubscription]
  )

  const onRevert = useCallback((): void => {
    void refresh()
  }, [refresh])

  const { actionError, isMutating, clearActionError, pause, cancel, resume } =
    useSubscriptionStatusActions({
      onOptimisticStatus,
      onConfirmedUpdate: replaceSubscription,
      onRevert,
    })

  const headerTitle = useMemo(() => {
    if (detail?.product_label) {
      return detail.product_label
    }
    return subscriptionId ?? "Subscription"
  }, [detail?.product_label, subscriptionId])

  if (loading && detail === null && errorMessage === null) {
    return (
      <div className="p-6">
        <MainLoadingFallback />
      </div>
    )
  }

  if (errorMessage !== null && detail === null) {
    return (
      <div className="p-6">
        <Card className="border-feedback-danger-border bg-feedback-danger-subtle px-6 py-8">
          <p className="text-sm text-feedback-danger-content" role="alert">
            {errorMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary"
              onClick={() => {
                void refresh()
              }}
            >
              Retry
            </button>
            <Link
              to={subscriptionsListHref}
              className="rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse"
            >
              Back to subscriptions
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">Subscription not available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <Link
          to={subscriptionsListHref}
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Subscriptions
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-content-primary">{headerTitle}</h1>
            <p className="mt-1 text-sm text-content-tertiary">Subscription #{detail.id}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SubscriptionStatusBadge status={detail.status} />
              <SubscriptionIntervalBadge interval={detail.interval} />
            </div>
          </div>
          <SubscriptionDetailActions
            subscription={detail}
            isMutating={isMutating}
            onPause={() => {
              clearActionError()
              setPauseOpen(true)
            }}
            onCancel={() => {
              clearActionError()
              setCancelOpen(true)
            }}
            onResume={() => {
              clearActionError()
              void resume(detail.id)
            }}
          />
        </div>
      </div>

      {actionError !== null ? (
        <div className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content">
          {actionError}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-interface font-semibold text-content-primary">Subscription details</h2>
        </div>
        <dl className="grid gap-4 px-6 py-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Customer</dt>
            <dd className="mt-1 text-sm text-content-primary">
              <Link
                to={`/customers/${encodeURIComponent(detail.customer_id)}`}
                className="text-interactive-primary hover:text-interactive-primary-hover"
              >
                {detail.customer_display ?? detail.customer_id}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Next renewal</dt>
            <dd className="mt-1 text-sm text-content-primary">
              {detail.next_renewal_at == null ? (
                "—"
              ) : (
                <time dateTime={detail.next_renewal_at}>
                  {new Date(detail.next_renewal_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Current period</dt>
            <dd className="mt-1 text-sm text-content-primary">
              {new Date(detail.current_period_start).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {" – "}
              {new Date(detail.current_period_end).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-content-tertiary">Stripe subscription</dt>
            <dd className="mt-1 text-sm text-content-secondary">
              {detail.stripe_subscription_id ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-interface font-semibold text-content-primary">Renewal log</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Past renewal attempts and linked orders.
          </p>
        </div>
        <SubscriptionRenewalLogTable rows={detail.renewal_logs} isLoading={loading} />
      </Card>

      <SubscriptionPauseDialog
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        productLabel={detail.product_label}
        isSubmitting={isMutating}
        onConfirm={(resumeDate) => {
          void (async (): Promise<void> => {
            const ok = await pause(detail.id, resumeDate)
            if (ok) {
              setPauseOpen(false)
            }
          })()
        }}
      />

      <SubscriptionCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        productLabel={detail.product_label}
        isSubmitting={isMutating}
        onConfirm={() => {
          void (async (): Promise<void> => {
            const ok = await cancel(detail.id)
            if (ok) {
              setCancelOpen(false)
            }
          })()
        }}
      />

    </div>
  )
}

export function SubscriptionDetailPage(): ReactNode {
  if (resolveMedusaAdminBackendUrl() === null) {
    return <SubscriptionBackendMissingNotice />
  }

  return <SubscriptionDetailPageContent />
}
