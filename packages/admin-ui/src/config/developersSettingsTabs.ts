export const DEVELOPERS_SETTINGS_TABS = [
  { id: "api-keys", label: "API Keys" },
  { id: "webhooks", label: "Webhooks" },
] as const

export type DevelopersSettingsTabId = (typeof DEVELOPERS_SETTINGS_TABS)[number]["id"]

export const DEFAULT_DEVELOPERS_SETTINGS_TAB: DevelopersSettingsTabId = "api-keys"

export function parseDevelopersSettingsTab(value: string | null): DevelopersSettingsTabId {
  if (value === "api-keys" || value === "webhooks") {
    return value
  }
  return DEFAULT_DEVELOPERS_SETTINGS_TAB
}
