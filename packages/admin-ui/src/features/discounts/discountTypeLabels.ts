import type { DiscountFormType } from "@/features/discounts/discountFormTypes"

const DISCOUNT_TYPE_TITLES: Record<DiscountFormType, string> = {
  product: "Product discount",
  order: "Order discount",
  buyget: "Buy X get Y",
  free_shipping: "Free shipping",
}

export function isDiscountTypeSupportedForForms(type: DiscountFormType): boolean {
  return type === "product" || type === "order"
}

export function discountTypeTitle(type: DiscountFormType): string {
  return DISCOUNT_TYPE_TITLES[type]
}
