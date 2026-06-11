import { MedusaError } from "@medusajs/utils"

import type { EmailConfigRecord } from "../modules/notification/types"
import {
  renderOrderConfirmationPreview,
  type OrderConfirmationPreviewBranding,
} from "./render-order-confirmation-preview"

export type EmailPreviewBrandingOverrides = {
  logo_url?: string | null
  brand_color?: string | null
  from_name?: string | null
  reply_to?: string | null
  support_email?: string | null
}

const SUPPORTED_PREVIEW_TEMPLATES = ["order-confirmation"] as const
export type EmailPreviewTemplateKey = (typeof SUPPORTED_PREVIEW_TEMPLATES)[number]

function isSupportedTemplate(value: string): value is EmailPreviewTemplateKey {
  return (SUPPORTED_PREVIEW_TEMPLATES as readonly string[]).includes(value)
}

function resolveBranding(
  config: EmailConfigRecord,
  overrides: EmailPreviewBrandingOverrides,
): OrderConfirmationPreviewBranding {
  return {
    logoUrl: overrides.logo_url !== undefined ? overrides.logo_url : config.logo_url,
    brandColor:
      overrides.brand_color !== undefined && overrides.brand_color !== null
        ? overrides.brand_color
        : config.brand_color ?? "#2563EB",
    storeName:
      overrides.from_name !== undefined && overrides.from_name !== null
        ? overrides.from_name
        : config.from_name ?? "Your store",
    replyTo: overrides.reply_to !== undefined ? overrides.reply_to : config.reply_to,
    supportEmail:
      overrides.support_email !== undefined ? overrides.support_email : config.support_email,
  }
}

export function renderEmailPreviewHtml(
  templateKey: string,
  config: EmailConfigRecord,
  overrides: EmailPreviewBrandingOverrides = {},
): string {
  if (!isSupportedTemplate(templateKey)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Email preview template "${templateKey}" is not supported`,
    )
  }

  const branding = resolveBranding(config, overrides)

  switch (templateKey) {
    case "order-confirmation":
      return renderOrderConfirmationPreview(branding)
    default: {
      const exhaustive: never = templateKey
      return exhaustive
    }
  }
}
