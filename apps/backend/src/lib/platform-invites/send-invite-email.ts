import { createElement } from "react"
import { render } from "@react-email/render"

import {
  PlatformInviteTemplate,
  type PlatformInviteTemplateProps,
} from "@mercflow/notification-module/templates"
import { createSESClientFromEnv } from "@mercflow/notification-module/ses-client"
import { DEFAULT_FALLBACK_FROM } from "@mercflow/notification-module/types"

function getPlatformInviteFromEmail(): string {
  return process.env.PLATFORM_INVITE_FROM_EMAIL?.trim() || DEFAULT_FALLBACK_FROM
}

function getSignupBaseUrl(): string {
  return (
    process.env.MERCFLOW_SIGNUP_BASE_URL?.trim() ||
    "https://admin.mercflow.shop/signup"
  )
}

export function buildPlatformInviteUrl(rawToken: string): string {
  const baseUrl = getSignupBaseUrl().replace(/\/$/, "")
  return `${baseUrl}?invite=${encodeURIComponent(rawToken)}`
}

export async function sendPlatformInviteEmail(input: {
  email: string
  inviteUrl: string
}): Promise<void> {
  const sesClient = createSESClientFromEnv()
  const props: PlatformInviteTemplateProps = {
    inviteUrl: input.inviteUrl,
    recipientEmail: input.email,
  }

  const html = await render(createElement(PlatformInviteTemplate, props))

  await sesClient.sendEmail({
    from: getPlatformInviteFromEmail(),
    to: input.email,
    subject: "You've been invited to MercFlow",
    html,
  })
}
