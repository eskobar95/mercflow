import { Button, Heading, Hr, Section, Text } from "@react-email/components"
import type { OrderLineItemDTO } from "@medusajs/types"
import type { ReactNode } from "react"

import { AddressBlock } from "./address-block"
import { formatOrderMoney } from "./format-money"
import { EmailLayout } from "./layout"
import { LineItem } from "./line-item"
import type { OrderConfirmationTemplateProps } from "./types"

const DEFAULT_BRAND_COLOR = "#111827"

export function OrderConfirmationTemplate({
  logoUrl,
  brandColor,
  storeName,
  supportEmail,
  order,
  orderUrl,
}: OrderConfirmationTemplateProps): ReactNode {
  const accentColor = brandColor ?? DEFAULT_BRAND_COLOR
  const orderNumber = String(order.display_id)
  const items = order.items ?? []
  const shippingAddress = order.shipping_address
  const orderTotal = order.summary?.current_order_total ?? order.total

  return (
    <EmailLayout
      previewText={`Order #${orderNumber} confirmed`}
      logoUrl={logoUrl}
      brandColor={brandColor}
      storeName={storeName}
      supportEmail={supportEmail}
    >
      <Heading style={headingStyle}>Thanks for your order</Heading>
      <Text style={introStyle}>
        We received order #{orderNumber}
        {order.email ? ` for ${order.email}` : ""}. We will notify you when it ships.
      </Text>

      {items.length > 0 ? (
        <Section style={itemsSectionStyle}>
          <Text style={sectionLabelStyle}>Order summary</Text>
          {items.map((item: OrderLineItemDTO) => (
            <LineItem key={item.id} item={item} currencyCode={order.currency_code} />
          ))}
        </Section>
      ) : null}

      {shippingAddress ? (
        <AddressBlock title="Shipping address" address={shippingAddress} />
      ) : null}

      <Section style={totalsSectionStyle}>
        <Text style={totalLabelStyle}>Order total</Text>
        <Text style={totalValueStyle}>
          {formatOrderMoney(orderTotal, order.currency_code)}
        </Text>
      </Section>

      {orderUrl ? (
        <Section style={ctaSectionStyle}>
          <Button href={orderUrl} style={{ ...buttonStyle, backgroundColor: accentColor }}>
            View order
          </Button>
        </Section>
      ) : null}

      <Hr style={hrStyle} />
      <Text style={supportStyle}>
        Need help with your order? Reply to this email
        {supportEmail ? ` or contact ${supportEmail}` : ""}.
      </Text>
    </EmailLayout>
  )
}

export default OrderConfirmationTemplate

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

const itemsSectionStyle = {
  marginBottom: "24px",
}

const sectionLabelStyle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 12px",
}

const totalsSectionStyle = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "24px",
  padding: "16px",
}

const totalLabelStyle = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "18px",
  margin: "0 0 4px",
}

const totalValueStyle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: "24px",
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
