import { useAuth } from "@clerk/react"
import { useCallback, useEffect, useState } from "react"

import {
  fetchPlatformEmailDeliveries,
  fetchPlatformEmailDomains,
  type PlatformEmailDelivery,
  type PlatformEmailDomain,
} from "@/lib/platformApi"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ok"
      deliveries: PlatformEmailDelivery[]
      domains: PlatformEmailDomain[]
      count: number
    }

function statusBadgeClass(status: string): string {
  if (status === "failed" || status === "dead_letter") {
    return "bg-surface-subtle text-content-danger"
  }
  return "bg-surface-subtle text-content-secondary"
}

export function PlatformEmailPage(): React.ReactElement {
  const { getToken } = useAuth()
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const loadData = useCallback(async (): Promise<void> => {
    setState({ status: "loading" })

    try {
      const [deliveriesResponse, domainsResponse] = await Promise.all([
        fetchPlatformEmailDeliveries(() => getToken(), {
          q: appliedQuery || undefined,
          limit: 50,
        }),
        fetchPlatformEmailDomains(() => getToken()),
      ])

      setState({
        status: "ok",
        deliveries: deliveriesResponse.email_deliveries,
        domains: domainsResponse.email_domains,
        count: deliveriesResponse.count,
      })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load email data",
      })
    }
  }, [appliedQuery, getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setAppliedQuery(searchInput.trim())
    setExpandedId(null)
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">Email</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Cross-tenant delivery history and SES domain status.
        </p>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-semibold text-content-primary">
          SES domain status
        </h3>
        {state.status === "ok" && state.domains.length === 0 ? (
          <p className="mt-2 text-sm text-content-secondary">No email configs found.</p>
        ) : null}
        {state.status === "ok" && state.domains.length > 0 ? (
          <ul className="mt-3 divide-y divide-border-subtle">
            {state.domains.map((domain) => (
              <li
                key={domain.store_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium text-content-primary">
                  {domain.store_id}
                </span>
                <span className="text-content-secondary">
                  {domain.domain ?? "No domain"}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                    domain.ses_domain_status,
                  )}`}
                >
                  {domain.ses_domain_status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label
              htmlFor="email-search"
              className="block text-sm font-medium text-content-primary"
            >
              Search deliveries
            </label>
            <input
              id="email-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Email address or order ID"
              className="mt-1 w-full min-w-[16rem] rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2 text-sm text-content-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-surface-sidebarActive px-4 py-2 text-sm font-medium text-content-primary"
          >
            Search
          </button>
        </form>

        {state.status === "loading" ? (
          <p className="text-sm text-content-secondary">Loading deliveries…</p>
        ) : null}

        {state.status === "error" ? (
          <p className="text-sm text-content-danger">{state.message}</p>
        ) : null}

        {state.status === "ok" ? (
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-subtle text-content-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent at</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Expand</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-raised">
                {state.deliveries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-content-secondary"
                    >
                      No deliveries match your search.
                    </td>
                  </tr>
                ) : null}
                {state.deliveries.flatMap((delivery) => {
                  const isExpanded = expandedId === delivery.id
                  const rows: React.ReactElement[] = [
                    <tr key={delivery.id}>
                      <td className="px-4 py-3 text-content-primary">
                        {delivery.store_id}
                      </td>
                      <td className="px-4 py-3">{delivery.to_email}</td>
                      <td className="px-4 py-3">{delivery.template_key}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                            delivery.status,
                          )}`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-secondary">
                        {delivery.sent_at
                          ? new Date(delivery.sent_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : delivery.id)
                          }
                          className="text-sm font-medium text-content-primary"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>,
                  ]

                  if (isExpanded) {
                    rows.push(
                      <tr key={`${delivery.id}-detail`}>
                        <td
                          colSpan={6}
                          className="bg-surface-subtle px-4 py-3 text-sm text-content-secondary"
                        >
                          <dl className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <dt className="font-medium text-content-primary">
                                Entity ID
                              </dt>
                              <dd>{delivery.entity_id}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-content-primary">
                                SES message ID
                              </dt>
                              <dd>{delivery.ses_message_id ?? "—"}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-content-primary">
                                SES error code
                              </dt>
                              <dd>{delivery.ses_error_code ?? "—"}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-content-primary">
                                SES error description
                              </dt>
                              <dd>
                                {delivery.ses_error_description ??
                                  delivery.error_message ??
                                  "—"}
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>,
                    )
                  }

                  return rows
                })}
              </tbody>
            </table>
            <p className="border-t border-border-subtle bg-surface-subtle px-4 py-2 text-xs text-content-tertiary">
              Showing {state.deliveries.length} of {state.count} deliveries
            </p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
