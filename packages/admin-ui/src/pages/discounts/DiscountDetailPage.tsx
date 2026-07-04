import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { DiscountStatusBadge } from "@/components/discounts/DiscountStatusBadge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DialogFooter, DialogShell } from "@/components/ui/Dialog"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  activateAdminDiscount,
  deactivateAdminDiscount,
  deleteAdminDiscount,
  getAdminDiscount,
} from "@/features/discounts/discountsApi"
import type { AdminDiscountDetail } from "@/features/discounts/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { discountTypeTitle } from "@/features/discounts/discountTypeLabels"

function formatDateTime(value: string | null): string {
  if (value === null) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatUsage(detail: AdminDiscountDetail): string {
  if (detail.usage_limit === null) {
    return `${detail.usage_count} uses`
  }
  return `${detail.usage_count} / ${detail.usage_limit} uses`
}

function formatValue(detail: AdminDiscountDetail): string {
  if (detail.value === null) {
    return "—"
  }
  if (detail.value_type === "fixed") {
    return `${detail.value} off`
  }
  return `${detail.value}% off`
}

function DiscountDetailBackendMissingNotice(): ReactNode {
  return (
    <div className="p-6 text-sm text-content-secondary">
      Configure{" "}
      <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
        VITE_MEDUSA_ADMIN_BACKEND_URL
      </code>{" "}
      to view discount details.
    </div>
  )
}

function DiscountDetailPageContent({ discountId }: { discountId: string }): ReactNode {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AdminDiscountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setActionError(null)
    try {
      const loaded = await getAdminDiscount(discountId)
      setDetail(loaded)
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Failed to load discount")
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [discountId])

  useEffect(() => {
    void load()
  }, [load])

  const breadcrumbs = useMemo(
    () => [
      { label: "Discounts", href: "/discounts" },
      { label: detail?.name ?? "Discount" },
    ],
    [detail?.name],
  )

  const runAction = useCallback(
    async (action: "activate" | "deactivate" | "delete"): Promise<void> => {
      setActionLoading(true)
      setActionError(null)
      try {
        if (action === "delete") {
          await deleteAdminDiscount(discountId)
          navigate("/discounts")
          return
        }

        const updated =
          action === "activate"
            ? await activateAdminDiscount(discountId)
            : await deactivateAdminDiscount(discountId)
        setDetail(updated)
        setDeleteOpen(false)
      } catch (error: unknown) {
        setActionError(error instanceof Error ? error.message : "Action failed")
      } finally {
        setActionLoading(false)
      }
    },
    [discountId, navigate],
  )

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-subtle" aria-hidden />
        <div className="h-40 animate-pulse rounded-lg bg-surface-subtle" aria-hidden />
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="p-6">
        <Card compact className="border-feedback-danger-border bg-feedback-danger-subtle">
          <p className="text-sm text-feedback-danger-content">
            {actionError ?? "Discount not found"}
          </p>
          <Link
            to="/discounts"
            className="mt-4 inline-flex text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            ← Back to discounts
          </Link>
        </Card>
      </div>
    )
  }

  const canActivate = detail.raw_status !== "active"
  const canDeactivate = detail.raw_status === "active"

  return (
    <div className="flex min-h-full flex-col bg-surface-appCard">
      <PageHeader
        title={detail.name}
        description={`${discountTypeTitle(detail.discount_type)} · ${detail.method}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/discounts/${discountId}/edit`}>
              <Button type="button" variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
            {canActivate ? (
              <Button
                type="button"
                size="sm"
                disabled={actionLoading}
                onClick={() => {
                  void runAction("activate")
                }}
              >
                Activate
              </Button>
            ) : null}
            {canDeactivate ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={actionLoading}
                onClick={() => {
                  void runAction("deactivate")
                }}
              >
                Deactivate
              </Button>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setDeleteOpen(true)
              }}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        {actionError !== null ? (
          <div
            className="rounded-sm border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Card compact>
            <h2 className="text-sm font-semibold text-content-primary">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Status</dt>
                <dd>
                  <DiscountStatusBadge status={detail.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Type</dt>
                <dd className="text-content-primary">{detail.type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Method</dt>
                <dd className="text-content-primary">{detail.method}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Code</dt>
                <dd className="font-mono text-content-primary">{detail.code ?? "Automatic"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-content-secondary">Value</dt>
                <dd className="text-content-primary">{formatValue(detail)}</dd>
              </div>
              {detail.discount_type === "product" || detail.discount_type === "order" ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-content-secondary">Applies to</dt>
                  <dd className="text-content-primary">
                    {detail.catalog_targeting_summary ?? "All products"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card compact>
            <h2 className="text-sm font-semibold text-content-primary">Usage</h2>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-content-primary">
              {formatUsage(detail)}
            </p>
            <p className="mt-2 text-sm text-content-secondary">
              Total redemptions recorded by Medusa&apos;s promotion engine.
            </p>
          </Card>
        </div>

        <Card compact>
          <h2 className="text-sm font-semibold text-content-primary">Conditions</h2>
          {detail.conditions_summary !== null ? (
            <p className="mt-3 text-sm text-content-primary">{detail.conditions_summary}</p>
          ) : null}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {detail.discount_type !== "buyget" ? (
              <div>
                <dt className="text-content-secondary">Minimum order value</dt>
                <dd className="text-content-primary">
                  {detail.minimum_order_amount !== null
                    ? `${detail.minimum_order_amount} ${detail.currency_code.toUpperCase()}`
                    : "No minimum"}
                </dd>
              </div>
            ) : null}
            {detail.discount_type === "product" && detail.product_ids.length > 0 ? (
              <div>
                <dt className="text-content-secondary">Selected products</dt>
                <dd className="text-content-primary">{detail.product_ids.length} product(s)</dd>
              </div>
            ) : null}
            {detail.discount_type === "free_shipping" ? (
              <>
                <div>
                  <dt className="text-content-secondary">Maximum order value</dt>
                  <dd className="text-content-primary">
                    {detail.maximum_order_amount !== null
                      ? `${detail.maximum_order_amount} ${detail.currency_code.toUpperCase()}`
                      : "No limit"}
                  </dd>
                </div>
                <div>
                  <dt className="text-content-secondary">Shipping countries</dt>
                  <dd className="text-content-primary">
                    {detail.shipping_country_codes !== null &&
                    detail.shipping_country_codes.length > 0
                      ? detail.shipping_country_codes.join(", ")
                      : "All countries"}
                  </dd>
                </div>
              </>
            ) : null}
            <div>
              <dt className="text-content-secondary">Start date</dt>
              <dd className="text-content-primary">{formatDateTime(detail.starts_at)}</dd>
            </div>
            <div>
              <dt className="text-content-secondary">End date</dt>
              <dd className="text-content-primary">{formatDateTime(detail.expires_at)}</dd>
            </div>
            <div>
              <dt className="text-content-secondary">Usage limit</dt>
              <dd className="text-content-primary">
                {detail.usage_limit === null ? "Unlimited" : detail.usage_limit}
              </dd>
            </div>
            <div>
              <dt className="text-content-secondary">Customer eligibility</dt>
              <dd className="text-content-primary">All customers</dd>
            </div>
          </dl>
        </Card>
      </div>

      <DialogShell
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete discount?"
        description="This permanently removes the discount. Usage history may no longer be available in admin."
        footer={
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => {
                setDeleteOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionLoading}
              onClick={() => {
                void runAction("delete")
              }}
            >
              {actionLoading ? "Deleting…" : "Delete discount"}
            </Button>
          </DialogFooter>
        }
      />
    </div>
  )
}

export function DiscountDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>()

  if (resolveMedusaAdminBackendUrl() === null) {
    return <DiscountDetailBackendMissingNotice />
  }

  if (id === undefined || id.trim() === "") {
    return (
      <div className="p-6 text-sm text-content-secondary">
        Missing discount id — return to <Link to="/discounts">Discounts</Link>.
      </div>
    )
  }

  return <DiscountDetailPageContent discountId={id} />
}
