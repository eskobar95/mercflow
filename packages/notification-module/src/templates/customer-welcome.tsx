import { Button, Heading, Hr, Section, Text } from "@react-email/components"
import type { ReactNode } from "react"

import { EmailLayout } from "./layout"
import type { CustomerWelcomeTemplateProps } from "./types"

const DEFAULT_BRAND_COLOR = "#111827"

export function CustomerWelcomeTemplate({
  logoUrl,
  brandColor,
  storeName,
  supportEmail,
  customerFirstName,
  storeUrl,
}: CustomerWelcomeTemplateProps): ReactNode {
  const accentColor = brandColor ?? DEFAULT_BRAND_COLOR
  const displayName = storeName ?? "our store"
  const greetingName =
    typeof customerFirstName === "string" && customerFirstName.trim().length > 0
      ? customerFirstName.trim()
      : "there"

  return (
    <EmailLayout
      previewText={`Welcome to ${displayName}`}
      logoUrl={logoUrl}
      brandColor={brandColor}
      storeName={storeName}
      supportEmail={supportEmail}
    >
      <Heading style={headingStyle}>Welcome, {greetingName}!</Heading>
      <Text style={introStyle}>
        Thanks for creating an account with {displayName}. You can now track orders, save
        addresses, and shop faster on your next visit.
      </Text>

      {storeUrl ? (
        <Section style={ctaSectionStyle}>
          <Button href={storeUrl} style={{ ...buttonStyle, backgroundColor: accentColor }}>
            Visit store
          </Button>
        </Section>
      ) : null}

      <Hr style={hrStyle} />
      <Text style={supportStyle}>
        Need help getting started? Reply to this email
        {supportEmail ? ` or contact ${supportEmail}` : ""}.
      </Text>
    </EmailLayout>
  )
}

export default CustomerWelcomeTemplate

const headingStyle = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "32px",
  margin: "0 0 12px",
}

const introStyle = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 24px",
}

const ctaSectionStyle = {
  marginBottom: "16px",
  textAlign: "center" as const,
}

const buttonStyle = {
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  padding: "12px 20px",
  textDecoration: "none",
}

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "16px 0",
}

const supportStyle = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
}
