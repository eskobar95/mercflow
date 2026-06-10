import {
  normalizeShipmondoRulesFromStoredJson,
  shipmondoRulesToStored,
  type ShipmondoShippingRulesNormalized,
} from "./shipmondo-shipping-rules"
import {
  normalizeShipmondoLabelSettingsFromStoredJson,
  shipmondoLabelSettingsToStored,
  type ShipmondoLabelSettings,
} from "./shipmondo-label-settings"

export type ShipmondoConnectorRulesJson = ReturnType<typeof shipmondoRulesToStored> &
  ReturnType<typeof shipmondoLabelSettingsToStored>

export function readShipmondoConnectorRules(raw: unknown | null | undefined): {
  shipping: ShipmondoShippingRulesNormalized
  label: ShipmondoLabelSettings
} {
  return {
    shipping: normalizeShipmondoRulesFromStoredJson(raw),
    label: normalizeShipmondoLabelSettingsFromStoredJson(raw),
  }
}

export function writeShipmondoConnectorRules(input: {
  shipping: ShipmondoShippingRulesNormalized
  label: ShipmondoLabelSettings
}): ShipmondoConnectorRulesJson {
  return {
    ...shipmondoRulesToStored(input.shipping),
    ...shipmondoLabelSettingsToStored(input.label),
  }
}
