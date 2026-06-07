import type { FormEvent } from "react"
import { type ReactNode, useCallback, useEffect, useMemo, useReducer } from "react"
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

type PurchaseOrderReceiveState = {
  detail: PurchaseOrderDetailDto | null
  drafts: Record<string, LineReceiveDraft>
  loading: boolean
  saving: boolean
  error: string | null
}

type PurchaseOrderReceiveAction =
  | { type: "loadStart" }
  | { type: "loadFinish" }
  | { type: "loadSuccess"; detail: PurchaseOrderDetailDto; drafts: Record<string, LineReceiveDraft> }
  | { type: "setError"; message: string | null }
  | { type: "setDetail"; detail: PurchaseOrderDetailDto }
  | { type: "updateDraft"; lineId: string; patch: Partial<LineReceiveDraft> }
  | { type: "saveStart" }
  | { type: "saveFinish" }

const INITIAL_PURCHASE_ORDER_RECEIVE_STATE: PurchaseOrderReceiveState = {
  detail: null,
  drafts: {},
  loading: true,
  saving: false,
  error: null,
}

function buildDraftsFromDetail(row: PurchaseOrderDetailDto): Record<string, LineReceiveDraft> {
  const nextDrafts: Record<string, LineReceiveDraft> = {}
  for (const line of row.lines) {
    const remaining = Math.max(0, line.ordered_qty - (line.received_total ?? 0))
    nextDrafts[line.id] = {
      received_qty: remaining > 0 ? String(remaining) : "",
      notes: "",
    }
  }
  return nextDrafts
}

function purchaseOrderReceiveReducer(
  state: PurchaseOrderReceiveState,
  action: PurchaseOrderReceiveAction,
): PurchaseOrderReceiveState {
  switch (action.type) {
    case "loadStart":
      return { ...state, loading: true, error: null }
    case "loadFinish":
      return { ...state, loading: false }
    case "loadSuccess":
      return {
        ...state,
        detail: action.detail,
        drafts: action.drafts,
      }
    case "setError":
      return { ...state, error: action.message }
    case "setDetail":
      return { ...state, detail: action.detail }
    case "updateDraft": {
      const existing = state.drafts[action.lineId] ?? { received_qty: "", notes: "" }
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.lineId]: { ...existing, ...action.patch },
        },
      }
    }
    case "saveStart":
      return { ...state, saving: true, error: null }
    case "saveFinish":
      return { ...state, saving: false }
    default:
      return state
  }
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

export function PurchaseOrderReceivePage(): ReactNode {
  const { poId } = useParams<{ poId: string }>()
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [state, dispatch] = useReducer(
    purchaseOrderReceiveReducer,
    INITIAL_PURCHASE_ORDER_RECEIVE_STATE,
  )
  const { detail, drafts, loading, saving, error } = state

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend || !poId) {
      dispatch({ type: "loadFinish" })
      return
    }
    dispatch({ type: "loadStart" })
    try {
      const row = await getPurchaseOrderAdmin(poId)
      dispatch({
        type: "loadSuccess",
        detail: row,
        drafts: buildDraftsFromDetail(row),
      })
    } catch (e) {
      dispatch({
        type: "setError",
        message: e instanceof Error ? e.message : "Failed to load purchase order",
      })
    } finally {
      dispatch({ type: "loadFinish" })
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
        dispatch({
          type: "setError",
          message: "Enter a positive received quantity for at least one line",
        })
        return
      }

      dispatch({ type: "saveStart" })
      try {
        const updated = await receivePurchaseOrderAdmin(poId, payload)
        dispatch({ type: "setDetail", detail: updated })
        if (updated.purchase_order.status === "received") {
          navigate("/inventory/purchase-orders")
          return
        }
        await load()
      } catch (e) {
        dispatch({
          type: "setError",
          message: e instanceof Error ? e.message : "Receive failed",
        })
      } finally {
        dispatch({ type: "saveFinish" })
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
                          dispatch({
                            type: "updateDraft",
                            lineId: line.id,
                            patch: { received_qty: event.target.value },
                          })
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
                          dispatch({
                            type: "updateDraft",
                            lineId: line.id,
                            patch: { notes: event.target.value },
                          })
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
