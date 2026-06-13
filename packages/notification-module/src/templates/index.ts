import type { FC } from "react"
import type { OrderDTO, OrderLineItemDTO } from "@medusajs/types"

import { CustomerWelcomeTemplate } from "./customer-welcome"
import { OrderCancellationTemplate } from "./order-cancellation"
import { OrderConfirmationTemplate } from "./order-confirmation"
import { ShippingUpdateTemplate } from "./shipping-update"
import type {
  CustomerWelcomeTemplateProps,
  OrderCancellationTemplateProps,
  OrderConfirmationTemplateProps,
  ShippingUpdateTemplateProps,
} from "./types"

export { AddressBlock } from "./address-block"
export { CustomerWelcomeTemplate } from "./customer-welcome"
export { EmailLayout } from "./layout"
export { LineItem } from "./line-item"
export { OrderCancellationTemplate } from "./order-cancellation"
export { OrderConfirmationTemplate } from "./order-confirmation"
export { PlatformInviteTemplate } from "./platform-invite"
export { ShippingUpdateTemplate } from "./shipping-update"
export type { PlatformInviteTemplateProps } from "./platform-invite"
export type {
  CustomerWelcomeTemplateProps,
  EmailBrandingProps,
  OrderCancellationTemplateProps,
  OrderConfirmationTemplateProps,
  ShippingUpdateTemplateProps,
} from "./types"
export { formatOrderMoney } from "./format-money"

export const ORDER_CONFIRMATION_TEMPLATE_KEY = "order-confirmation"
export const SHIPPING_UPDATE_TEMPLATE_KEY = "shipping-update"
export const ORDER_CANCELLATION_TEMPLATE_KEY = "order-cancellation"
export const CUSTOMER_WELCOME_TEMPLATE_KEY = "customer-welcome"

export function registerNotificationTemplates(
  registry: Map<string, FC<Record<string, unknown>>>
): void {
  registry.set(
    ORDER_CONFIRMATION_TEMPLATE_KEY,
    OrderConfirmationTemplate as FC<Record<string, unknown>>
  )
  registry.set(
    SHIPPING_UPDATE_TEMPLATE_KEY,
    ShippingUpdateTemplate as FC<Record<string, unknown>>
  )
  registry.set(
    ORDER_CANCELLATION_TEMPLATE_KEY,
    OrderCancellationTemplate as FC<Record<string, unknown>>
  )
  registry.set(
    CUSTOMER_WELCOME_TEMPLATE_KEY,
    CustomerWelcomeTemplate as FC<Record<string, unknown>>
  )
}

