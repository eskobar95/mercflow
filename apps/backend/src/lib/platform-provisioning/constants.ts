export const PROVISION_TENANT_QUEUE_NAME = "mercflow:provision-tenant"
export const PROVISION_TENANT_DLQ_NAME = "mercflow:provision-tenant:dead"
export const PROVISION_TENANT_JOB = "provision-tenant"

export const PROVISION_TENANT_JOB_RETRY_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 30_000 },
}

export const PROVISIONING_JOB_STATE_PREFIX = "mercflow:provisioning-job:"
export const PROVISIONING_JOB_STATE_TTL_SECONDS = 86_400

export const PROVISIONING_STEPS = [
  { key: "medusa_store", label: "Medusa store" },
  { key: "sales_channel", label: "Sales channel" },
  { key: "api_key", label: "Publishable API key" },
  { key: "clerk_org", label: "Clerk organization" },
  { key: "clerk_membership", label: "Clerk admin membership" },
  { key: "jwt_claim", label: "JWT org claim" },
  { key: "domain_routing", label: "Domain routing" },
  { key: "stripe_subscription", label: "Stripe subscription" },
  { key: "welcome_email", label: "Welcome email" },
] as const

export type ProvisioningStepKey = (typeof PROVISIONING_STEPS)[number]["key"]

export type ProvisioningStepStatus = "pending" | "running" | "done" | "error"

export type ProvisioningStepState = {
  key: ProvisioningStepKey
  label: string
  status: ProvisioningStepStatus
  message: string | null
}

export type ProvisioningJobState = {
  job_id: string
  status: "queued" | "running" | "completed" | "failed"
  steps: ProvisioningStepState[]
  store_id: string | null
  tenant_url: string | null
  admin_url: string | null
  error: string | null
  updated_at: string
  artifacts: {
    sales_channel_id: string | null
    publishable_api_key: string | null
    clerk_org_id: string | null
  }
}

export type ProvisionTenantJobPayload = {
  jobId: string
  inviteToken: string
  clerkUserId: string
  storeName: string
  domain: string
  email: string
  currency: string
  country: string
  timezone: string
  stripeCustomerId: string
  stripePaymentIntentId: string
  stripeSubscriptionId: string | null
}

export function createInitialProvisioningJobState(jobId: string): ProvisioningJobState {
  return {
    job_id: jobId,
    status: "queued",
    steps: PROVISIONING_STEPS.map((step) => ({
      key: step.key,
      label: step.label,
      status: "pending",
      message: null,
    })),
    store_id: null,
    tenant_url: null,
    admin_url: null,
    error: null,
    updated_at: new Date().toISOString(),
    artifacts: {
      sales_channel_id: null,
      publishable_api_key: null,
      clerk_org_id: null,
    },
  }
}
