import { Button, Heading, Section, Text } from "@react-email/components"
import type { ReactNode } from "react"

import { EmailLayout } from "./layout"

const DEFAULT_BRAND_COLOR = "#111827"

export type PlatformWelcomeTemplateProps = {
  recipientEmail: string
  storeName: string
  tenantUrl: string
  adminUrl: string
}

export function PlatformWelcomeTemplate({
  recipientEmail,
  storeName,
  tenantUrl,
  adminUrl,
}: PlatformWelcomeTemplateProps): ReactNode {
  return (
    <EmailLayout
      previewText="Your MercFlow store is ready"
      storeName="MercFlow"
      brandColor={DEFAULT_BRAND_COLOR}
      supportEmail="hello@mercflow.shop"
    >
      <Heading style={headingStyle}>Welcome to MercFlow</Heading>
      <Text style={introStyle}>
        <strong>{storeName}</strong> is ready for{" "}
        <strong>{recipientEmail}</strong>. Your store infrastructure has been
        provisioned — you can open Store Admin to start configuring products,
        payments, and shipping.
      </Text>

      <Section style={ctaSectionStyle}>
        <Button href={adminUrl} style={{ ...buttonStyle, backgroundColor: DEFAULT_BRAND_COLOR }}>
          Open Store Admin
        </Button>
      </Section>

      <Text style={bodyStyle}>
        Your storefront will be available at{" "}
        <a href={tenantUrl} style={linkStyle}>
          {tenantUrl}
        </a>
        . Custom domains may take a little longer while DNS propagates.
      </Text>
    </EmailLayout>
  )
}

export default PlatformWelcomeTemplate

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

const bodyStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
}

const ctaSectionStyle = {
  marginBottom: "24px",
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

const linkStyle = {
  color: "#111827",
  textDecoration: "underline",
}
