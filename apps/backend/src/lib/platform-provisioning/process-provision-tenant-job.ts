import path from "node:path"

import {
  createClerkOrgForTenant,
  ensureClerkOrgAdminMembership,
  ensureClerkOrgStoreIdClaim,
} from "../clerk-store-admin/clerk-org-provisioning"
import { redeemPlatformInvite } from "../platform-db/redeem-platform-invite"
import { confirmStripeSubscriptionForTenant } from "../platform-billing/confirm-stripe-subscription"
import { getStripePlatformClient } from "../platform-billing/stripe-platform-client"
import {
  completeProvisioningJob,
  failProvisioningJob,
  setProvisioningStoreId,
  updateProvisioningArtifacts,
  updateProvisioningJobStatus,
  updateProvisioningStep,
} from "./job-state"
import { sendPlatformWelcomeEmail } from "./send-platform-welcome-email"
import type { ProvisionTenantJobPayload, ProvisioningStepKey } from "./constants"
import { loadProvisionTenantRuntimeEnv } from "./load-provision-tenant-env"
import { createStoreViaMedusaExec } from "./tenant-scripts/create-store"
import * as medusaAdmin from "./tenant-scripts/medusa-admin-client"
import { resolvePlatformAdminUrl } from "./tenant-scripts/platform-url"
import { writeTenantTraefikRoute } from "./tenant-scripts/traefik-routes"
import { writeProvisionAuditLog } from "./write-provision-audit-log"

type MedusaAdminClient = {
  backendUrl: string
  adminApiToken: string
}

function getRepoRoot(): string {
  return path.resolve(process.cwd(), "../..")
}

async function loadProvisionEnv(repoRoot: string): Promise<ReturnType<typeof loadProvisionTenantRuntimeEnv>> {
  return loadProvisionTenantRuntimeEnv(repoRoot)
}

