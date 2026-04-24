/**
 * Shared Medusa Admin HTTP helpers for the Vite admin client.
 */

export function resolveMedusaAdminBackendUrl(): string | null {
  const raw = import.meta.env.VITE_MEDUSA_ADMIN_BACKEND_URL
  if (typeof raw !== "string" || raw.trim() === "") {
    return null
  }
  return raw.replace(/\/$/, "")
}

export function buildMedusaAdminJsonHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const token = import.meta.env.VITE_MEDUSA_ADMIN_BEARER_TOKEN
  if (typeof token === "string" && token.trim() !== "") {
    headers["Authorization"] = `Bearer ${token.trim()}`
  }
  return headers
}

export async function readMedusaAdminHttpErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (text.trim() === "") {
    return `Request failed (${response.status} ${response.statusText})`
  }
  try {
    const parsed: unknown = JSON.parse(text)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message
    }
  } catch {
    // use raw text
  }
  return text
}

export async function parseMedusaAdminJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === "") {
    throw new TypeError("Empty response body")
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new TypeError("Response is not valid JSON")
  }
}
