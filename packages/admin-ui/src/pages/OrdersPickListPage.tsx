import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import {
  fetchMercflowPickList,
  type PickListOrderGroup,
} from "@/features/orders/orderNotesAdminApi"

export function OrdersPickListPage(): JSX.Element {
  const [groups, setGroups] = useState<PickListOrderGroup[]>([])
  const [dayLabel, setDayLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const payload = await fetchMercflowPickList("today")
      setGroups(payload.orders)
      setDayLabel(payload.day)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load pick list"
      setGroups([])
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="p-6 print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            to="/orders"
            className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            ← Orders
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-content-primary">
            Pick list
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            Ready-to-ship orders for today ({dayLabel || "UTC day"}).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => {
              window.print()
            }}
          >
            Print
          </Button>
        </div>
      </div>

      <header className="mb-4 hidden print:block">
        <h1 className="text-lg font-semibold text-content-primary">Pick list — {dayLabel}</h1>
        <p className="text-sm text-content-secondary">MercFlow · ready to ship</p>
      </header>

      {errorMessage !== null ? (
        <p className="text-sm text-content-danger print:hidden" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-content-secondary" aria-live="polite">
          Loading pick list…
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-content-secondary">No ready-to-ship orders for today.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.order_id}
              className="break-inside-avoid rounded-lg border border-border-default bg-surface-default p-4 shadow-sm print:shadow-none"
            >
              <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-2">
                <h2 className="text-base font-semibold text-content-primary">
                  Order #{group.display_id}
                </h2>
                <span className="text-sm text-content-secondary">
                  {group.customer_name}
                  {group.shipping_city !== null ? ` · ${group.shipping_city}` : ""}
                </span>
              </header>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
                    <th className="pb-2 pr-4">SKU</th>
                    <th className="pb-2 pr-4">Product</th>
                    <th className="pb-2 pr-4">Variant</th>
                    <th className="pb-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line) => (
                    <tr key={line.line_item_id} className="border-t border-border-subtle">
                      <td className="py-2 pr-4 tabular-nums text-content-secondary">
                        {line.sku ?? "—"}
                      </td>
                      <td className="py-2 pr-4 font-medium text-content-primary">{line.title}</td>
                      <td className="py-2 pr-4 text-content-secondary">{line.variant_label || "—"}</td>
                      <td className="py-2 text-right tabular-nums font-medium text-content-primary">
                        {line.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
