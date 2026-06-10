import { describe, expect, it } from "vitest"

import {
  buildShipmondoParcels,
  buildShipmondoShipmentBody,
  mmToCm,
} from "../src/modules/connector/build-shipmondo-shipment-body"
import { defaultShipmondoLabelSettings } from "../src/modules/connector/shipmondo-label-settings"
import {
  assertShipmondoSenderConfigured,
  shipmondoLabelSettingsPatchSchema,
} from "../src/modules/connector/shipmondo-label-settings"

const senderParty = {
  name: "Guapo ApS",
  address1: "Testvej 1",
  postalCode: "2100",
  city: "Copenhagen",
  countryCode: "DK",
  email: "sender@example.com",
  phone: "+4512345678",
}

const receiverParty = {
  name: "Jane Doe",
  address1: "Modtagergade 2",
  postalCode: "8000",
  city: "Aarhus",
  countryCode: "DK",
  email: "jane@example.com",
  phone: "+4587654321",
}

describe("buildShipmondoShipmentBody", (): void => {
  it("converts packaging mm to cm and uses parcel weight from order line items", (): void => {
    const body = buildShipmondoShipmentBody({
      productCode: "GLSDK_SD",
      serviceCodes: "EMAIL_NT",
      servicePointId: "95892",
      automaticSelectServicePoint: false,
      labelSettings: defaultShipmondoLabelSettings(),
      reference: "Order #1001",
      sender: senderParty,
      receiver: receiverParty,
      parcelWeightG: 750,
      packaging: {
        lengthMm: 300,
        widthMm: 200,
        heightMm: 100,
      },
    })

    expect(body.parcels).toEqual([
      {
        weight: 750,
        length: 30,
        width: 20,
        height: 10,
      },
    ])
    expect(body.product_code).toBe("GLSDK_SD")
    expect(body.service_point_id).toBe("95892")
    expect(body.own_agreement).toBe(false)
    expect(body.label_format).toBe("10x19_pdf")
  })

  it("falls back to weight-only parcel when packaging is null", (): void => {
    const parcels = buildShipmondoParcels(480, null)
    expect(parcels).toEqual([{ weight: 480 }])

    const body = buildShipmondoShipmentBody({
      productCode: "GLSDK_SD",
      serviceCodes: "EMAIL_NT",
      servicePointId: null,
      automaticSelectServicePoint: false,
      labelSettings: {
        ...defaultShipmondoLabelSettings(),
        ownAgreement: true,
        labelFormat: "a4_pdf",
      },
      reference: "Order #42",
      sender: senderParty,
      receiver: receiverParty,
      parcelWeightG: 480,
      packaging: null,
    })

    expect(body.parcels).toEqual([{ weight: 480 }])
    expect(body.own_agreement).toBe(true)
    expect(body.label_format).toBe("a4_pdf")
    expect(body.service_point_id).toBeUndefined()
  })

  it("exposes mmToCm as division by 10", (): void => {
    expect(mmToCm(305)).toBe(30.5)
  })
})

describe("Shipmondo sender validation", (): void => {
  it("accepts a complete sender profile", (): void => {
    expect(() => {
      assertShipmondoSenderConfigured({
        ...defaultShipmondoLabelSettings(),
        senderName: "Guapo ApS",
        senderAddress1: "Testvej 1",
        senderPostalCode: "2100",
        senderCity: "Copenhagen",
        senderCountryCode: "DK",
        senderEmail: "sender@example.com",
        senderPhone: "+4512345678",
      })
    }).not.toThrow()
  })

  it("rejects incomplete sender profiles", (): void => {
    expect(() => {
      assertShipmondoSenderConfigured(defaultShipmondoLabelSettings())
    }).toThrow(/sender settings are incomplete/i)
  })

  it("validates sender patch fields with Zod", (): void => {
    const parsed = shipmondoLabelSettingsPatchSchema.safeParse({
      senderEmail: "not-an-email",
    })
    expect(parsed.success).toBe(false)
  })
})
