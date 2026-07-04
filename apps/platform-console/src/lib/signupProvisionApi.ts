import { resolvePlatformBackendUrl } from "@/lib/platformApi"

export type SignupBillingCheckoutResponse = {
  checkout_url: string
  session_id: string
}

export type SignupProvisionResponse = {
  job_id: string
}

export type ProvisioningStepState = {
  key: string
  label: string
  status: "pending" | "running" | "done" | "error"
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
}

export async function createSignupBillingCheckout(input: {
  invite_token: string
  email: string
  store_name: string
  price_id: string
  clerk_user_id: string
  domain: string
  currency: string
  country: string
  timezone: string
  success_url: string
  cancel_url: string
}): Promise<SignupBillingCheckoutResponse> {
  const backendUrl = resolvePlatformBackendUrl()
  const response = await fetch(`${backendUrl}/platform/signup/billing/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Billing setup failed (${response.status})`)
  }

  return (await response.json()) as SignupBillingCheckoutResponse
}

export async function completeSignupBillingCheckout(input: {
  checkout_session_id: string
}): Promise<SignupProvisionResponse> {
  const backendUrl = resolvePlatformBackendUrl()
  const response = await fetch(`${backendUrl}/platform/signup/billing/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Billing completion failed (${response.status})`)
  }

  return (await response.json()) as SignupProvisionResponse
}

export async function startSignupProvisioning(input: {
  invite_token: string
  clerk_user_id: string
  store_name: string
  domain: string
  email: string
  currency: string
  country: string
  timezone: string
  stripe_payment_intent_id?: string
  stripe_checkout_session_id?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string | null
}): Promise<SignupProvisionResponse> {
  const backendUrl = resolvePlatformBackendUrl()
  const response = await fetch(`${backendUrl}/platform/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Provisioning start failed (${response.status})`)
  }

  return (await response.json()) as SignupProvisionResponse
}

export async function fetchProvisioningStatus(jobId: string): Promise<ProvisioningJobState> {
  const backendUrl = resolvePlatformBackendUrl()
  const response = await fetch(
    `${backendUrl}/platform/provisioning-status/${encodeURIComponent(jobId)}`,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Provisioning status failed (${response.status})`)
  }

  return (await response.json()) as ProvisioningJobState
}
