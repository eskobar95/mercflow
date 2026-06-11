const DEFAULT_BACKEND_URL = "http://localhost:9000"

export function resolvePlatformBackendUrl(): string {
  const configured = import.meta.env.VITE_PLATFORM_BACKEND_URL?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL
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
