export type SignupSelectOption = {
  value: string
  label: string
}

export const SIGNUP_CURRENCY_OPTIONS: SignupSelectOption[] = [
  { value: "dkk", label: "DKK — Danish Krone" },
  { value: "eur", label: "EUR — Euro" },
  { value: "usd", label: "USD — US Dollar" },
  { value: "gbp", label: "GBP — British Pound" },
  { value: "sek", label: "SEK — Swedish Krona" },
  { value: "nok", label: "NOK — Norwegian Krone" },
]

export const SIGNUP_COUNTRY_OPTIONS: SignupSelectOption[] = [
  { value: "dk", label: "Denmark" },
  { value: "se", label: "Sweden" },
  { value: "no", label: "Norway" },
  { value: "de", label: "Germany" },
  { value: "nl", label: "Netherlands" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
]

export const SIGNUP_TIMEZONE_OPTIONS: SignupSelectOption[] = [
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm" },
  { value: "Europe/Oslo", label: "Europe/Oslo" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
]

export const MERCFLOW_SUBDOMAIN_SUFFIX = "mercflow.shop"

export type SignupDomainType = "subdomain" | "custom"

export type SignupStoreDetails = {
  storeName: string
  currency: string
  country: string
  timezone: string
}

export type SignupDomainDetails = {
  domainType: SignupDomainType
  subdomain: string
  customDomain: string
}

export function validateSignupStoreDetails(
  details: SignupStoreDetails,
): string | null {
  if (details.storeName.trim().length === 0) {
    return "Store name is required"
  }

  if (details.currency.trim().length !== 3) {
    return "Currency is required"
  }

  if (details.country.trim().length === 0) {
    return "Country is required"
  }

  if (details.timezone.trim().length === 0) {
    return "Timezone is required"
  }

  return null
}

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const CUSTOM_DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

export function resolveSignupDomain(details: SignupDomainDetails): string {
  if (details.domainType === "subdomain") {
    return `${details.subdomain.trim().toLowerCase()}.${MERCFLOW_SUBDOMAIN_SUFFIX}`
  }

  return details.customDomain.trim().toLowerCase()
}

export function validateSignupDomain(details: SignupDomainDetails): string | null {
  if (details.domainType === "subdomain") {
    const subdomain = details.subdomain.trim().toLowerCase()
    if (subdomain.length === 0) {
      return "Subdomain is required"
    }
    if (!SUBDOMAIN_PATTERN.test(subdomain)) {
      return "Subdomain must use lowercase letters, numbers, and hyphens"
    }
    return null
  }

  const customDomain = details.customDomain.trim().toLowerCase()
  if (customDomain.length === 0) {
    return "Custom domain is required"
  }
  if (!CUSTOM_DOMAIN_PATTERN.test(customDomain)) {
    return "Enter a valid domain such as shop.example.com"
  }

  return null
}
