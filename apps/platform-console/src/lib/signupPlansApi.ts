import { resolvePlatformBackendUrl } from "@/lib/platformApi"
import type { PlatformPlansResponse } from "@/types/platformPlan"

export async function fetchPlatformBillingPlans(
  currency: string,
): Promise<PlatformPlansResponse> {
  const backendUrl = resolvePlatformBackendUrl()
  const normalizedCurrency = currency.trim().toLowerCase()
  const response = await fetch(
    `${backendUrl}/platform/billing/plans?currency=${encodeURIComponent(normalizedCurrency)}`,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Failed to load plans (${response.status})`)
  }

  return (await response.json()) as PlatformPlansResponse
}
