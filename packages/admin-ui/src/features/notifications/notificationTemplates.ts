export const MERCHANT_NOTIFICATION_TEMPLATES = [
  {
    key: "order-confirmation",
    label: "Order confirmation",
    description: "Sent when a customer completes checkout.",
  },
  {
    key: "shipping-update",
    label: "Shipping update",
    description: "Sent when an order is fulfilled with tracking details.",
  },
  {
    key: "order-cancellation",
    label: "Cancellation",
    description: "Sent when an order is cancelled.",
  },
] as const

export type MerchantNotificationTemplateKey =
  (typeof MERCHANT_NOTIFICATION_TEMPLATES)[number]["key"]

const STORAGE_PREFIX = "mercflow:disabled-notification-templates:"

export function disabledTemplatesStorageKey(storeId: string): string {
  return `${STORAGE_PREFIX}${storeId}`
}

export function isMerchantNotificationTemplateKey(
  value: string,
): value is MerchantNotificationTemplateKey {
  return MERCHANT_NOTIFICATION_TEMPLATES.some((template) => template.key === value)
}

export function parseDisabledTemplates(raw: unknown): MerchantNotificationTemplateKey[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter(
    (item): item is MerchantNotificationTemplateKey =>
      typeof item === "string" && isMerchantNotificationTemplateKey(item),
  )
}

export function readStoredDisabledTemplates(storeId: string): MerchantNotificationTemplateKey[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(disabledTemplatesStorageKey(storeId))
    return raw === null ? [] : parseDisabledTemplates(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

export function writeStoredDisabledTemplates(
  storeId: string,
  disabledTemplates: readonly MerchantNotificationTemplateKey[],
): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(
    disabledTemplatesStorageKey(storeId),
    JSON.stringify(disabledTemplates),
  )
}

export function isTemplateEnabled(
  templateKey: MerchantNotificationTemplateKey,
  disabledTemplates: readonly MerchantNotificationTemplateKey[],
): boolean {
  return !disabledTemplates.includes(templateKey)
}

export function toggleTemplateEnabled(
  templateKey: MerchantNotificationTemplateKey,
  disabledTemplates: readonly MerchantNotificationTemplateKey[],
  enabled: boolean,
): MerchantNotificationTemplateKey[] {
  if (enabled) {
    return disabledTemplates.filter((key) => key !== templateKey)
  }
  return disabledTemplates.includes(templateKey)
    ? [...disabledTemplates]
    : [...disabledTemplates, templateKey]
}

export function notificationTemplatePreviewTitle(
  templateKey: MerchantNotificationTemplateKey,
): string {
  const match = MERCHANT_NOTIFICATION_TEMPLATES.find((template) => template.key === templateKey)
  return match ? `${match.label} preview` : "Email preview"
}
