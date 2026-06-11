import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

import type { EmailBrandingProps } from "./types"

const DEFAULT_BRAND_COLOR = "#111827"

type EmailLayoutProps = EmailBrandingProps & {
  previewText: string
  children: ReactNode
}

export function EmailLayout({
  previewText,
  logoUrl,
  brandColor,
  storeName,
  supportEmail,
  children,
}: EmailLayoutProps): ReactNode {
  const accentColor = brandColor ?? DEFAULT_BRAND_COLOR
  const displayName = storeName ?? "Your store"

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...headerStyle, borderBottomColor: accentColor }}>
            {logoUrl ? (
              <Img src={logoUrl} alt={`${displayName} logo`} height={40} style={logoStyle} />
            ) : (
              <Text style={{ ...storeNameStyle, color: accentColor }}>{displayName}</Text>
            )}
          </Section>

          {children}

          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>{displayName}</Text>
            {supportEmail ? (
              <Text style={footerTextStyle}>
                Questions? Contact us at{" "}
                <a href={`mailto:${supportEmail}`} style={{ color: accentColor }}>
                  {supportEmail}
                </a>
              </Text>
            ) : null}
            <Text style={footerMutedStyle}>
              You received this transactional email because you placed an order with {displayName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "24px 0",
}

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "24px",
}

const headerStyle = {
  borderBottom: "2px solid",
  marginBottom: "24px",
  paddingBottom: "16px",
}

const logoStyle = {
  display: "block",
}

const storeNameStyle = {
  fontSize: "20px",
  fontWeight: 700,
  margin: 0,
}

const hrStyle = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}

const footerStyle = {
  marginTop: "8px",
}

const footerTextStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
}

const footerMutedStyle = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
}
