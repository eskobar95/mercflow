import { z } from "zod"

export const stripePlainCredentialsSchema = z.object({
  secret_key: z.string(),
  publishable_key: z.string(),
  webhook_secret: z.string(),
})

export type StripePlainCredentials = z.infer<typeof stripePlainCredentialsSchema>

/** Last four safe preview for UI (best-effort; never decrypt for GET). */
export function lastFour(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") {
    return null
  }
  const t = value.trim()
  const tail = t.slice(-4)
  return tail.length === 4 ? tail : tail
}

export function parseStripePlainCredentialsJson(jsonText: string): StripePlainCredentials {
  const parsed: unknown = JSON.parse(jsonText)
  return stripePlainCredentialsSchema.parse(parsed)
}

export function mergeStripePlainCredentials(
  current: StripePlainCredentials,
  patch: Partial<Omit<StripePlainCredentials, never>>
): StripePlainCredentials {
  return {
    secret_key:
      patch.secret_key !== undefined && patch.secret_key !== "" ? patch.secret_key : current.secret_key,
    publishable_key:
      patch.publishable_key !== undefined && patch.publishable_key !== ""
        ? patch.publishable_key
        : current.publishable_key,
    webhook_secret:
      patch.webhook_secret !== undefined && patch.webhook_secret !== ""
        ? patch.webhook_secret
        : current.webhook_secret,
  }
}
