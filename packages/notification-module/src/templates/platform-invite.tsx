import { Button, Heading, Section, Text } from "@react-email/components"
import type { ReactNode } from "react"

import { EmailLayout } from "./layout"

const DEFAULT_BRAND_COLOR = "#111827"

export type PlatformInviteTemplateProps = {
  inviteUrl: string
  recipientEmail: string
}

export function PlatformInviteTemplate({
  inviteUrl,
  recipientEmail,
}: PlatformInviteTemplateProps): ReactNode {
  return (
    <EmailLayout
      previewText="Set up your MercFlow store"
      storeName="MercFlow"
      brandColor={DEFAULT_BRAND_COLOR}
      supportEmail="hello@mercflow.shop"
    >
      <Heading style={headingStyle}>You&apos;re invited to MercFlow</Heading>
      <Text style={introStyle}>
        You have been invited to create a MercFlow store for{" "}
        <strong>{recipientEmail}</strong>. Click the button below to start your signup.
        This invite link is single-use and expires in 72 hours.
      </Text>

      <Section style={ctaSectionStyle}>
        <Button href={inviteUrl} style={{ ...buttonStyle, backgroundColor: DEFAULT_BRAND_COLOR }}>
          Set up your store
        </Button>
      </Section>

      <Text style={fallbackStyle}>
        If the button does not work, copy and paste this URL into your browser:
      </Text>
      <Text style={linkStyle}>{inviteUrl}</Text>
    </EmailLayout>
  )
}

export default PlatformInviteTemplate

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

const fallbackStyle = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
}

const linkStyle = {
  color: "#111827",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
  wordBreak: "break-all" as const,
}
