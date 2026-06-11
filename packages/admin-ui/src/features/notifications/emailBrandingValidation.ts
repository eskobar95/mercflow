import type { EmailBrandingFieldErrors, EmailBrandingFormValues } from "./types"

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmailBrandingForm(values: EmailBrandingFormValues): EmailBrandingFieldErrors {
  const errors: EmailBrandingFieldErrors = {}
  const logo = values.logoUrl.trim()
  if (logo !== "") {
    try {
      const parsed = new URL(logo)
      if (parsed.protocol !== "https:") errors.logoUrl = "Logo URL must use HTTPS"
    } catch {
      errors.logoUrl = "Enter a valid HTTPS URL"
    }
  }
  if (values.storeName.trim() === "") errors.storeName = "Store display name is required"
  if (!HEX_COLOR_PATTERN.test(values.brandColor.trim())) errors.brandColor = "Choose a valid hex color"
  if (values.replyTo.trim() !== "" && !EMAIL_PATTERN.test(values.replyTo.trim())) {
    errors.replyTo = "Enter a valid reply-to email"
  }
  if (values.supportEmail.trim() !== "" && !EMAIL_PATTERN.test(values.supportEmail.trim())) {
    errors.supportEmail = "Enter a valid support email"
  }
  return errors
}

export function hasEmailBrandingFieldErrors(errors: EmailBrandingFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function canPreviewEmailBranding(values: EmailBrandingFormValues): boolean {
  return !hasEmailBrandingFieldErrors(validateEmailBrandingForm(values))
}
