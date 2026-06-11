export const EMAIL_SETTINGS_TABS = [
  { id: "domain", label: "Domain" },
  { id: "branding", label: "Branding" },
  { id: "delivery-history", label: "Delivery history" },
] as const

export type EmailSettingsTabId = (typeof EMAIL_SETTINGS_TABS)[number]["id"]

export const DEFAULT_EMAIL_SETTINGS_TAB: EmailSettingsTabId = "domain"

export function parseEmailSettingsTab(value: string | null): EmailSettingsTabId {
  if (value === "branding" || value === "delivery-history" || value === "domain") {
    return value
  }
  return DEFAULT_EMAIL_SETTINGS_TAB
}
