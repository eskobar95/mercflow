import type { FormEvent, JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { PoStatusBadge } from "@/components/inventory/PoStatusBadge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Textarea } from "@/components/ui/Textarea"
import {
  getPurchaseOrderAdmin,
  receivePurchaseOrderAdmin,
} from "@/features/inventory/purchaseOrdersAdminApi"
import type { PurchaseOrderDetailDto, PurchaseOrderLineDto } from "@/features/inventory/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type LineReceiveDraft = {
  received_qty: string
  notes: string
}

function canReceive(status: string): boolean {
  return status === "ordered" || status === "partially_received"
}

function formatDiscrepancy(line: PurchaseOrderLineDto): string {
  const discrepancy = line.discrepancy ?? line.ordered_qty - (line.received_total ?? 0)
  if (discrepancy === 0) {
    return "On target"
  }
  if (discrepancy > 0) {
    return `${discrepancy} short`
  }
  return `${Math.abs(discrepancy)} over`
}

export function PurchaseOrderReceivePage(): JSX.Element {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [detail, setDetail] = useState<PurchaseOrderDetailDto | null>(null)
  const [drafts, setDrafts] = useState<Record<string, LineReceiveDraft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend || !poId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const row = await getPurchaseOrderAdmin(poId)
      setDetail(row)
      const nextDrafts: Record<string, LineReceiveDraft> = {}
      for (const line of row.lines) {
        const remaining = Math.max(
          0,
          line.ordered_qty - (line.received_total ?? 0)
        )
        nextDrafts[line.id] = {
          received_qty: remaining > 0 ? String(remaining) : "",
          notes: "",
        }
      }
      setDrafts(nextDrafts)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load purchase order")
    } finally {
      setLoading(false)
    }
  }, [hasBackend, poId])

  useEffect(() => {
    void load()
  }, [load])

  const stockLabel = useMemo((): string => {
    if (!detail) {
      return ""
    }
    return detail.stock_applied
      ? "Medusa stock has been updated for this PO"
      : "Stock not applied — receipt is recorded in MercFlow only"
  }, [detail])

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (!hasBackend || !poId || !detail) {
        return
      }

      const payload = detail.lines
        .map((line) => {
          const draft = drafts[line.id]
          if (!draft) {
            return null
          }
          const qty = Number.parseInt(draft.received_qty, 10)
          if (!Number.isFinite(qty) || qty < 1) {
            return null
          }
          return {
            line_id: line.id,
            received_qty: qty,
            notes: draft.notes.trim() === "" ? null : draft.notes.trim(),
          }
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)

      if (payload.length === 0) {
        setError("Enter a positive received quantity for at least one line")
        return
      }

      setSaving(true)
      setError(null)
      try {
        const updated = await receivePurchaseOrderAdmin(poId, payload)
        setDetail(updated)
        if (updated.purchase_order.status === "received") {
          navigate("/inventory/purchase-orders")
          return
        }
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Receive failed")
      } finally {
        setSaving(false)
      }
    },
    [detail, drafts, hasBackend, load, navigate, poId]
  )

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to record receipts.
        </p>
      </div>
    )
  }

  if (!poId) {
    return (
      <div className="p-6">
        <p className="text-sm text-status-error">Missing purchase order id</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">Loading purchase order…</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <p className="text-sm text-status-error">{error ?? "Purchase order not found"}</p>
        <Link
          to="/inventory/purchase-orders"
          className="mt-4 inline-block text-sm font-medium text-interactive-primary"
        >
          Back to purchase orders
        </Link>
      </div>
    )
  }

  const { purchase_order: po } = detail
  const receivable = canReceive(po.status)

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Receive purchase order"
        description={po.reference ?? po.id}
        actions={
          <Link
            to="/inventory/purchase-orders"
            className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            Back to list
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PoStatusBadge status={po.status} />
        <span
          className={
            detail.stock_applied
              ? "text-sm text-status-success"
              : "text-sm text-status-warning"
          }
        >
          {stockLabel}
        </span>
      </div>

      {!receivable ? (
        <p className="text-sm text-content-secondary">
          This purchase order cannot receive goods in status &quot;{po.status}&quot;.
        </p>
      ) : null}

      {error ? <p className="text-sm text-status-error">{error}</p> : null}

      <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
        <div className="overflow-x-auto rounded-lg border border-border-default">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-default bg-surface-subtle">
              <tr>
                <th className="px-4 py-3 font-medium text-content-primary">Variant</th>
                <th className="px-4 py-3 font-medium text-content-primary">Ordered</th>
                <th className="px-4 py-3 font-medium text-content-primary">Received</th>
                <th className="px-4 py-3 font-medium text-content-primary">Variance</th>
                <th className="px-4 py-3 font-medium text-content-primary">Receive now</th>
                <th className="px-4 py-3 font-medium text-content-primary">Notes</th>
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((line) => {
                const draft = drafts[line.id] ?? { received_qty: "", notes: "" }
                const varianceClass =
                  (line.discrepancy ?? 0) > 0
                    ? "text-status-warning"
                    : (line.discrepancy ?? 0) < 0
                      ? "text-status-error"
                      : "text-content-secondary"
                return (
                  <tr key={line.id} className="border-b border-border-default last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{line.variant_id}</td>
                    <td className="px-4 py-3">{line.ordered_qty}</td>
                    <td className="px-4 py-3">{line.received_total ?? 0}</td>
                    <td className={`px-4 py-3 ${varianceClass}`}>{formatDiscrepancy(line)}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Receive quantity for ${line.variant_id}`}
                        value={draft.received_qty}
                        disabled={!receivable || saving}
                        onChange={(event) => {
                          const value = event.target.value
                          setDrafts((prev) => ({
                            ...prev,
                            [line.id]: { ...draft, received_qty: value },
                          }))
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Textarea
                        rows={2}
                        aria-label={`Receipt notes for ${line.variant_id}`}
                        value={draft.notes}
                        disabled={!receivable || saving}
                        onChange={(event) => {
                          const value = event.target.value
                          setDrafts((prev) => ({
                            ...prev,
                            [line.id]: { ...draft, notes: value },
                          }))
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {receivable ? (
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Record receipt"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => navigate("/inventory/purchase-orders")}
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  )
}
