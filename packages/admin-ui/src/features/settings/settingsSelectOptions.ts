import type { SelectOption } from "@/components/ui/Select"

export const SETTINGS_COUNTRY_OPTIONS: SelectOption[] = [
  { value: "dk", label: "Denmark" },
  { value: "se", label: "Sweden" },
  { value: "no", label: "Norway" },
  { value: "fi", label: "Finland" },
  { value: "de", label: "Germany" },
  { value: "nl", label: "Netherlands" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
]

export const SETTINGS_TIMEZONE_OPTIONS: SelectOption[] = [
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm" },
  { value: "Europe/Oslo", label: "Europe/Oslo" },
  { value: "Europe/Helsinki", label: "Europe/Helsinki" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
]

const COUNTRY_LABEL_BY_CODE = new Map(
  SETTINGS_COUNTRY_OPTIONS.map((option) => [option.value, option.label]),
)

export function formatSettingsCountryLabel(countryCode: string | null | undefined): string {
  if (typeof countryCode !== "string" || countryCode.trim() === "") {
    return "—"
  }
  const normalized = countryCode.trim().toLowerCase()
  return COUNTRY_LABEL_BY_CODE.get(normalized) ?? normalized.toUpperCase()
}
