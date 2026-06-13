import { Button, Heading, Hr, Section, Text } from "@react-email/components"
import type { ReactNode } from "react"

import { EmailLayout } from "./layout"
import type { ShippingUpdateTemplateProps } from "./types"

const DEFAULT_BRAND_COLOR = "#111827"

export function ShippingUpdateTemplate({
  logoUrl,
  brandColor,
  storeName,
  supportEmail,
  order,
  carrierName,
  trackingNumber,
  trackingUrl,
  expectedDelivery,
  orderUrl,
}: ShippingUpdateTemplateProps): ReactNode {
  const accentColor = brandColor ?? DEFAULT_BRAND_COLOR
  const orderNumber = String(order.display_id)

  return (
    <EmailLayout
      previewText={`Order #${orderNumber} has shipped`}
      logoUrl={logoUrl}
      brandColor={brandColor}
      storeName={storeName}
      supportEmail={supportEmail}
    >
      <Heading style={headingStyle}>Your order is on the way</Heading>
      <Text style={introStyle}>
        Good news — order #{orderNumber} has shipped
        {order.email ? ` to ${order.email}` : ""}.
      </Text>

      <Section style={detailsSectionStyle}>
        {carrierName ? (
          <Text style={detailRowStyle}>
            <span style={detailLabelStyle}>Carrier:</span> {carrierName}
          </Text>
        ) : null}
        {trackingNumber ? (
          <Text style={detailRowStyle}>
            <span style={detailLabelStyle}>Tracking number:</span> {trackingNumber}
          </Text>
        ) : null}
        {expectedDelivery ? (
          <Text style={detailRowStyle}>
            <span style={detailLabelStyle}>Expected delivery:</span> {expectedDelivery}
          </Text>
        ) : null}
      </Section>

      {trackingUrl ? (
        <Section style={ctaSectionStyle}>
          <Button href={trackingUrl} style={{ ...buttonStyle, backgroundColor: accentColor }}>
            Track shipment
          </Button>
        </Section>
      ) : null}

      {orderUrl ? (
        <Section style={secondaryCtaSectionStyle}>
          <Button href={orderUrl} style={secondaryButtonStyle}>
            View order
          </Button>
        </Section>
      ) : null}

      <Hr style={hrStyle} />
      <Text style={supportStyle}>
        Questions about your shipment? Reply to this email
        {supportEmail ? ` or contact ${supportEmail}` : ""}.
      </Text>
    </EmailLayout>
  )
}

export default ShippingUpdateTemplate

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

const detailsSectionStyle = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "24px",
  padding: "16px",
}

const detailRowStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
}

const detailLabelStyle = {
  color: "#111827",
  fontWeight: 600,
}

const ctaSectionStyle = {
  marginBottom: "12px",
  textAlign: "center" as const,
}

const secondaryCtaSectionStyle = {
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

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#111827",
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
