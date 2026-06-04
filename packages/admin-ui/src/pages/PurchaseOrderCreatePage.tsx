import type { FormEvent, JSX } from "react"
import { useCallback, useEffect, useState } from "react"
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
  variant_id: string
  ordered_qty: string
  unit_cost: string
}

const EMPTY_LINE: LineDraft = { variant_id: "", ordered_qty: "1", unit_cost: "0" }

export function PurchaseOrderCreatePage(): JSX.Element {
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<LineDraft[]>([{ ...EMPTY_LINE }])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasBackend) {
      setLoadingSuppliers(false)
      return
    }
    void (async (): Promise<void> => {
      setLoadingSuppliers(true)
      try {
        const rows = await listSuppliersAdmin()
        setSuppliers(rows)
        if (rows[0]) {
          setSupplierId(rows[0].id)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load suppliers")
      } finally {
        setLoadingSuppliers(false)
      }
    })()
  }, [hasBackend])

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (!hasBackend || supplierId === "") {
        setError("Select a supplier")
        return
      }
      const parsedLines = lines
        .map((line) => ({
          variant_id: line.variant_id.trim(),
          ordered_qty: Number.parseInt(line.ordered_qty, 10),
          unit_cost: Number.parseFloat(line.unit_cost),
        }))
        .filter((line) => line.variant_id.length > 0)

      if (parsedLines.length === 0) {
        setError("Add at least one line with a variant id")
        return
      }

      for (const line of parsedLines) {
        if (!Number.isFinite(line.ordered_qty) || line.ordered_qty < 1) {
          setError("Ordered quantity must be a positive integer")
          return
        }
        if (!Number.isFinite(line.unit_cost) || line.unit_cost < 0) {
          setError("Unit cost must be zero or greater")
          return
        }
      }

      setSaving(true)
      setError(null)
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
        setError(e instanceof Error ? e.message : "Create failed")
      } finally {
        setSaving(false)
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
      {loadingSuppliers ? (
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
              onChange={(e) => setSupplierId(e.target.value)}
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
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </FormField>
          <FormField label="Reference" htmlFor="po-reference">
            <Input
              id="po-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </FormField>
          <FormField label="Notes" htmlFor="po-notes">
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </FormField>
          <div className="space-y-3">
            <p className="text-sm font-medium text-content-primary">Lines</p>
            {lines.map((line, index) => (
              <div
                key={`line-${index}`}
                className="grid gap-3 rounded-lg border border-border-default p-4 sm:grid-cols-3"
              >
                <FormField label="Variant id" htmlFor={`variant-${index}`}>
                  <Input
                    id={`variant-${index}`}
                    value={line.variant_id}
                    onChange={(e) => {
                      const next = [...lines]
                      next[index] = { ...line, variant_id: e.target.value }
                      setLines(next)
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
                      const next = [...lines]
                      next[index] = { ...line, ordered_qty: e.target.value }
                      setLines(next)
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
                      const next = [...lines]
                      next[index] = { ...line, unit_cost: e.target.value }
                      setLines(next)
                    }}
                  />
                </FormField>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
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
