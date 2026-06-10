import { MedusaError } from "@medusajs/utils"

import { MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA } from "../../fulfillment-providers/shipmondo-checkout/option-data"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === "string" ? value.trim() : ""
}

function readProductCodeFromData(data: unknown): string | null {
  if (!isRecord(data)) {
    return null
  }
  const direct =
    readString(data, MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.productCode) ||
    readString(data, "product_code") ||
    readString(data, "productCode")
  return direct !== "" ? direct : null
}

function readServicePointId(metadata: unknown): string | null {
  if (!isRecord(metadata)) {
    return null
  }
  const candidates = [
    "shipmondo_service_point_id",
    "service_point_id",
    "servicePointId",
  ]
  for (const key of candidates) {
    const value = readString(metadata, key)
    if (value !== "") {
      return value
    }
  }
  return null
}

function buildReceiverParty(input: {
  firstName: string
  lastName: string
  address1: string
  postalCode: string
  city: string
  countryCode: string
  email: string
  phone: string
}): {
  name: string
  address1: string
  postalCode: string
  city: string
  countryCode: string
  email: string
  phone: string
} {
  const name = [input.firstName, input.lastName].filter((part) => part.trim() !== "").join(" ").trim()
  return {
    name: name !== "" ? name : "Receiver",
    address1: input.address1,
    postalCode: input.postalCode,
    city: input.city,
    countryCode: input.countryCode,
    email: input.email,
    phone: input.phone,
  }
}

export type ShipmondoShipmentContext = {
  orderId: string
  orderDisplayId: string
  productCode: string
  servicePointId: string | null
  receiver: {
    name: string
    address1: string
    postalCode: string
    city: string
    countryCode: string
    email: string
    phone: string
  }
}

type RemoteGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

export async function loadShipmondoShipmentContext(input: {
  graph: RemoteGraph["graph"]
  fulfillmentId: string
}): Promise<ShipmondoShipmentContext> {
  const { data } = await input.graph({
    entity: "fulfillment",
    fields: [
      "id",
      "order.id",
      "order.display_id",
      "order.email",
      "order.metadata",
      "order.shipping_address.first_name",
      "order.shipping_address.last_name",
      "order.shipping_address.address_1",
      "order.shipping_address.postal_code",
      "order.shipping_address.city",
      "order.shipping_address.country_code",
      "order.shipping_address.phone",
      "order.shipping_methods.id",
      "order.shipping_methods.data",
      "order.shipping_methods.shipping_option_id",
      "order.shipping_methods.shipping_option.data",
    ],
    filters: { id: input.fulfillmentId },
  })

  const fulfillment = data.find(isRecord)
  if (fulfillment === undefined) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment ${input.fulfillmentId} was not found`
    )
  }

  const order = fulfillment.order
  if (!isRecord(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Fulfillment is missing its parent order"
    )
  }

  const orderId = readString(order, "id")
  if (orderId === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Order id is missing on fulfillment")
  }

  const displayRaw = order.display_id
  const orderDisplayId =
    typeof displayRaw === "number" && Number.isFinite(displayRaw)
      ? String(Math.trunc(displayRaw))
      : readString(order, "display_id")

  const shippingAddress = isRecord(order.shipping_address) ? order.shipping_address : null
  if (shippingAddress === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order shipping address is required to create a Shipmondo shipment"
    )
  }

  const receiver = buildReceiverParty({
    firstName: readString(shippingAddress, "first_name"),
    lastName: readString(shippingAddress, "last_name"),
    address1: readString(shippingAddress, "address_1"),
    postalCode: readString(shippingAddress, "postal_code"),
    city: readString(shippingAddress, "city"),
    countryCode: readString(shippingAddress, "country_code").toUpperCase(),
    email: readString(order, "email"),
    phone: readString(shippingAddress, "phone"),
  })

  if (receiver.address1 === "" || receiver.postalCode === "" || receiver.city === "") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order shipping address is incomplete for Shipmondo label generation"
    )
  }

  if (receiver.countryCode.length !== 2) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order shipping country code must be a 2-letter ISO code"
    )
  }

  let productCode: string | null = null
  const shippingMethods = order.shipping_methods
  if (Array.isArray(shippingMethods)) {
    for (const method of shippingMethods) {
      if (!isRecord(method)) {
        continue
      }
      productCode =
        readProductCodeFromData(method.data) ??
        (isRecord(method.shipping_option)
          ? readProductCodeFromData(method.shipping_option.data)
          : null)
      if (productCode !== null) {
        break
      }
    }
  }

  if (productCode === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No Shipmondo product_code was found on the order shipping method — configure shipping option data first"
    )
  }

  const servicePointId = readServicePointId(order.metadata)

  return {
    orderId,
    orderDisplayId: orderDisplayId !== "" ? orderDisplayId : orderId,
    productCode,
    servicePointId,
    receiver,
  }
}
