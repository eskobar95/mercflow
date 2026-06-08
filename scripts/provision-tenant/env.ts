import path from "path"

import type { ProvisionTenantEnv } from "./types"
import { ProvisionTenantCliError } from "./parse-args"

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    throw new ProvisionTenantCliError(`Missing required environment variable: ${name}`)
  }
  return value
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    return null
  }
  return value
}

export function loadProvisionTenantEnv(repoRoot: string): ProvisionTenantEnv {
  const backendUrl = readRequiredEnv("MEDUSA_BACKEND_URL").replace(/\/$/, "")
  const adminApiToken =
    readOptionalEnv("MEDUSA_ADMIN_API_TOKEN") ??
    readOptionalEnv("MEDUSA_ADMIN_API_KEY") ??
    (() => {
      throw new ProvisionTenantCliError(
        "Missing required environment variable: MEDUSA_ADMIN_API_TOKEN (or MEDUSA_ADMIN_API_KEY)",
      )
    })()
  const traefikDynamicDir =
    readOptionalEnv("TRAEFIK_DYNAMIC_DIR") ??
    path.join(repoRoot, "infra", "traefik", "dynamic", "tenants")

  const databaseUrl =
    readOptionalEnv("DATABASE_URL") ?? readOptionalEnv("NEON_DATABASE_URL")

  return {
    backendUrl,
    adminApiToken,
    traefikDynamicDir,
    databaseUrl,
  }
}
