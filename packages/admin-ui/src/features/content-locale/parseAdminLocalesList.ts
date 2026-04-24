import type { AdminLocale } from "./types"

export function parseAdminLocalesList(json: unknown): AdminLocale[] {
  if (typeof json !== "object" || json === null || !("locales" in json)) {
    throw new TypeError("Invalid locales response: missing locales")
  }
  const raw = (json as { locales: unknown }).locales
  if (!Array.isArray(raw)) {
    throw new TypeError("Invalid locales response: locales is not an array")
  }
  const result: AdminLocale[] = []
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      continue
    }
    const code = item["code"]
    const name = item["name"]
    if (typeof code !== "string" || code.trim() === "") {
      continue
    }
    result.push({
      code,
      name: typeof name === "string" && name.trim() !== "" ? name : code,
    })
  }
  return result
}
