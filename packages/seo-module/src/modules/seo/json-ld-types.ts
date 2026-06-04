export type JsonLdPageType = "product" | "category" | "global"

export type JsonLdSettings = {
  product: boolean
  category: boolean
  global: boolean
}

export const DEFAULT_JSON_LD_SETTINGS: JsonLdSettings = {
  product: true,
  category: true,
  global: true,
}

export type JsonLdScriptPayload = {
  "@context": "https://schema.org"
  "@graph": Record<string, unknown>[]
}
