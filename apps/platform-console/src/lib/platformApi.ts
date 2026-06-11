import type {
  PlatformQueueJobsResponse,
  PlatformQueueRetryResponse,
  PlatformQueuesResponse,
} from "@/types/platformQueues"

const DEFAULT_BACKEND_URL = "http://localhost:9000"

export function resolvePlatformBackendUrl(): string {
  const configured = import.meta.env.VITE_PLATFORM_BACKEND_URL?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL
}

async function fetchPlatformJson<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing Clerk session token")
  }

  const backendUrl = resolvePlatformBackendUrl()
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Platform API returned ${response.status}`)
  }

  return (await response.json()) as T
}

export async function fetchPlatformHealth(
  getToken: () => Promise<string | null>,
): Promise<Response> {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing Clerk session token")
  }

  const backendUrl = resolvePlatformBackendUrl()
  return fetch(`${backendUrl}/platform/health`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchPlatformQueues(
  getToken: () => Promise<string | null>,
): Promise<PlatformQueuesResponse> {
  return fetchPlatformJson<PlatformQueuesResponse>("/platform/queues", getToken)
}

export async function fetchPlatformQueueJobs(
  queueName: string,
  getToken: () => Promise<string | null>,
): Promise<PlatformQueueJobsResponse> {
  const encoded = encodeURIComponent(queueName)
  return fetchPlatformJson<PlatformQueueJobsResponse>(
    `/platform/queues/${encoded}/jobs?status=failed`,
    getToken,
  )
}

export async function retryPlatformQueueJob(
  queueName: string,
  jobId: string,
  getToken: () => Promise<string | null>,
): Promise<PlatformQueueRetryResponse> {
  const encodedQueue = encodeURIComponent(queueName)
  const encodedJob = encodeURIComponent(jobId)
  return fetchPlatformJson<PlatformQueueRetryResponse>(
    `/platform/queues/${encodedQueue}/jobs/${encodedJob}/retry`,
    getToken,
    { method: "POST" },
  )
}
