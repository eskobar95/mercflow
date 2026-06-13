import { describe, expect, it } from "vitest"

import {
  resolveSignupDomain,
  validateSignupDomain,
  validateSignupStoreDetails,
} from "../src/lib/signupStoreOptions"

describe("validateSignupStoreDetails", () => {
  it("accepts complete store details", () => {
    expect(
      validateSignupStoreDetails({
        storeName: "Kaffehuset",
        currency: "dkk",
        country: "dk",
        timezone: "Europe/Copenhagen",
      }),
    ).toBeNull()
  })

  it("requires store name", () => {
    expect(
      validateSignupStoreDetails({
        storeName: "  ",
        currency: "dkk",
        country: "dk",
        timezone: "Europe/Copenhagen",
      }),
    ).toBe("Store name is required")
  })

  it("requires currency, country, and timezone", () => {
    expect(
      validateSignupStoreDetails({
        storeName: "Kaffehuset",
        currency: "",
        country: "",
        timezone: "",
      }),
    ).toBe("Currency is required")
  })
})

describe("validateSignupDomain", () => {
  it("accepts mercflow subdomains", () => {
    expect(
      validateSignupDomain({
        domainType: "subdomain",
        subdomain: "kaffehuset",
        customDomain: "",
      }),
    ).toBeNull()
  })

  it("rejects invalid subdomains", () => {
    expect(
      validateSignupDomain({
        domainType: "subdomain",
        subdomain: "-bad-",
        customDomain: "",
      }),
    ).toBe("Subdomain must use lowercase letters, numbers, and hyphens")
  })

  it("accepts custom domains", () => {
    expect(
      validateSignupDomain({
        domainType: "custom",
        subdomain: "",
        customDomain: "shop.example.com",
      }),
    ).toBeNull()
  })
})

describe("resolveSignupDomain", () => {
  it("builds mercflow.shop subdomain", () => {
    expect(
      resolveSignupDomain({
        domainType: "subdomain",
        subdomain: "Kaffehuset",
        customDomain: "",
      }),
    ).toBe("kaffehuset.mercflow.shop")
  })

  it("normalizes custom domains", () => {
    expect(
      resolveSignupDomain({
        domainType: "custom",
        subdomain: "",
        customDomain: "Shop.Example.COM",
      }),
    ).toBe("shop.example.com")
  })
})
