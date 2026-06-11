import { describe, expect, it } from "vitest"

import {
  describeSesError,
  parseSesError,
} from "../src/lib/platform-email/ses-error-catalog"

describe("parseSesError", () => {
  it("returns null for empty messages", () => {
    expect(parseSesError(null)).toEqual({
      code: null,
      description: null,
    })
  })

  it("extracts known SES error codes from message text", () => {
    expect(parseSesError("MailFromDomainNotVerified: domain not verified")).toEqual({
      code: "MailFromDomainNotVerified",
      description: "The MAIL FROM domain is not verified in SES.",
    })
  })

  it("falls back to catalog helper when code is unknown", () => {
    const message = "Error: CustomFailure while sending"
    expect(parseSesError(message)).toEqual({
      code: "CustomFailure",
      description: "SES error code: CustomFailure",
    })
  })
})

describe("describeSesError", () => {
  it("returns catalog description for known codes", () => {
    expect(describeSesError("Throttling")).toBe(
      "SES is throttling send requests — retry later.",
    )
  })
})
