import { useCallback } from "react"

import { ConnectorsOverviewGrid } from "@/components/connectors/ConnectorsOverviewGrid"
import { useConnectorsOverview } from "@/features/connectors"

/**
 * Lists available MercFlow connectors (`GET /admin/connectors`) with status badges.
 */
export function ConnectorsPage(): JSX.Element {
  const { state, reload } = useConnectorsOverview()

  const reloadClick = useCallback((): void => {
    void reload()
  }, [reload])

  const blockingNotice =
    state.status === "config_error" || state.status === "error"

  let notice: JSX.Element | null = null

  if (blockingNotice) {
    notice = (
      <div
        role="alert"
        className="mb-4 rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
      >
        <p className="font-medium text-content-primary">
          {state.status === "config_error"
            ? "Admin backend not configured"
            : "Unable to load connectors"}
        </p>
        <p className="mt-2">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={reloadClick}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-content-primary">Connectors</h1>
          <p className="mt-1 max-w-xl text-sm text-content-secondary">
            Integrations inherit MercFlow connector tokens only — Shipmondo, Stripe, Plunk, and Tag
            Manager appear here whenever the backend exposes them via{" "}
            <code className="rounded-sm bg-surface-subtle px-1 text-xs text-content-secondary">
              GET /admin/connectors
            </code>
            .
          </p>
        </div>
      </header>
      {notice}
      {state.status === "loading" || state.status === "idle" ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy aria-label="Loading connectors">
          {["a", "b", "c", "d"].map((k) => (
            <li key={k}>
              <div className="h-48 animate-pulse rounded-md border border-border-default bg-surface-subtle p-6" />
            </li>
          ))}
        </ul>
      ) : null}
      {state.status === "success" ? <ConnectorsOverviewGrid items={state.items} /> : null}
    </div>
  )
}
