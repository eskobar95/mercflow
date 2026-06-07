import type { FormEvent } from "react"
import { type ReactNode, useCallback, useEffect, useReducer } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Textarea } from "@/components/ui/Textarea"
import { createPurchaseOrderAdmin } from "@/features/inventory/purchaseOrdersAdminApi"
import { listSuppliersAdmin } from "@/features/inventory/suppliersAdminApi"
import type { SupplierDto } from "@/features/inventory/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type LineDraft = {
  key: string
  variant_id: string
  ordered_qty: string
  unit_cost: string
}

function createEmptyLine(): LineDraft {
  return { key: crypto.randomUUID(), variant_id: "", ordered_qty: "1", unit_cost: "0" }
}

type PurchaseOrderCreateState = {
  suppliers: SupplierDto[]
  supplierId: string
  expectedDate: string
  reference: string
  notes: string
  lines: LineDraft[]
  loadingSuppliers: boolean
  saving: boolean
  error: string | null
}

type PurchaseOrderCreateAction =
  | { type: "setSupplierId"; value: string }
  | { type: "setExpectedDate"; value: string }
  | { type: "setReference"; value: string }
  | { type: "setNotes"; value: string }
  | { type: "updateLine"; index: number; patch: Partial<LineDraft> }
  | { type: "addLine" }
  | { type: "loadSuppliersStart" }
  | { type: "loadSuppliersFinish" }
  | { type: "loadSuppliersSuccess"; suppliers: SupplierDto[] }
  | { type: "setError"; message: string | null }
  | { type: "saveStart" }
  | { type: "saveFinish" }

const INITIAL_PURCHASE_ORDER_CREATE_STATE: PurchaseOrderCreateState = {
  suppliers: [],
  supplierId: "",
  expectedDate: "",
  reference: "",
  notes: "",
  lines: [createEmptyLine()],
  loadingSuppliers: true,
  saving: false,
  error: null,
}

function purchaseOrderCreateReducer(
  state: PurchaseOrderCreateState,
  action: PurchaseOrderCreateAction,
): PurchaseOrderCreateState {
  switch (action.type) {
    case "setSupplierId":
      return { ...state, supplierId: action.value }
    case "setExpectedDate":
      return { ...state, expectedDate: action.value }
    case "setReference":
      return { ...state, reference: action.value }
    case "setNotes":
      return { ...state, notes: action.value }
    case "updateLine": {
      const next = [...state.lines]
      const current = next[action.index]
      if (current) {
        next[action.index] = { ...current, ...action.patch }
      }
      return { ...state, lines: next }
    }
    case "addLine":
      return { ...state, lines: [...state.lines, createEmptyLine()] }
    case "loadSuppliersStart":
      return { ...state, loadingSuppliers: true }
    case "loadSuppliersFinish":
      return { ...state, loadingSuppliers: false }
    case "loadSuppliersSuccess":
      return {
        ...state,
        suppliers: action.suppliers,
        supplierId: action.suppliers[0]?.id ?? state.supplierId,
      }
    case "setError":
      return { ...state, error: action.message }
    case "saveStart":
      return { ...state, saving: true, error: null }
    case "saveFinish":
      return { ...state, saving: false }
    default:
      return state
  }
}

