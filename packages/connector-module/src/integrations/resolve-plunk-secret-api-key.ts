import { CONNECTOR_MODULE } from "../modules/connector"
import type ConnectorModuleService from "../modules/connector/service"

type ResolveAware = {
  resolve: <T>(key: string) => T
}

/**
 * Returns the configured Plunk secret API key (`sk_*`) from `connector_config` when present — otherwise falls back to
 * `PLUNK_SECRET_KEY` for backwards compatibility with deployments that have not migrated yet.
 */
export async function resolvePlunkSecretApiKeyWithFallback(
  container: ResolveAware
): Promise<string | null> {
  const service = container.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const configured = await service.resolvePlunkApiKey()
  if (configured !== null && configured.trim() !== "") {
    return configured.trim()
  }
  const fallback = process.env.PLUNK_SECRET_KEY?.trim()
  return fallback !== undefined && fallback !== "" ? fallback : null
}
