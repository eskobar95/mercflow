import { describe, expect, it } from "vitest"

import { validateGeneralSettingsForm } from "@/features/settings/storeGeneralFormValidation"
import type { GeneralSettingsFormValues } from "@/features/settings/types"

const VALID_VALUES: GeneralSettingsFormValues = {
  storeName: "MercFlow Demo",
  contactEmail: "hello@example.com",
  defaultCurrency: "dkk",
  timezone: "Europe/Copenhagen",
  address: {
    street: "Main Street 1",
    city: "Copenhagen",
    postalCode: "1000",
    country: "dk",
  },
}

describe("validateGeneralSettingsForm", (): void => {
  it("accepts a complete valid form", (): void => {
    expect(validateGeneralSettingsForm(VALID_VALUES)).toBeNull()
  })

  it("requires store name", (): void => {
    expect(
      validateGeneralSettingsForm({ ...VALID_VALUES, storeName: "   " }),
    ).toMatch(/store name/i)
  })

  it("requires a valid contact email", (): void => {
    expect(
      validateGeneralSettingsForm({ ...VALID_VALUES, contactEmail: "not-an-email" }),
    ).toMatch(/valid contact email/i)
  })
})