export function PurchaseOrderCreatePage(): ReactNode {
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [state, dispatch] = useReducer(
    purchaseOrderCreateReducer,
    INITIAL_PURCHASE_ORDER_CREATE_STATE,
  )
  const {
    suppliers,
    supplierId,
    expectedDate,
    reference,
    notes,
    lines,
    loadingSuppliers,
    saving,
    error,
  } = state

  useEffect(() => {
    if (!hasBackend) {
      dispatch({ type: "loadSuppliersFinish" })
      return
    }
    void (async (): Promise<void> => {
      dispatch({ type: "loadSuppliersStart" })
      try {
        const rows = await listSuppliersAdmin()
        dispatch({ type: "loadSuppliersSuccess", suppliers: rows })
      } catch (e) {
        dispatch({
          type: "setError",
          message: e instanceof Error ? e.message : "Failed to load suppliers",
        })
      } finally {
        dispatch({ type: "loadSuppliersFinish" })
      }
    })()
  }, [hasBackend])

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (!hasBackend) {
        dispatch({ type: "setError", message: "Backend URL is not configured" })
        return
      }
      if (supplierId === "") {
        dispatch({ type: "setError", message: "Select a supplier" })
        return
      }
      const parsedLines: Array<{
        variant_id: string
        ordered_qty: number
        unit_cost: number
      }> = []
      for (const line of lines) {
        const variantId = line.variant_id.trim()
        if (variantId.length === 0) {
          continue
        }
        parsedLines.push({
          variant_id: variantId,
          ordered_qty: Number.parseInt(line.ordered_qty, 10),
          unit_cost: Number.parseFloat(line.unit_cost),
        })
      }

      if (parsedLines.length === 0) {
        dispatch({ type: "setError", message: "Add at least one line with a variant id" })
        return
      }

      for (const line of parsedLines) {
        if (!Number.isFinite(line.ordered_qty) || line.ordered_qty < 1) {
          dispatch({ type: "setError", message: "Ordered quantity must be a positive integer" })
          return
        }
        if (!Number.isFinite(line.unit_cost) || line.unit_cost < 0) {
          dispatch({ type: "setError", message: "Unit cost must be zero or greater" })
          return
        }
      }

      dispatch({ type: "saveStart" })
      try {
        const expectedIso =
          expectedDate.trim() === ""
            ? null
            : new Date(expectedDate).toISOString()
        await createPurchaseOrderAdmin({
          supplier_id: supplierId,
          expected_date: expectedIso,
          reference: reference.trim() === "" ? null : reference.trim(),
          notes: notes.trim() === "" ? null : notes.trim(),
          lines: parsedLines,
        })
        navigate("/inventory/purchase-orders")
      } catch (e) {
        dispatch({
          type: "setError",
          message: e instanceof Error ? e.message : "Create failed",
        })
      } finally {
        dispatch({ type: "saveFinish" })
      }
    },
    [expectedDate, hasBackend, lines, navigate, notes, reference, supplierId]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="New purchase order"
        description="Creates a draft PO. Mark it ordered from the list when sent to the supplier."
      />
      {!hasBackend ? (
        <p className="mt-6 text-sm text-text-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to create purchase orders.
        </p>
      ) : loadingSuppliers ? (
        <p className="mt-6 text-sm text-content-secondary">Loading suppliers…</p>
      ) : suppliers.length === 0 ? (
        <p className="mt-6 text-sm text-content-secondary">
          Add a{" "}
          <Link
            to="/inventory/suppliers/new"
            className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            supplier
          </Link>{" "}
          before creating a purchase order.
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-6 max-w-2xl space-y-4">
          <FormField label="Supplier" htmlFor="po-supplier" required>
            <select
              id="po-supplier"
              className="w-full rounded-md border border-border-default bg-surface-base px-3 py-2 text-sm text-content-primary"
              value={supplierId}
              onChange={(e) => dispatch({ type: "setSupplierId", value: e.target.value })}
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Expected date" htmlFor="po-expected">
            <Input
              id="po-expected"
              type="datetime-local"
              value={expectedDate}
              onChange={(e) => dispatch({ type: "setExpectedDate", value: e.target.value })}
            />
          </FormField>
          <FormField label="Reference" htmlFor="po-reference">
            <Input
              id="po-reference"
              value={reference}
              onChange={(e) => dispatch({ type: "setReference", value: e.target.value })}
            />
          </FormField>
          <FormField label="Notes" htmlFor="po-notes">
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(e) => dispatch({ type: "setNotes", value: e.target.value })}
              rows={3}
            />
          </FormField>
          <div className="space-y-3">
            <p className="text-sm font-medium text-content-primary">Lines</p>
            {lines.map((line, index) => (
              <div
                key={line.key}
                className="grid gap-3 rounded-lg border border-border-default p-4 sm:grid-cols-3"
              >
                <FormField label="Variant id" htmlFor={`variant-${index}`}>
                  <Input
                    id={`variant-${index}`}
                    value={line.variant_id}
                    onChange={(e) => {
                      dispatch({
                        type: "updateLine",
                        index,
                        patch: { variant_id: e.target.value },
                      })
                    }}
                  />
                </FormField>
                <FormField label="Qty" htmlFor={`qty-${index}`}>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min={1}
                    value={line.ordered_qty}
                    onChange={(e) => {
                      dispatch({
                        type: "updateLine",
                        index,
                        patch: { ordered_qty: e.target.value },
                      })
                    }}
                  />
                </FormField>
                <FormField label="Unit cost" htmlFor={`cost-${index}`}>
                  <Input
                    id={`cost-${index}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(e) => {
                      dispatch({
                        type: "updateLine",
                        index,
                        patch: { unit_cost: e.target.value },
                      })
                    }}
                  />
                </FormField>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => dispatch({ type: "addLine" })}
            >
              Add line
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-feedback-danger-content" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create draft"}
            </Button>
            <Link
              to="/inventory/purchase-orders"
              className="inline-flex items-center text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
