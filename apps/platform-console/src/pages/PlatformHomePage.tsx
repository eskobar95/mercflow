import { useAuth } from "@clerk/react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { PLATFORM_NAV_ITEMS } from "@/config/platformNav"
import { fetchPlatformHealth } from "@/lib/platformApi"

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; role: string | null; bypassrls: boolean | null }
  | { status: "error"; message: string }

export function PlatformHomePage(): React.ReactElement {
  const { getToken } = useAuth()
  const [health, setHealth] = useState<HealthState>({ status: "idle" })

  useEffect(() => {
    let cancelled = false

    async function loadHealth(): Promise<void> {
      setHealth({ status: "loading" })

      try {
        const response = await fetchPlatformHealth(() => getToken())
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            message?: string
          } | null
          if (!cancelled) {
            setHealth({
              status: "error",
              message: body?.message ?? `Platform API returned ${response.status}`,
            })
          }
          return
        }

        const body = (await response.json()) as {
          db:
            | { configured: false }
            | { configured: true; role: string; bypassrls: boolean }
        }

        if (!cancelled) {
          if (body.db.configured) {
            setHealth({
              status: "ok",
              role: body.db.role,
              bypassrls: body.db.bypassrls,
            })
          } else {
            setHealth({
              status: "ok",
              role: null,
              bypassrls: null,
            })
          }
        }
      } catch (error) {
        if (!cancelled) {
          setHealth({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to reach /platform/health",
          })
        }
      }
    }

    void loadHealth()

    return () => {
      cancelled = true
    }
  }, [getToken])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">Overview</h2>
        <p className="mt-2 max-w-2xl text-sm text-content-secondary">
          Platform Console scaffold is live. Choose a section from the sidebar
          or the cards below. Tenant provisioning, queue monitoring, and audit
          flows arrive in S030–S031.
        </p>
      </section>

      <section className="rounded-lg border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-sm font-semibold text-content-primary">
          Platform API health
        </h3>
        {health.status === "loading" ? (
          <p className="mt-2 text-sm text-content-secondary">Checking…</p>
        ) : null}
        {health.status === "error" ? (
          <p className="mt-2 text-sm text-content-danger">{health.message}</p>
        ) : null}
        {health.status === "ok" ? (
          <dl className="mt-3 grid gap-2 text-sm text-content-secondary sm:grid-cols-2">
            <div>
              <dt className="font-medium text-content-primary">DB role</dt>
              <dd>{health.role ?? "PLATFORM_DATABASE_URL not configured"}</dd>
            </div>
            <div>
              <dt className="font-medium text-content-primary">BYPASSRLS</dt>
              <dd>
                {health.bypassrls === null
                  ? "n/a"
                  : health.bypassrls
                    ? "yes"
                    : "no"}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="rounded-lg border border-border-subtle bg-surface-raised p-5 transition-colors hover:border-border-strong hover:bg-surface-subtle"
          >
            <h3 className="text-base font-semibold text-content-primary">
              {item.label}
            </h3>
            <p className="mt-2 text-sm text-content-secondary">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}
