import { createElement } from "react"
import { render } from "@react-email/render"

import {
  PlatformWelcomeTemplate,
  type PlatformWelcomeTemplateProps,
} from "@mercflow/notification-module/templates"
import { createSESClientFromEnv } from "@mercflow/notification-module/ses-client"
import { DEFAULT_FALLBACK_FROM } from "@mercflow/notification-module/types"

function getPlatformWelcomeFromEmail(): string {
  return process.env.PLATFORM_INVITE_FROM_EMAIL?.trim() || DEFAULT_FALLBACK_FROM
}

export async function sendPlatformWelcomeEmail(input: {
  email: string
  storeName: string
  tenantUrl: string
  adminUrl: string
}): Promise<void> {
  const sesClient = createSESClientFromEnv()
  const props: PlatformWelcomeTemplateProps = {
    recipientEmail: input.email,
    storeName: input.storeName,
    tenantUrl: input.tenantUrl,
    adminUrl: input.adminUrl,
  }

  const html = await render(createElement(PlatformWelcomeTemplate, props))

  await sesClient.sendEmail({
    from: getPlatformWelcomeFromEmail(),
    to: input.email,
    subject: "Welcome to MercFlow — your store is ready",
    html,
  })
}
