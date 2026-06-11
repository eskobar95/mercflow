import { useAuth } from "@clerk/react"
import { useCallback, useEffect, useState } from "react"

import {
  fetchPlatformAuditLog,
  type PlatformAuditEntry,
} from "@/lib/platformApi"

type AuditState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; entries: PlatformAuditEntry[]; count: number }

function toIsoStartOfDay(dateValue: string): string | undefined {
  if (!dateValue) {
    return undefined
  }
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString()
}

function toIsoEndOfDay(dateValue: string): string | undefined {
  if (!dateValue) {
    return undefined
  }
  return new Date(`${dateValue}T23:59:59.999Z`).toISOString()
}

export function PlatformAuditPage(): React.ReactElement {
  const { getToken } = useAuth()
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>()
  const [appliedTo, setAppliedTo] = useState<string | undefined>()
  const [state, setState] = useState<AuditState>({ status: "loading" })

  const loadAudit = useCallback(async (): Promise<void> => {
    setState({ status: "loading" })

    try {
      const response = await fetchPlatformAuditLog(() => getToken(), {
        from: appliedFrom,
        to: appliedTo,
        limit: 100,
      })

      setState({
        status: "ok",
        entries: response.audit_entries,
        count: response.count,
      })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load audit log",
      })
    }
  }, [appliedFrom, appliedTo, getToken])

  useEffect(() => {
    void loadAudit()
  }, [loadAudit])

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setAppliedFrom(toIsoStartOfDay(fromDate))
    setAppliedTo(toIsoEndOfDay(toDate))
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">Audit log</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Operator actions across the platform.
        </p>
      </section>

      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-wrap items-end gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4"
      >
        <div>
          <label
            htmlFor="audit-from"
            className="block text-sm font-medium text-content-primary"
          >
            From
          </label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-1 rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="audit-to"
            className="block text-sm font-medium text-content-primary"
          >
            To
          </label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-1 rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-surface-sidebarActive px-4 py-2 text-sm font-medium text-content-primary"
        >
          Apply filter
        </button>
      </form>

      {state.status === "loading" ? (
        <p className="text-sm text-content-secondary">Loading audit log…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-sm text-content-danger">{state.message}</p>
      ) : null}

      {state.status === "ok" ? (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-subtle text-content-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Operator</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-raised">
              {state.entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-content-secondary"
                  >
                    No audit entries for the selected period.
                  </td>
                </tr>
              ) : null}
              {state.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 text-content-primary">
                    {entry.operator_email}
                  </td>
                  <td className="px-4 py-3">{entry.action}</td>
                  <td className="px-4 py-3 text-content-secondary">
                    {entry.entity_type}:{entry.entity_id}
                  </td>
                  <td className="px-4 py-3 text-content-secondary">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border-subtle bg-surface-subtle px-4 py-2 text-xs text-content-tertiary">
            Showing {state.entries.length} of {state.count} entries
          </p>
        </div>
      ) : null}
    </div>
  )
}
