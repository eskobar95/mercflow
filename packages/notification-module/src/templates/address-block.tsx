import { Section, Text } from "@react-email/components"
import type { OrderAddressDTO } from "@medusajs/types"
import type { ReactNode } from "react"

type AddressBlockProps = {
  title: string
  address: OrderAddressDTO
}

function formatAddressLine(address: OrderAddressDTO): string[] {
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ").trim()
  const locality = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ")
  const country = address.country_code?.toUpperCase() ?? ""

  return [
    name,
    address.company ?? "",
    address.address_1 ?? "",
    address.address_2 ?? "",
    locality,
    country,
    address.phone ?? "",
  ].filter((line) => line.length > 0)
}

export function AddressBlock({ title, address }: AddressBlockProps): ReactNode {
  const lines = formatAddressLine(address)

  return (
    <Section style={sectionStyle}>
      <Text style={titleStyle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={lineStyle}>
          {line}
        </Text>
      ))}
    </Section>
  )
}

const sectionStyle = {
  marginBottom: "20px",
}

const titleStyle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  margin: "0 0 8px",
}

const lineStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 2px",
}
