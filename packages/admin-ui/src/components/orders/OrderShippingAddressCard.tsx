import { Card } from "@/components/ui/Card"

import type { OrderAddress } from "@/features/orders/orderTypes"

function formatStreet(addr: OrderAddress): string[] {
  const lines: string[] = [addr.line1]
  if (addr.line2 !== null && addr.line2.trim() !== "") {
    lines.push(addr.line2)
  }
  return lines
}

export function OrderShippingAddressCard(props: {
  address: OrderAddress | null
}): JSX.Element {
  const addr = props.address
  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
        Shipping address
      </h2>
      {addr === null ? (
        <p className="mt-2 text-sm text-content-secondary">No shipping address on file.</p>
      ) : (
        <address className="mt-3 text-sm not-italic">
          <p className="font-medium text-content-primary">{addr.name}</p>
          {formatStreet(addr).map((line) => (
            <p key={line} className="text-content-primary">
              {line}
            </p>
          ))}
          <p className="mt-2 text-content-primary">
            {[
              addr.postalCode,
              addr.city,
              [addr.province, addr.countryCode?.toUpperCase()].filter(Boolean).join(" "),
            ]
              .filter((p) => typeof p === "string" && p.trim() !== "")
              .join(", ")}
          </p>
        </address>
      )}
    </Card>
  )
}