function buildSampleOrder(): OrderDTO {
  return {
    id: "order_01XYZ",
    version: 1,
    display_id: 1001,
    status: "pending",
    currency_code: "usd",
    email: "buyer@example.com",
    created_at: "2026-06-11T12:00:00.000Z",
    updated_at: "2026-06-11T12:00:00.000Z",
    original_item_total: 5000,
    original_item_subtotal: 5000,
    original_item_tax_total: 0,
    item_total: 5000,
    item_subtotal: 5000,
    item_tax_total: 0,
    original_total: 5500,
    original_subtotal: 5000,
    original_tax_total: 0,
    total: 5500,
    subtotal: 5000,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    shipping_total: 500,
    shipping_subtotal: 500,
    shipping_tax_total: 0,
    summary: {
      pending_difference: 0,
      current_order_total: 5500,
      original_order_total: 5500,
      transaction_total: 5500,
      paid_total: 5500,
      refunded_total: 0,
      credit_line_total: 0,
      accounting_total: 5500,
      raw_pending_difference: { value: "0", precision: 20 },
      raw_current_order_total: { value: "5500", precision: 20 },
      raw_original_order_total: { value: "5500", precision: 20 },
      raw_transaction_total: { value: "5500", precision: 20 },
      raw_paid_total: { value: "5500", precision: 20 },
      raw_refunded_total: { value: "0", precision: 20 },
      raw_credit_line_total: { value: "0", precision: 20 },
      raw_accounting_total: { value: "5500", precision: 20 },
    },
    items: [
      {
        id: "oli_01ABC",
        title: "Classic Tee",
        product_title: "Classic Tee",
        variant_title: "Black / M",
        quantity: 1,
        unit_price: 5000,
        requires_shipping: true,
        is_discountable: true,
        is_giftcard: false,
        is_tax_inclusive: false,
        thumbnail: "https://cdn.example.com/tee.png",
        raw_item_total: { value: "5000", precision: 20 },
        raw_item_subtotal: { value: "5000", precision: 20 },
        raw_item_tax_total: { value: "0", precision: 20 },
        raw_total: { value: "5000", precision: 20 },
        raw_subtotal: { value: "5000", precision: 20 },
        raw_tax_total: { value: "0", precision: 20 },
        raw_discount_total: { value: "0", precision: 20 },
        raw_discount_tax_total: { value: "0", precision: 20 },
        raw_refundable_total: { value: "5000", precision: 20 },
        raw_refundable_total_per_unit: { value: "5000", precision: 20 },
        item_total: 5000,
        item_subtotal: 5000,
        item_tax_total: 0,
        total: 5000,
        subtotal: 5000,
        tax_total: 0,
        discount_total: 0,
        discount_tax_total: 0,
        refundable_total: 5000,
        refundable_total_per_unit: 5000,
      } as unknown as OrderLineItemDTO,
    ],
    shipping_address: {
      id: "addr_01ABC",
      first_name: "Jane",
      last_name: "Doe",
      address_1: "123 Main Street",
      city: "Copenhagen",
      postal_code: "2100",
      country_code: "dk",
      created_at: "2026-06-11T12:00:00.000Z",
      updated_at: "2026-06-11T12:00:00.000Z",
    },
  } as unknown as OrderDTO
}

export function buildSampleOrderConfirmationProps(): OrderConfirmationTemplateProps {
  return {
    logoUrl: "https://cdn.example.com/logo.png",
    brandColor: "#1A1A1A",
    storeName: "Example Shop",
    supportEmail: "support@example.com",
    orderUrl: "https://shop.example.com/account/orders/order_01XYZ",
    order: buildSampleOrder(),
  }
}

export function buildSampleShippingUpdateProps(): ShippingUpdateTemplateProps {
  return {
    logoUrl: "https://cdn.example.com/logo.png",
    brandColor: "#1A1A1A",
    storeName: "Example Shop",
    supportEmail: "support@example.com",
    orderUrl: "https://shop.example.com/account/orders/order_01XYZ",
    carrierName: "PostNord",
    trackingNumber: "PN123456789DK",
    trackingUrl: "https://tracking.example.com/PN123456789DK",
    expectedDelivery: "June 14–16, 2026",
    order: buildSampleOrder(),
  }
}

export function buildSampleOrderCancellationProps(): OrderCancellationTemplateProps {
  return {
    logoUrl: "https://cdn.example.com/logo.png",
    brandColor: "#1A1A1A",
    storeName: "Example Shop",
    supportEmail: "support@example.com",
    orderUrl: "https://shop.example.com/account/orders/order_01XYZ",
    cancellationReason: "Customer requested cancellation before fulfillment.",
    refundNote:
      "A refund of $55.00 has been initiated and may take several business days to appear.",
    order: {
      ...buildSampleOrder(),
      status: "canceled",
    },
  }
}

export function buildSampleCustomerWelcomeProps(): CustomerWelcomeTemplateProps {
  return {
    logoUrl: "https://cdn.example.com/logo.png",
    brandColor: "#1A1A1A",
    storeName: "Example Shop",
    supportEmail: "support@example.com",
    customerFirstName: "Jane",
    storeUrl: "https://shop.example.com",
  }
}
