import { CONNECTOR_MODULE } from "../modules/connector"
import type ConnectorModuleService from "../modules/connector/service"
import type { ShipmondoCredentials } from "../modules/connector/shipmondo-credentials"

type ResolveAware = {
  resolve: <T>(key: string) => T
}

/**
 * Returns persisted Shipmondo API credentials from `connector_config` when decryptable — otherwise falls back to
 * `SHIPMONDO_API_USER` / `SHIPMONDO_API_KEY` for deployments that have not migrated off env injection yet.
 */
export async function resolveShipmondoCredentialsWithFallback(
  container: ResolveAware
): Promise<ShipmondoCredentials | null> {
  const service = container.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const fromDb = await service.resolveShipmondoCredentialsOrNull()
  if (fromDb !== null) {
    return fromDb
  }

  const apiUser = process.env.SHIPMONDO_API_USER?.trim()
  const apiKey = process.env.SHIPMONDO_API_KEY?.trim()
  if (
    apiUser !== undefined &&
    apiUser !== "" &&
    apiKey !== undefined &&
    apiKey !== ""
  ) {
    return { api_user: apiUser, api_key: apiKey }
  }

  return null
}
