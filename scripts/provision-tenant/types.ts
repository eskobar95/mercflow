export type ProvisionTenantArgs = {
  readonly name: string
  readonly domain: string
  readonly email: string
  readonly currency: string
}

export type ProvisionTenantEnv = {
  readonly backendUrl: string
  readonly adminApiToken: string
  readonly traefikDynamicDir: string
  readonly databaseUrl: string | null
}

export type ProvisionTenantMedusaResult = {
  readonly storeId: string
  readonly salesChannelId: string
  readonly publishableApiKeyId: string
  readonly publishableApiKeyToken: string
  readonly adminUserId: string
  readonly adminPassword: string
}

export type ProvisionTenantOutput = ProvisionTenantMedusaResult & {
  readonly adminUrl: string
  readonly healthUrl: string
  readonly traefikRouteFile: string
}
