import type { StoreAddress, StoreGeneralMetadata } from "./storeMetadata"

export type AdminStoreCurrencyDto = {
  currencyCode: string
  isDefault: boolean
}

export type AdminStoreDto = {
  id: string
  name: string
  supportedCurrencies: AdminStoreCurrencyDto[]
  metadata: Record<string, unknown> | null
}

export type AdminCurrencyDto = {
  code: string
  name: string
}

export type GeneralSettingsFormValues = {
  storeName: string
  contactEmail: string
  defaultCurrency: string
  timezone: string
  address: StoreAddress
}

export type UpdateStoreInput = {
  name: string
  supportedCurrencies: Array<{ currency_code: string; is_default?: boolean }>
  metadata: Record<string, unknown>
}

export type TaxRegionRow = {
  id: string
  countryCode: string
  rateId: string | null
  name: string
  ratePercent: number | null
}

export type CreateTaxRegionInput = {
  countryCode: string
  name: string
  ratePercent: number
}

export type UpdateTaxRegionInput = {
  rateId: string
  name: string
  ratePercent: number
}

export type StoreGeneralSnapshot = {
  store: AdminStoreDto
  general: StoreGeneralMetadata
  form: GeneralSettingsFormValues
}
