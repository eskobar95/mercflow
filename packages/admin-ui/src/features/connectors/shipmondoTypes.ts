type ShipmondoCredentialFlagsDto = {
  apiUserConfigured: boolean
  apiKeyConfigured: boolean
  shippingModuleKeyConfigured: boolean
}

export type ShipmondoAdminLogDto = {
  id: string
  createdAt: string
  message: string
  success: boolean
}

export type ShipmondoShippingRulesDto = {
  markupAmountMinor: number
  freeShippingThresholdMinor: number
  enabledCarrierCodes: string[]
}

export type ShipmondoCarrierProductDto = {
  productCode: string
  carrierCode: string | null
  name: string
  basePriceMinor: number
}

export type ShipmondoConnectorGetDto = {
  type: "shipmondo"
  active: boolean
  lastTestedAt: string | null
  credentials: ShipmondoCredentialFlagsDto
  recentLogs: ShipmondoAdminLogDto[]
  shippingRules: ShipmondoShippingRulesDto
}

export type ShipmondoTestResultDto = {
  success: boolean
  message?: string
  error?: string
}
