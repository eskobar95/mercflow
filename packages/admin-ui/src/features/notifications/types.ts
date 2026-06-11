export type EmailConfigDto = {
  id: string
  store_id: string
  domain: string | null
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  logo_url: string | null
  brand_color: string | null
  support_email: string | null
  ses_domain_status: "pending" | "verified" | "failed"
  ses_identity_arn: string | null
  fallback_from: string | null
}

export type EmailBrandingFormValues = {
  logoUrl: string
  storeName: string
  brandColor: string
  replyTo: string
  supportEmail: string
}

export type EmailBrandingFieldErrors = Partial<Record<keyof EmailBrandingFormValues, string>>

export const DEFAULT_EMAIL_BRAND_COLOR = "#2563EB"

export function emailConfigToFormValues(config: EmailConfigDto): EmailBrandingFormValues {
  return {
    logoUrl: config.logo_url ?? "",
    storeName: config.from_name ?? "",
    brandColor: config.brand_color ?? DEFAULT_EMAIL_BRAND_COLOR,
    replyTo: config.reply_to ?? "",
    supportEmail: config.support_email ?? "",
  }
}

export function formValuesToBrandingPayload(values: EmailBrandingFormValues): {
  logo_url: string | null
  brand_color: string | null
  from_name: string | null
  reply_to: string | null
  support_email: string | null
} {
  return {
    logo_url: values.logoUrl.trim() === "" ? null : values.logoUrl.trim(),
    brand_color: values.brandColor.trim() === "" ? null : values.brandColor.trim(),
    from_name: values.storeName.trim() === "" ? null : values.storeName.trim(),
    reply_to: values.replyTo.trim() === "" ? null : values.replyTo.trim(),
    support_email: values.supportEmail.trim() === "" ? null : values.supportEmail.trim(),
  }
}

export function formValuesToPreviewQuery(values: EmailBrandingFormValues): URLSearchParams {
  const payload = formValuesToBrandingPayload(values)
  const params = new URLSearchParams()
  if (payload.logo_url !== null) params.set("logo_url", payload.logo_url)
  if (payload.brand_color !== null) params.set("brand_color", payload.brand_color)
  if (payload.from_name !== null) params.set("from_name", payload.from_name)
  if (payload.reply_to !== null) params.set("reply_to", payload.reply_to)
  if (payload.support_email !== null) params.set("support_email", payload.support_email)
  return params
}
