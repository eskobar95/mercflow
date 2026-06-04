import type { JsonLdSettings } from "./json-ld-types"
import { DEFAULT_JSON_LD_SETTINGS } from "./json-ld-types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseJsonLdSettings(value: unknown): JsonLdSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_JSON_LD_SETTINGS }
  }
  return {
    product: value.product === false ? false : true,
    category: value.category === false ? false : true,
    global: value.global === false ? false : true,
  }
}

export function jsonLdSettingsToStorage(settings: JsonLdSettings): Record<string, boolean> {
  return {
    product: settings.product,
    category: settings.category,
    global: settings.global,
  }
}