async function runStep(
  jobId: string,
  stepKey: ProvisioningStepKey,
  message: string,
  action: () => Promise<void>,
): Promise<void> {
  await updateProvisioningStep(jobId, stepKey, {
    status: "running",
    message,
  })

  try {
    await action()
    await updateProvisioningStep(jobId, stepKey, {
      status: "done",
      message,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Provisioning step failed"
    await updateProvisioningStep(jobId, stepKey, {
      status: "error",
      message: errorMessage,
    })
    throw error
  }
}

export async function processProvisionTenantJob(
  payload: ProvisionTenantJobPayload,
): Promise<void> {
  const jobId = payload.jobId
  await updateProvisioningJobStatus(jobId, "running")

  const repoRoot = getRepoRoot()
  const env = await loadProvisionEnv(repoRoot)
  const adminClient: MedusaAdminClient = {
    backendUrl: env.backendUrl,
    adminApiToken: env.adminApiToken,
  }

  let storeId: string | null = null
  let salesChannelId: string | null = null
  let publishableApiKeyToken: string | null = null
  let clerkOrgId: string | null = null
  const tenantUrl = `https://${payload.domain}`
  let adminUrl = env.backendUrl.replace(/\/$/, "")

  try {
    await runStep(jobId, "medusa_store", "Creating Medusa store", async () => {
      if (env.databaseUrl === null) {
        throw new Error("DATABASE_URL is required for tenant provisioning")
      }

      const { storeId: createdStoreId } = createStoreViaMedusaExec(repoRoot, {
        name: payload.storeName,
        currency: payload.currency,
        databaseUrl: env.databaseUrl,
      })

      storeId = createdStoreId
      await setProvisioningStoreId(jobId, createdStoreId)
      await writeProvisionAuditLog({
        action: "provision_step_medusa_store",
        entity_id: createdStoreId,
        metadata: { job_id: jobId, store_name: payload.storeName },
      })
    })

    if (!storeId) {
      throw new Error("Medusa store was not created")
    }

    await runStep(jobId, "sales_channel", "Creating sales channel", async () => {
      const salesChannel = await medusaAdmin.createSalesChannel(
        adminClient,
        `${payload.storeName} Channel`,
      )
      salesChannelId = salesChannel.id
      await medusaAdmin.updateStoreDefaultSalesChannel(
        adminClient,
        storeId as string,
        salesChannelId,
      )
      await updateProvisioningArtifacts(jobId, { sales_channel_id: salesChannelId })
      await writeProvisionAuditLog({
        action: "provision_step_sales_channel",
        entity_id: storeId as string,
        metadata: { job_id: jobId, sales_channel_id: salesChannelId },
      })
    })

    await runStep(jobId, "api_key", "Creating publishable API key", async () => {
      const apiKey = await medusaAdmin.createPublishableApiKey(
        adminClient,
        `${payload.storeName} Storefront`,
      )
      publishableApiKeyToken = apiKey.token
      await medusaAdmin.linkPublishableKeyToSalesChannel(
        adminClient,
        apiKey.id,
        salesChannelId as string,
      )
      await updateProvisioningArtifacts(jobId, {
        publishable_api_key: publishableApiKeyToken,
      })
      await writeProvisionAuditLog({
        action: "provision_step_api_key",
        entity_id: storeId as string,
        metadata: { job_id: jobId },
      })
    })

    await runStep(jobId, "clerk_org", "Creating Clerk organization", async () => {
      const org = await createClerkOrgForTenant({
        storeId: storeId as string,
        storeName: payload.storeName,
        clerkUserId: payload.clerkUserId,
      })
      clerkOrgId = org.organization_id
      await updateProvisioningArtifacts(jobId, { clerk_org_id: clerkOrgId })
      await writeProvisionAuditLog({
        action: "provision_step_clerk_org",
        entity_id: storeId as string,
        metadata: { job_id: jobId, clerk_org_id: clerkOrgId },
      })
    })

    await runStep(jobId, "clerk_membership", "Adding Clerk admin membership", async () => {
      await ensureClerkOrgAdminMembership({
        organizationId: clerkOrgId as string,
        clerkUserId: payload.clerkUserId,
      })
      await writeProvisionAuditLog({
        action: "provision_step_clerk_membership",
        entity_id: storeId as string,
        metadata: { job_id: jobId, clerk_user_id: payload.clerkUserId },
      })
    })

    await runStep(jobId, "jwt_claim", "Setting Clerk org store_id claim", async () => {
      await ensureClerkOrgStoreIdClaim({
        organizationId: clerkOrgId as string,
        storeId: storeId as string,
      })
      await writeProvisionAuditLog({
        action: "provision_step_jwt_claim",
        entity_id: storeId as string,
        metadata: { job_id: jobId },
      })
    })

    await runStep(jobId, "domain_routing", "Writing Traefik tenant route", async () => {
      writeTenantTraefikRoute(env.traefikDynamicDir, payload.domain, env.backendUrl)
      await writeProvisionAuditLog({
        action: "provision_step_domain_routing",
        entity_id: storeId as string,
        metadata: { job_id: jobId, domain: payload.domain },
      })
    })

    await runStep(jobId, "stripe_subscription", "Confirming Stripe subscription", async () => {
      if (!payload.stripeSubscriptionId) {
        const stripe = getStripePlatformClient()
        await stripe.paymentIntents.retrieve(payload.stripePaymentIntentId)
        throw new Error("Stripe subscription id is required to confirm billing linkage")
      }

      await confirmStripeSubscriptionForTenant({
        storeId: storeId as string,
        clerkOrgId: clerkOrgId as string,
        stripeCustomerId: payload.stripeCustomerId,
        stripeSubscriptionId: payload.stripeSubscriptionId,
        stripePaymentIntentId: payload.stripePaymentIntentId,
        billingCurrency: payload.currency,
      })

      await writeProvisionAuditLog({
        action: "provision_step_stripe_subscription",
        entity_id: storeId as string,
        metadata: {
          job_id: jobId,
          stripe_customer_id: payload.stripeCustomerId,
          stripe_subscription_id: payload.stripeSubscriptionId,
        },
      })
    })

    await redeemPlatformInvite({
      rawToken: payload.inviteToken,
      tenantId: storeId as string,
    })

    adminUrl = resolvePlatformAdminUrl({
      backendUrl: env.backendUrl,
      storeAdminUrl: env.storeAdminUrl,
    })

    await runStep(jobId, "welcome_email", "Sending welcome email", async () => {
      await sendPlatformWelcomeEmail({
        email: payload.email,
        storeName: payload.storeName,
        tenantUrl,
        adminUrl,
      })
      await writeProvisionAuditLog({
        action: "tenant.provisioned",
        entity_id: storeId as string,
        metadata: { job_id: jobId, email: payload.email },
      })
    })

    await completeProvisioningJob(jobId, {
      store_id: storeId as string,
      tenant_url: tenantUrl,
      admin_url: adminUrl,
      artifacts: {
        sales_channel_id: salesChannelId,
        publishable_api_key: publishableApiKeyToken,
        clerk_org_id: clerkOrgId,
      },
    })

    await writeProvisionAuditLog({
      action: "provision_tenant_complete",
      entity_id: storeId as string,
      metadata: {
        job_id: jobId,
        domain: payload.domain,
        email: payload.email,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tenant provisioning failed"
    await failProvisioningJob(jobId, message)
    if (storeId) {
      await writeProvisionAuditLog({
        action: "provision_tenant_failed",
        entity_id: storeId,
        metadata: { job_id: jobId, error: message },
      })
    }
    throw error
  }
}
