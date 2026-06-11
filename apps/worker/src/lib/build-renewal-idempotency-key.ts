export function buildRenewalIdempotencyKey(
  subscriptionId: string,
  nextRenewalAt: string | Date
): string {
  const renewalAt =
    nextRenewalAt instanceof Date ? nextRenewalAt.toISOString() : nextRenewalAt
  return `${subscriptionId}_${renewalAt}`
}

export function buildChargeSubscriptionJobId(
  storeId: string,
  subscriptionId: string,
  nextRenewalAt: string | Date
): string {
  const renewalAt =
    nextRenewalAt instanceof Date ? nextRenewalAt.toISOString() : nextRenewalAt
  return `${storeId}:${subscriptionId}:${renewalAt}`
}
