import type { MedusaContainer } from "@medusajs/framework/types"
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import type {
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
} from "@medusajs/types"

import { CONNECTOR_MODULE } from "../../modules/connector"
import type ConnectorModuleService from "../../modules/connector/service"
import {
  type ShipmondoShippingRulesNormalized,
  calculateShipmondoCheckoutShippingMinor,
  defaultShipmondoShippingRules,
} from "../../modules/connector/shipmondo-shipping-rules"
import { MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA } from "./option-data"

const UNAVAILABLE_LISTING_MINOR = 99_999_999

function bnLikeToMinor(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value)
  }
  if (typeof value === "bigint") {
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  if (typeof value === "object" && value !== null && "numeric" in value) {
    const inner = (value as { numeric?: unknown }).numeric
    if (typeof inner === "number" && Number.isFinite(inner)) {
      return Math.round(inner)
    }
  }
  return null
}

function goodsSubtotalMinorFromContext(context: Record<string, unknown>): number {
  const direct =
    bnLikeToMinor(context["item_subtotal"]) ?? bnLikeToMinor(context["subtotal"])
  if (direct !== null && direct >= 0) {
    return direct
  }

  let sum = 0
  const items = context["items"]
  if (!Array.isArray(items)) {
    return 0
  }

  for (const line of items) {
    if (typeof line !== "object" || line === null) {
      continue
    }
    const rec = line as Record<string, unknown>
    const lineTotal =
      bnLikeToMinor(rec["subtotal"]) ??
      bnLikeToMinor(rec["item_subtotal"]) ??
      bnLikeToMinor(rec["total"])
    if (lineTotal !== null && lineTotal >= 0) {
      sum += lineTotal
    }
  }
  return Math.max(0, sum)
}

function readStringField(source: Record<string, unknown>, key: string): string {
  const raw = source[key]
  return typeof raw === "string" ? raw.trim() : ""
}

function readMinorField(source: Record<string, unknown>, key: string): number {
  const raw = source[key]
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw)
  }
  if (typeof raw === "string") {
    const n = Number(raw)
    if (Number.isFinite(n)) {
      return Math.round(n)
    }
  }
  return 0
}

function resolveConnectorService(
  cradle: Record<string, unknown>
): ConnectorModuleService | null {
  const container = cradle as unknown as MedusaContainer
  try {
    return container.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  } catch {
    return null
  }
}

async function resolveActiveRulesJson(
  connector: ConnectorModuleService | null
): Promise<ShipmondoShippingRulesNormalized> {
  if (connector === null) {
    return defaultShipmondoShippingRules()
  }
  const storeRules = await connector.getShipmondoStoreShippingRules()
  if (!storeRules.active) {
    return defaultShipmondoShippingRules()
  }
  return {
    markupAmountMinor: storeRules.markupAmountMinor,
    freeShippingThresholdMinor: storeRules.freeShippingThresholdMinor,
    enabledCarrierCodes: storeRules.enabledCarrierCodes,
  }
}

/**
 * Medusa fulfillment provider: applies MercFlow Shipmondo connector rules (markup, free-shipping
 * threshold, enabled product codes) during `calculateShippingOptionsPricesWorkflow`.
 *
 * Shipping options must use `price_type: "calculated"` and store Shipmondo catalogue fields in `data`
 * (see `MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA`).
 */
export default class ShipmondoCheckoutFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "mercflow_shipmondo_checkout"

  protected readonly cradle_: Record<string, unknown>

  constructor(cradle: Record<string, unknown>) {
    super()
    this.cradle_ = cradle
  }

  async getFulfillmentOptions(): Promise<{ id: string; name: string }[]> {
    return [
      {
        id: "mercflow_shipmondo_checkout",
        name: "MercFlow Shipmondo checkout rate",
      },
    ]
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    void optionData
    void context
    return data
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    void data
    return true
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return data.price_type === "calculated"
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<CalculatedShippingOptionPrice> {
    void data
    const productCode = readStringField(
      optionData,
      MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.productCode
    )
    const basePriceMinor = readMinorField(
      optionData,
      MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.basePriceMinor
    )

    const connector = resolveConnectorService(this.cradle_)
    const rules = await resolveActiveRulesJson(connector)
    const cartSubtotal = goodsSubtotalMinorFromContext(context)

    const priced = calculateShipmondoCheckoutShippingMinor({
      cartSubtotalExShippingMinor: cartSubtotal,
      carrierProductCode: productCode,
      basePriceMinorFromProvider: basePriceMinor,
      rules,
    })

    if (priced.reason === "disabled") {
      return {
        calculated_amount: UNAVAILABLE_LISTING_MINOR,
        is_calculated_price_tax_inclusive: false,
      }
    }

    return {
      calculated_amount: priced.priceMinor,
      is_calculated_price_tax_inclusive: false,
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: unknown[],
    order: unknown,
    fulfillment: unknown
  ): Promise<CreateFulfillmentResult> {
    void data
    void items
    void order
    void fulfillment
    return {
      data: {},
      labels: [],
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    void data
    return {}
  }

  async createReturnFulfillment(fromData: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    void fromData
    return {
      data: {},
      labels: [],
    }
  }

  async retrieveDocuments(
    fulfillmentData: Record<string, unknown>,
    documentType: string
  ): Promise<void> {
    void fulfillmentData
    void documentType
    await Promise.resolve()
  }
}
