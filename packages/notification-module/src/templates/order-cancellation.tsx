import { Button, Heading, Hr, Section, Text } from "@react-email/components"
import type { ReactNode } from "react"

import { EmailLayout } from "./layout"
import type { OrderCancellationTemplateProps } from "./types"

const DEFAULT_BRAND_COLOR = "#111827"

export function OrderCancellationTemplate({
  logoUrl,
  brandColor,
  storeName,
  supportEmail,
  order,
  cancellationReason,
  refundNote,
  orderUrl,
}: OrderCancellationTemplateProps): ReactNode {
  const accentColor = brandColor ?? DEFAULT_BRAND_COLOR
  const orderNumber = String(order.display_id)

  return (
    <EmailLayout
      previewText={`Order #${orderNumber} was canceled`}
      logoUrl={logoUrl}
      brandColor={brandColor}
      storeName={storeName}
      supportEmail={supportEmail}
    >
      <Heading style={headingStyle}>Your order was canceled</Heading>
      <Text style={introStyle}>
        Order #{orderNumber}
        {order.email ? ` for ${order.email}` : ""} has been canceled.
      </Text>

      {cancellationReason ? (
        <Section style={detailsSectionStyle}>
          <Text style={sectionLabelStyle}>Reason</Text>
          <Text style={detailTextStyle}>{cancellationReason}</Text>
        </Section>
      ) : null}

      {refundNote ? (
        <Section style={refundSectionStyle}>
          <Text style={sectionLabelStyle}>Refund</Text>
          <Text style={detailTextStyle}>{refundNote}</Text>
        </Section>
      ) : null}

      {orderUrl ? (
        <Section style={ctaSectionStyle}>
          <Button href={orderUrl} style={{ ...buttonStyle, backgroundColor: accentColor }}>
            View order
          </Button>
        </Section>
      ) : null}

      <Hr style={hrStyle} />
      <Text style={supportStyle}>
        If you have questions about this cancellation, reply to this email
        {supportEmail ? ` or contact ${supportEmail}` : ""}.
      </Text>
    </EmailLayout>
  )
}

export default OrderCancellationTemplate

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
  marginBottom: "16px",
  padding: "16px",
}

const refundSectionStyle = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  marginBottom: "24px",
  padding: "16px",
}

const sectionLabelStyle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 8px",
}

const detailTextStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
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
