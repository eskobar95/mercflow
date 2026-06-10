import type { ShipmondoLabelSettings } from "./shipmondo-label-settings"

export type ShipmondoPackagingDimensions = {
  lengthMm: number
  widthMm: number
  heightMm: number
  maxWeightG: number
}

export type ShipmondoShipmentParty = {
  name: string
  address1: string
  postalCode: string
  city: string
  countryCode: string
  email: string
  phone: string
}

export type BuildShipmondoShipmentBodyInput = {
  productCode: string
  serviceCodes: string
  servicePointId: string | null
  automaticSelectServicePoint: boolean
  labelSettings: ShipmondoLabelSettings
  reference: string
  sender: ShipmondoShipmentParty
  receiver: ShipmondoShipmentParty
  packaging: ShipmondoPackagingDimensions | null
}

export type ShipmondoShipmentParcel = {
  weight: number
  length?: number
  width?: number
  height?: number
}

export function mmToCm(mm: number): number {
  return mm / 10
}

export function buildShipmondoParcels(
  packaging: ShipmondoPackagingDimensions | null
): ShipmondoShipmentParcel[] {
  if (packaging === null) {
    return [{ weight: 0 }]
  }

  return [
    {
      weight: packaging.maxWeightG,
      length: mmToCm(packaging.lengthMm),
      width: mmToCm(packaging.widthMm),
      height: mmToCm(packaging.heightMm),
    },
  ]
}

function buildParty(type: "sender" | "receiver", party: ShipmondoShipmentParty): Record<string, unknown> {
  return {
    type,
    name: party.name,
    address1: party.address1,
    postal_code: party.postalCode,
    city: party.city,
    country_code: party.countryCode,
    email: party.email,
    phone: party.phone,
  }
}

export function buildShipmondoShipmentBody(
  input: BuildShipmondoShipmentBodyInput
): Record<string, unknown> {
  const productCode = input.productCode.trim()
  if (productCode === "") {
    throw new Error("Shipmondo product_code is required to create a shipment")
  }

  const body: Record<string, unknown> = {
    own_agreement: input.labelSettings.ownAgreement,
    label_format: input.labelSettings.labelFormat,
    product_code: productCode,
    service_codes: input.serviceCodes,
    automatic_select_service_point: input.automaticSelectServicePoint,
    parties: [buildParty("sender", input.sender), buildParty("receiver", input.receiver)],
    parcels: buildShipmondoParcels(input.packaging),
    reference: input.reference,
    print: false,
  }

  if (input.servicePointId !== null && input.servicePointId.trim() !== "") {
    body.service_point_id = input.servicePointId.trim()
  }

  return body
}
