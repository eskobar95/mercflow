const DEFAULT_BASE_URL = "https://api.useplunk.com"

function normalizeBaseUrl(raw: string | undefined): string {
  const trimmed = typeof raw === "string" ? raw.trim() : ""
  if (trimmed === "") {
    return DEFAULT_BASE_URL
  }
  return trimmed.replace(/\/+$/, "")
}

async function readPlunkErrorMessage(response: Response): Promise<string | null> {
  try {
    const text = await response.text()
    if (text.trim() === "") {
      return null
    }
    const parsed: unknown = JSON.parse(text) as unknown
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error?: unknown }).error === "object" &&
      (parsed as { error: unknown }).error !== null
    ) {
      const errObj = (parsed as { error: { message?: unknown } }).error
      if (typeof errObj.message === "string" && errObj.message.trim() !== "") {
        return errObj.message
      }
      if ("code" in errObj && typeof (errObj as { code?: unknown }).code === "string") {
        return (errObj as { code: string }).code
      }
    }
    return text.slice(0, 500)
  } catch {
    return null
  }
}

export type PlunkPingResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Validates a Plunk secret key using `POST /v1/track`, which avoids sending real email traffic.
 *
 * Override base URL via `PLUNK_API_BASE_URL` for regional stacks (e.g. `https://next-api.useplunk.com`).
 */
export async function pingPlunkWithSecretKey(apiKey: string): Promise<PlunkPingResult> {
  const baseUrl = normalizeBaseUrl(process.env.PLUNK_API_BASE_URL)
  try {
    const response = await fetch(`${baseUrl}/v1/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: "mercflow-connector-health@invalid",
        event: "mercflow_connection_test",
        data: { source: "mercflow-connector-module" },
      }),
    })

    if (response.ok) {
      return { ok: true }
    }

    const detail =
      (await readPlunkErrorMessage(response)) ??
      `Plunk responded with HTTP ${response.status} ${response.statusText}`
    return { ok: false, message: detail }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error calling Plunk"
    return {
      ok: false,
      message: msg.startsWith("fetch") ? "Could not reach the Plunk API endpoint" : msg,
    }
  }
}

export async function sendPlunkTestMail(params: {
  apiKey: string
  to: string
  fromEmail?: string | null
  fromName?: string | null
}): Promise<PlunkPingResult> {
  const baseUrl = normalizeBaseUrl(process.env.PLUNK_API_BASE_URL)
  const bodyPayload: Record<string, string | undefined> = {
    to: params.to,
    subject: "MercFlow — Plunk connection test",
    body: "<p>This is an automated MercFlow connectivity test.</p>",
  }
  const fromTrimmed = typeof params.fromEmail === "string" ? params.fromEmail.trim() : ""
  const nameTrimmed = typeof params.fromName === "string" ? params.fromName.trim() : ""
  if (fromTrimmed !== "") {
    bodyPayload.from = fromTrimmed
  }
  if (nameTrimmed !== "") {
    bodyPayload.name = nameTrimmed
  }

  try {
    const response = await fetch(`${baseUrl}/v1/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    })

    if (response.ok) {
      return { ok: true }
    }

    const detail =
      (await readPlunkErrorMessage(response)) ??
      `Plunk responded with HTTP ${response.status} ${response.statusText}`
    return { ok: false, message: detail }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error calling Plunk"
    return {
      ok: false,
      message: msg.startsWith("fetch") ? "Could not reach the Plunk API endpoint" : msg,
    }
  }
}
