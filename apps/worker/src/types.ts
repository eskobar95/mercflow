export const SUBSCRIPTION_RENEWAL_QUEUE_NAME = "mercflow:subscriptions"
export const SUBSCRIPTION_RENEWAL_DLQ_NAME = "mercflow:subscriptions:dead"
export const PROCESS_DUE_RENEWALS_JOB = "process-due-renewals"
export const CHARGE_SUBSCRIPTION_JOB = "charge-subscription"
export const HANDLE_RENEWAL_FAILURE_JOB = "handle-renewal-failure"
export const SUBSCRIPTION_RENEWED_EVENT = "subscription.renewed"
export const SUBSCRIPTION_RENEWAL_FAILED_EVENT = "subscription.renewal_failed"
export const SUBSCRIPTION_RENEWAL_CRON_JOB_ID = "subscription-renewal-hourly-cron"
export const PROVISION_TENANT_QUEUE_NAME = "mercflow:provision-tenant"
export const PROVISION_TENANT_DLQ_NAME = "mercflow:provision-tenant:dead"
export const PROVISION_TENANT_JOB = "provision-tenant"
export const SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 60_000 },
}
export type ChargeSubscriptionJobPayload = { storeId: string; subscriptionId: string; nextRenewalAt: string }
export type HandleRenewalFailureJobPayload = {
  storeId: string; subscriptionId: string; orderId: string; amount: number; currency: string
  stripePaymentIntentId?: string | null; errorMessage: string
}
export type SubscriptionDomainEventPayload = {
  storeId: string; subscriptionId: string; orderId?: string; amount?: number; currency?: string
  stripePaymentIntentId?: string | null; errorMessage?: string | null
}