type HetznerMetricValue = {
  timestamp: string
  value: string
}

type HetznerMetricsResponse = {
  metrics?: {
    time_series?: Record<string, { values: HetznerMetricValue[] }>
  }
}

type HetznerServerResponse = {
  server?: {
    server_type?: {
      memory?: number
    }
  }
}

export type HetznerMetricsSnapshot = {
  configured: boolean
  cpu_percent: number | null
  memory_gb: number | null
  memory_percent: number | null
  error: string | null
}

function averageCpuPercent(timeSeries: HetznerMetricsResponse): number | null {
  const cpuSeries = timeSeries.metrics?.time_series?.cpu
  if (!cpuSeries?.values?.length) {
    return null
  }

  const values = cpuSeries.values
    .map((entry) => Number(entry.value))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return null
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.round(average * 1000) / 10
}

export async function fetchHetznerMetrics(): Promise<HetznerMetricsSnapshot> {
  const token = process.env.HETZNER_API_TOKEN?.trim()
  const serverId = process.env.HETZNER_SERVER_ID?.trim()

  if (!token || !serverId) {
    return {
      configured: false,
      cpu_percent: null,
      memory_gb: null,
      memory_percent: null,
      error: null,
    }
  }

  const end = new Date()
  const start = new Date(end.getTime() - 60 * 60 * 1000)

  try {
    const metricsUrl = new URL(`https://api.hetzner.cloud/v1/servers/${serverId}/metrics`)
    metricsUrl.searchParams.set("type", "cpu")
    metricsUrl.searchParams.set("start", start.toISOString())
    metricsUrl.searchParams.set("end", end.toISOString())

    const metricsResponse = await fetch(metricsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!metricsResponse.ok) {
      return {
        configured: true,
        cpu_percent: null,
        memory_gb: null,
        memory_percent: null,
        error: `Hetzner metrics API returned ${metricsResponse.status}`,
      }
    }

    const metricsBody = (await metricsResponse.json()) as HetznerMetricsResponse
    const cpuPercent = averageCpuPercent(metricsBody)

    const serverResponse = await fetch(
      `https://api.hetzner.cloud/v1/servers/${serverId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    let memoryGb: number | null = null
    if (serverResponse.ok) {
      const serverBody = (await serverResponse.json()) as HetznerServerResponse
      const memory = serverBody.server?.server_type?.memory
      if (typeof memory === "number" && Number.isFinite(memory)) {
        memoryGb = memory
      }
    }

    return {
      configured: true,
      cpu_percent: cpuPercent,
      memory_gb: memoryGb,
      memory_percent: null,
      error: null,
    }
  } catch (error) {
    return {
      configured: true,
      cpu_percent: null,
      memory_gb: null,
      memory_percent: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch Hetzner metrics",
    }
  }
}
