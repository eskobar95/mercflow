import type { OrderDTO } from "@medusajs/types"

export type EmailBrandingProps = {
  logoUrl?: string | null
  brandColor?: string | null
  storeName?: string | null
  supportEmail?: string | null
  replyTo?: string | null
}

export type OrderConfirmationTemplateProps = EmailBrandingProps & {
  order: OrderDTO
  orderUrl?: string | null
}

export type ShippingUpdateTemplateProps = EmailBrandingProps & {
  order: OrderDTO
  carrierName?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  expectedDelivery?: string | null
  orderUrl?: string | null
}

export type OrderCancellationTemplateProps = EmailBrandingProps & {
  order: OrderDTO
  cancellationReason?: string | null
  refundNote?: string | null
  orderUrl?: string | null
}

export type CustomerWelcomeTemplateProps = EmailBrandingProps & {
  customerFirstName?: string | null
  storeUrl?: string | null
}
