import type { GeneralSettingsFormValues } from "./types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateGeneralSettingsForm(values: GeneralSettingsFormValues): string | null {
  if (values.storeName.trim() === "") {
    return "Store name is required."
  }

  const email = values.contactEmail.trim()
  if (email === "") {
    return "Contact email is required."
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid contact email address."
  }

  if (values.defaultCurrency.trim() === "") {
    return "Default currency is required."
  }

  if (values.timezone.trim() === "") {
    return "Timezone is required."
  }

  if (values.address.street.trim() === "") {
    return "Street address is required."
  }
  if (values.address.city.trim() === "") {
    return "City is required."
  }
  if (values.address.postalCode.trim() === "") {
    return "Postal code is required."
  }
  if (values.address.country.trim() === "") {
    return "Country is required."
  }

  return null
}
