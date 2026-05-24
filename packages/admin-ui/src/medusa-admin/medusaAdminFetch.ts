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
  return formatMedusaAdminHttpErrorMessageFromText(text, response.status, response.statusText)
}

/** Format error text from an already-read body (when JSON parsing the success payload fails). */
export function formatMedusaAdminHttpErrorMessageFromText(
  text: string,
  status: number,
  statusText: string
): string {
  const trimmed = text.trim()
  if (trimmed === "") {
    return `Request failed (${status} ${statusText})`
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message
    }
  } catch {
    // use raw body
  }
  return trimmed
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
