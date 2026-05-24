export type ShipmondoCredentialFlagsDto = {
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

export type ShipmondoConnectorGetDto = {
  type: "shipmondo"
  active: boolean
  lastTestedAt: string | null
  credentials: ShipmondoCredentialFlagsDto
  recentLogs: ShipmondoAdminLogDto[]
}

export type ShipmondoTestResultDto = {
  success: boolean
  message?: string
  error?: string
}
