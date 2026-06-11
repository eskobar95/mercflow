import { useAuth } from "@clerk/react"
import { useCallback, useEffect, useState } from "react"

import { formatBytes } from "@/lib/formatBytes"
import { formatDuration } from "@/lib/formatDuration"
import {
  fetchPlatformSystemMetrics,
  type PlatformSystemMetrics,
} from "@/lib/platformApi"

const REFRESH_INTERVAL_MS = 30_000

type MetricsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; metrics: PlatformSystemMetrics }

type MetricCardProps = {
  title: string
  value: string
  detail?: string
}

function MetricCard({ title, value, detail }: MetricCardProps): React.ReactElement {
  return (
    <article className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h3 className="text-sm font-medium text-content-secondary">{title}</h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-content-primary">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-content-tertiary">{detail}</p>
      ) : null}
    </article>
  )
}

export function PlatformSystemPage(): React.ReactElement {
  const { getToken } = useAuth()
  const [state, setState] = useState<MetricsState>({ status: "loading" })

  const loadMetrics = useCallback(async (): Promise<void> => {
    try {
      const metrics = await fetchPlatformSystemMetrics(() => getToken())
      setState({ status: "ok", metrics })
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load system metrics",
      })
    }
  }, [getToken])

  useEffect(() => {
    let cancelled = false

    async function initialLoad(): Promise<void> {
      if (!cancelled) {
        setState({ status: "loading" })
      }
      await loadMetrics()
    }

    void initialLoad()

    const intervalId = window.setInterval(() => {
      void loadMetrics()
    }, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [loadMetrics])

  const metrics = state.status === "ok" ? state.metrics : null

  const cpuValue =
    metrics?.hetzner.configured
      ? metrics.hetzner.cpu_percent !== null
        ? `${metrics.hetzner.cpu_percent}%`
        : "—"
      : "Not configured"

  const ramValue =
    metrics?.hetzner.configured
      ? metrics.hetzner.memory_percent !== null
        ? `${metrics.hetzner.memory_percent}%`
        : metrics.hetzner.memory_gb !== null
          ? `${metrics.hetzner.memory_gb} GB`
          : "—"
      : "Not configured"

  const neonValue =
    metrics?.neon.configured
      ? metrics.neon.active_connections !== null
        ? String(metrics.neon.active_connections)
        : "—"
      : "Not configured"

  const redisUsedValue =
    metrics?.redis.configured
      ? formatBytes(metrics.redis.used_memory_bytes)
      : "Not configured"

  const redisMaxValue =
    metrics?.redis.configured
      ? formatBytes(metrics.redis.max_memory_bytes)
      : "Not configured"

  const uptimeValue = metrics
    ? formatDuration(metrics.uptime_seconds)
    : "—"

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">System</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Hetzner, Neon, and Redis operational metrics. Refreshes every 30 seconds.
        </p>
        {metrics ? (
          <p className="mt-1 text-xs text-content-tertiary">
            Last updated {new Date(metrics.fetched_at).toLocaleString()}
          </p>
        ) : null}
      </section>

      {state.status === "loading" ? (
        <p className="text-sm text-content-secondary">Loading metrics…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-sm text-content-danger">{state.message}</p>
      ) : null}

      {state.status === "ok" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Hetzner CPU"
            value={cpuValue}
            detail={metrics?.hetzner.error ?? "Last 1 hour average"}
          />
          <MetricCard
            title="Hetzner RAM"
            value={ramValue}
            detail={
              metrics?.hetzner.memory_percent === null
                ? "Usage % unavailable via Hetzner API"
                : undefined
            }
          />
          <MetricCard
            title="Neon connections"
            value={neonValue}
            detail={
              metrics?.neon.max_connections !== null
                ? `Max ${metrics?.neon.max_connections}`
                : metrics?.neon.error ?? undefined
            }
          />
          <MetricCard title="Redis used" value={redisUsedValue} />
          <MetricCard
            title="Redis max"
            value={redisMaxValue}
            detail={metrics?.redis.error ?? undefined}
          />
          <MetricCard title="Backend uptime" value={uptimeValue} />
        </section>
      ) : null}
    </div>
  )
}
