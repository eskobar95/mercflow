import path from "path"

import type {
  ProvisionCompletePayload,
  ProvisionProgressEvent,
} from "./types"
import type { ProvisionTenantBody } from "./validators"

function getRepoRoot(): string {
  return path.resolve(process.cwd(), "../..")
}

export type ProvisionProgressHandler = (event: ProvisionProgressEvent) => void

function emit(
  onProgress: ProvisionProgressHandler | undefined,
  step: string,
  message: string,
  status: ProvisionProgressEvent["status"],
): void {
  onProgress?.({ step, message, status })
}

type ProvisionProgressStep =
  | "store"
  | "sales_channel"
  | "api_key"
  | "admin_user"
  | "routing"

type ProvisionTenantOutput = {
  storeId: string
  salesChannelId: string
  publishableApiKeyToken: string
  adminUserId: string
  adminUrl: string
  tenantUrl: string
}

type ProvisionTenantEnv = {
  backendUrl: string
  adminApiToken: string
  traefikDynamicDir: string
  databaseUrl: string | null
}

type ProvisionTenantArgs = {
  name: string
  domain: string
  email: string
  currency: string
}

type ProvisionModule = {
  loadProvisionTenantEnv: (repoRoot: string) => ProvisionTenantEnv
  provisionTenant: (
    repoRoot: string,
    args: ProvisionTenantArgs,
    env: ProvisionTenantEnv,
    onProgress?: (step: ProvisionProgressStep, message: string) => void,
  ) => Promise<ProvisionTenantOutput>
}

function isProvisionCliError(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "ProvisionTenantCliError" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  )
}

async function loadProvisionModule(): Promise<ProvisionModule> {
  const repoRoot = getRepoRoot()
  const [envModule, provisionModule] = await Promise.all([
    import(path.join(repoRoot, "scripts/provision-tenant/env.js")),
    import(path.join(repoRoot, "scripts/provision-tenant/provision.js")),
  ])

  return {
    loadProvisionTenantEnv: envModule.loadProvisionTenantEnv as ProvisionModule["loadProvisionTenantEnv"],
    provisionTenant: provisionModule.provisionTenant as ProvisionModule["provisionTenant"],
  }
}

export async function provisionPlatformTenant(
  body: ProvisionTenantBody,
  onProgress?: ProvisionProgressHandler,
): Promise<ProvisionCompletePayload> {
  const args: ProvisionTenantArgs = {
    name: body.name,
    domain: body.domain,
    email: body.email,
    currency: body.currency,
  }

  emit(onProgress, "validate", "Validating provisioning input", "done")

  const repoRoot = getRepoRoot()
  const { loadProvisionTenantEnv, provisionTenant } = await loadProvisionModule()

  let env: ProvisionTenantEnv
  try {
    env = loadProvisionTenantEnv(repoRoot)
  } catch (error) {
    const message = isProvisionCliError(error)
      ? error.message
      : "Failed to load provisioning environment"
    emit(onProgress, "env", message, "error")
    throw error
  }

  emit(onProgress, "store", "Creating Medusa store", "running")
  emit(onProgress, "sales_channel", "Creating sales channel", "pending")
  emit(onProgress, "api_key", "Creating publishable API key", "pending")
  emit(onProgress, "admin_user", "Creating tenant admin user", "pending")
  emit(onProgress, "routing", "Writing Traefik tenant route", "pending")

  try {
    const output = await provisionTenant(repoRoot, args, env, (step, message) => {
      if (step === "store") {
        emit(onProgress, "store", message, "done")
        emit(onProgress, "sales_channel", "Creating sales channel", "running")
        return
      }
      if (step === "sales_channel") {
        emit(onProgress, "sales_channel", message, "done")
        emit(onProgress, "api_key", "Creating publishable API key", "running")
        return
      }
      if (step === "api_key") {
        emit(onProgress, "api_key", message, "done")
        emit(onProgress, "admin_user", "Creating tenant admin user", "running")
        return
      }
      if (step === "admin_user") {
        emit(onProgress, "admin_user", message, "done")
        emit(onProgress, "routing", "Writing Traefik tenant route", "running")
        return
      }
      if (step === "routing") {
        emit(onProgress, "routing", message, "done")
      }
    })

    emit(onProgress, "complete", "Tenant provisioned successfully", "done")

    return {
      store_id: output.storeId,
      sales_channel_id: output.salesChannelId,
      publishable_api_key: output.publishableApiKeyToken,
      admin_user_id: output.adminUserId,
      admin_email: body.email,
      admin_url: output.adminUrl,
      tenant_url: output.tenantUrl,
    }
  } catch (error) {
    const message = isProvisionCliError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Provisioning failed"
    emit(onProgress, "error", message, "error")
    throw error
  }
}
