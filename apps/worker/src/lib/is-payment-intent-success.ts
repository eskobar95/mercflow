const SUCCESS_STATUSES = new Set(["succeeded", "processing", "requires_capture"])

export function isPaymentIntentSuccess(status: string): boolean {
  return SUCCESS_STATUSES.has(status)
}
