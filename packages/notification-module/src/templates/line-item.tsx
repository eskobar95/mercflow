import { Column, Img, Row, Section, Text } from "@react-email/components"
import type { OrderLineItemDTO } from "@medusajs/types"
import type { ReactNode } from "react"

import { formatOrderMoney } from "./format-money"

type LineItemProps = {
  item: OrderLineItemDTO
  currencyCode: string
}

export function LineItem({ item, currencyCode }: LineItemProps): ReactNode {
  const title = item.product_title ?? item.title
  const variantLabel = item.variant_title ?? item.subtitle ?? null
  const lineTotal = item.unit_price * item.quantity

  return (
    <Section style={itemSectionStyle}>
      <Row>
        {item.thumbnail ? (
          <Column style={thumbnailColumnStyle}>
            <Img
              src={item.thumbnail}
              alt={title}
              width={56}
              height={56}
              style={thumbnailStyle}
            />
          </Column>
        ) : null}
        <Column style={detailsColumnStyle}>
          <Text style={titleStyle}>{title}</Text>
          {variantLabel ? <Text style={variantStyle}>{variantLabel}</Text> : null}
          <Text style={metaStyle}>
            Qty {item.quantity} · {formatOrderMoney(lineTotal, currencyCode)}
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

const itemSectionStyle = {
  borderBottom: "1px solid #f3f4f6",
  marginBottom: "12px",
  paddingBottom: "12px",
}

const thumbnailColumnStyle = {
  width: "72px",
  verticalAlign: "top" as const,
}

const detailsColumnStyle = {
  verticalAlign: "top" as const,
}

const thumbnailStyle = {
  borderRadius: "6px",
  objectFit: "cover" as const,
}

const titleStyle = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: "22px",
  margin: "0 0 4px",
}

const variantStyle = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "18px",
  margin: "0 0 4px",
}

const metaStyle = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "18px",
  margin: 0,
}
