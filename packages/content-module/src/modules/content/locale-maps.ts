export const DEFAULT_LOCALE = "en"

const isDocNode = (raw: unknown): boolean => {
  return (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    (raw as { type?: string }).type === "doc"
  )
}

export type JsonObject = Record<string, unknown>

export function parseDescriptionRichMap(
  raw: Record<string, unknown> | null | undefined
): JsonObject {
  if (raw == null) {
    return {}
  }
  const o = raw as JsonObject
  if (isDocNode(o)) {
    return { [DEFAULT_LOCALE]: raw }
  }
  return o
}

export function getDescriptionForLocale(
  map: JsonObject,
  locale: string
): unknown {
  const v = map[locale] ?? map[DEFAULT_LOCALE]
  return v ?? null
}

export function setDescriptionForLocale(
  map: JsonObject,
  locale: string,
  value: unknown | undefined
): JsonObject {
  const next: JsonObject = { ...map }
  if (value === undefined) {
    return next
  }
  if (value === null) {
    delete next[locale]
    return next
  }
  next[locale] = value
  return next
}

export function serializeDescriptionRichMap(
  map: JsonObject
): Record<string, unknown> | null {
  const keys = Object.keys(map)
  if (keys.length === 0) {
    return null
  }
  if (keys.length === 1 && keys[0] === DEFAULT_LOCALE) {
    const only = map[DEFAULT_LOCALE]
    if (only === undefined || only === null) {
      return null
    }
    if (typeof only === "object" && !Array.isArray(only)) {
      return only as Record<string, unknown>
    }
    return { [DEFAULT_LOCALE]: only } as Record<string, unknown>
  }
  return map
}

export function parseLocaleStringField(raw: string | null | undefined): Record<string, string> {
  if (raw == null || raw === "") {
    return {}
  }
  const trimmed = raw.trim()
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string])
        )
      }
    } catch {
      // fall through: treat as plain string for default locale
    }
  }
  return { [DEFAULT_LOCALE]: raw }
}

export function getLocaleString(
  map: Record<string, string>,
  locale: string
): string | null {
  const v = map[locale] ?? map[DEFAULT_LOCALE]
  if (v === undefined || v === "") {
    return null
  }
  return v
}

export function setLocaleString(
  map: Record<string, string>,
  locale: string,
  value: string | null | undefined
): Record<string, string> {
  const next: Record<string, string> = { ...map }
  if (value === undefined) {
    return next
  }
  if (value === null || value === "") {
    delete next[locale]
    return next
  }
  next[locale] = value
  return next
}

export function serializeLocaleStringMap(map: Record<string, string>): string | null {
  const keys = Object.keys(map)
  if (keys.length === 0) {
    return null
  }
  if (keys.length === 1 && keys[0] === DEFAULT_LOCALE) {
    return map[DEFAULT_LOCALE] ?? null
  }
  return JSON.stringify(map)
}
