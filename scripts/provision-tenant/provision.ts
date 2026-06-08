import path from "path"

import { createStoreViaMedusaExec } from "./create-store"
import { ProvisionTenantCliError } from "./parse-args"
import {
  acceptAdminInvite,
  createAdminInvite,
  createPublishableApiKey,
  createSalesChannel,
  linkPublishableKeyToSalesChannel,
  MedusaAdminRequestError,
  registerAdminAuthIdentity,
  updateStoreDefaultSalesChannel,
} from "./medusa-admin-client"
import { generateTenantAdminPassword } from "./password"
import { resolvePlatformAdminUrl } from "./platform-url"
import { writeTenantTraefikRoute } from "./traefik-routes"
import type {
  ProvisionTenantArgs,
  ProvisionTenantEnv,
  ProvisionTenantOutput,
} from "./types"

function splitTenantName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0)
  if (parts.length === 0) {
    return { firstName: "Tenant", lastName: "Admin" }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Admin" }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

export async function provisionTenant(
  repoRoot: string,
  args: ProvisionTenantArgs,
  env: ProvisionTenantEnv,
): Promise<ProvisionTenantOutput> {
  if (env.databaseUrl === null) {
    throw new ProvisionTenantCliError(
      "DATABASE_URL (or NEON_DATABASE_URL) is required to create a Medusa store",
    )
  }

  const adminClient = {
    backendUrl: env.backendUrl,
    adminApiToken: env.adminApiToken,
  }

  const { storeId } = createStoreViaMedusaExec(repoRoot, {
    name: args.name,
    currency: args.currency,
    databaseUrl: env.databaseUrl,
  })

  const salesChannelName = `${args.name} Channel`
  let salesChannelId: string
  let publishableApiKeyId: string
  let publishableApiKeyToken: string
  let adminUserId: string
  const adminPassword = generateTenantAdminPassword()

  try {
    const salesChannel = await createSalesChannel(adminClient, salesChannelName)
    salesChannelId = salesChannel.id

    await updateStoreDefaultSalesChannel(adminClient, storeId, salesChannelId)

    const apiKey = await createPublishableApiKey(
      adminClient,
      `${args.name} Storefront`,
    )
    publishableApiKeyId = apiKey.id
    publishableApiKeyToken = apiKey.token

    await linkPublishableKeyToSalesChannel(
      adminClient,
      publishableApiKeyId,
      salesChannelId,
    )

    const invite = await createAdminInvite(adminClient, args.email)
    const userJwt = await registerAdminAuthIdentity(
      env.backendUrl,
      args.email,
      adminPassword,
    )
    const { firstName, lastName } = splitTenantName(args.name)
    const accepted = await acceptAdminInvite(env.backendUrl, {
      email: args.email,
      firstName,
      lastName,
      inviteToken: invite.token,
      userJwt,
    })
    adminUserId = accepted.userId
  } catch (error) {
    const message =
      error instanceof MedusaAdminRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown provisioning error"
    throw new ProvisionTenantCliError(
      `Provisioning failed after store ${storeId} was created. Manual cleanup may be required. ${message}`,
    )
  }

  const traefikRouteFile = writeTenantTraefikRoute(
    env.traefikDynamicDir,
    args.domain,
    env.backendUrl,
  )

  return {
    storeId,
    salesChannelId,
    publishableApiKeyId,
    publishableApiKeyToken,
    adminUserId,
    adminPassword,
    adminUrl: resolvePlatformAdminUrl(env.backendUrl),
    tenantUrl: `https://${args.domain}`,
    healthUrl: `https://${args.domain}/health`,
    traefikRouteFile: path.relative(repoRoot, traefikRouteFile),
  }
}

export function formatProvisionTenantOutput(
  output: ProvisionTenantOutput,
  email: string,
): string {
  return [
    "Tenant provisioned successfully.",
    "",
    `Store ID:              ${output.storeId}`,
    `Sales channel ID:      ${output.salesChannelId}`,
    `Publishable API key:   ${output.publishableApiKeyToken}`,
    `Admin user ID:         ${output.adminUserId}`,
    `Admin email:           ${email}`,
    `Admin password:        ${output.adminPassword}`,
    `Admin URL:             ${output.adminUrl}`,
    `Tenant URL:            ${output.tenantUrl}`,
    `Health URL:            ${output.healthUrl}`,
    `Traefik route file:    ${output.traefikRouteFile}`,
    "",
    "Next steps:",
    "1. Point DNS A record for the tenant domain to the Hetzner VPS IP.",
    "2. Sync infra/traefik/dynamic/tenants to the server (git pull or rsync).",
    "3. Verify GET /health on the tenant URL after DNS + ACME propagate.",
    "4. Tenant admin logs in at the Admin URL above (not on the tenant domain).",
    "5. Copy credentials to the customer securely — password is not stored anywhere else.",
  ].join("\n")
}
