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
