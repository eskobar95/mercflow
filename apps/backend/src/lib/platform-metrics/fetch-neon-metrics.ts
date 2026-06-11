type NeonEndpoint = {
  id?: string
  current_state?: string
  active_connections?: number
  connection_count?: number
  connections?: number
}

type NeonEndpointsResponse = {
  endpoints?: NeonEndpoint[]
}

export type NeonMetricsSnapshot = {
  configured: boolean
  active_connections: number | null
  max_connections: number | null
  error: string | null
}

function resolveEndpointConnections(endpoint: NeonEndpoint): number | null {
  const candidates = [
    endpoint.active_connections,
    endpoint.connection_count,
    endpoint.connections,
  ]

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

export async function fetchNeonMetrics(): Promise<NeonMetricsSnapshot> {
  const apiKey = process.env.NEON_API_KEY?.trim()
  const projectId = process.env.NEON_PROJECT_ID?.trim()
  const branchId = process.env.NEON_BRANCH_ID?.trim()

  if (!apiKey || !projectId || !branchId) {
    return {
      configured: false,
      active_connections: null,
      max_connections: null,
      error: null,
    }
  }

  try {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/endpoints`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      return {
        configured: true,
        active_connections: null,
        max_connections: null,
        error: `Neon API returned ${response.status}`,
      }
    }

    const body = (await response.json()) as NeonEndpointsResponse
    const endpoints = body.endpoints ?? []

    let activeConnections = 0
    let hasConnectionData = false

    for (const endpoint of endpoints) {
      const connections = resolveEndpointConnections(endpoint)
      if (connections !== null) {
        hasConnectionData = true
        activeConnections += connections
      }
    }

    const maxConnections = process.env.NEON_MAX_CONNECTIONS?.trim()
    const parsedMax = maxConnections ? Number(maxConnections) : null

    return {
      configured: true,
      active_connections: hasConnectionData ? activeConnections : null,
      max_connections:
        parsedMax !== null && Number.isFinite(parsedMax) ? parsedMax : null,
      error: null,
    }
  } catch (error) {
    return {
      configured: true,
      active_connections: null,
      max_connections: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch Neon metrics",
    }
  }
}
