import { describe, expect, it } from "vitest"

import {
  disabledTemplatesStorageKey,
  isTemplateEnabled,
  parseDisabledTemplates,
  toggleTemplateEnabled,
} from "./notificationTemplates"

describe("notificationTemplates", () => {
  it("builds a store-scoped localStorage key", () => {
    expect(disabledTemplatesStorageKey("store_abc")).toBe(
      "mercflow:disabled-notification-templates:store_abc",
    )
  })

  it("parses disabled template keys from JSON arrays", () => {
    expect(parseDisabledTemplates(["order-confirmation", "invalid-key", 42])).toEqual([
      "order-confirmation",
    ])
    expect(parseDisabledTemplates(null)).toEqual([])
  })

  it("toggles template enabled state immutably", () => {
    const disabled = toggleTemplateEnabled("shipping-update", [], false)
    expect(disabled).toEqual(["shipping-update"])
    expect(isTemplateEnabled("shipping-update", disabled)).toBe(false)

    const reEnabled = toggleTemplateEnabled("shipping-update", disabled, true)
    expect(reEnabled).toEqual([])
    expect(isTemplateEnabled("shipping-update", reEnabled)).toBe(true)
  })
})
