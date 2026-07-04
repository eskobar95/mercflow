export type DiscountFormType = "product" | "order" | "buyget" | "free_shipping"

export type DiscountMethod = "code" | "automatic"

export type ProductScope = "all" | "collections" | "products"

export type DiscountConditionsFormState = {
  minPurchaseAmount: string
  minQuantity: string
  customerEligibility: "all" | "segments" | "customers"
  usageLimitTotal: string
  usageLimitPerCustomer: string
  startsAt: string
  endsAt: string
  combineWithProduct: boolean
  combineWithOrder: boolean
  combineWithShipping: boolean
}

export type DiscountFormCoreState = {
  name: string
  method: DiscountMethod
  code: string
  valueType: "percentage" | "fixed"
  value: string
  conditions: DiscountConditionsFormState
}

export type ProductDiscountFormState = DiscountFormCoreState & {
  appliesTo: ProductScope
  collectionIds: string[]
  productIds: string[]
}

export type OrderDiscountFormState = DiscountFormCoreState

export function createDefaultConditionsState(): DiscountConditionsFormState {
  return {
    minPurchaseAmount: "",
    minQuantity: "",
    customerEligibility: "all",
    usageLimitTotal: "",
    usageLimitPerCustomer: "",
    startsAt: "",
    endsAt: "",
    combineWithProduct: false,
    combineWithOrder: false,
    combineWithShipping: false,
  }
}

export function createDefaultProductDiscountFormState(): ProductDiscountFormState {
  return {
    name: "",
    method: "code",
    code: "",
    valueType: "percentage",
    value: "10",
    appliesTo: "all",
    collectionIds: [],
    productIds: [],
    conditions: createDefaultConditionsState(),
  }
}

export function createDefaultOrderDiscountFormState(): OrderDiscountFormState {
  return {
    name: "",
    method: "automatic",
    code: "",
    valueType: "percentage",
    value: "10",
    conditions: createDefaultConditionsState(),
  }
}

export type BuyMinimumType = "quantity" | "amount"

export type GetDiscountKind = "percentage" | "fixed" | "free"

export type BuyXGetYFormValues = {
  name: string
  method: DiscountMethod
  code: string
  buyMinimumType: BuyMinimumType
  buyMinimumQuantity: string
  buyMinimumAmount: string
  buyScope: ProductScope
  getQuantity: string
  getDiscountKind: GetDiscountKind
  getPercentage: string
  getFixedAmount: string
  getScope: ProductScope
  maxUsesPerOrder: string
}

export type FreeShippingFormValues = {
  name: string
  method: DiscountMethod
  code: string
  minimumOrderAmount: string
  countryMode: "all" | "specific"
  countryCodes: string[]
  excludeAbove: string
}

export const DEFAULT_BUY_X_GET_Y_VALUES: BuyXGetYFormValues = {
  name: "",
  method: "code",
  code: "",
  buyMinimumType: "quantity",
  buyMinimumQuantity: "2",
  buyMinimumAmount: "",
  buyScope: "all",
  getQuantity: "1",
  getDiscountKind: "free",
  getPercentage: "100",
  getFixedAmount: "",
  getScope: "all",
  maxUsesPerOrder: "1",
}

export const DEFAULT_FREE_SHIPPING_VALUES: FreeShippingFormValues = {
  name: "",
  method: "automatic",
  code: "",
  minimumOrderAmount: "",
  countryMode: "all",
  countryCodes: [],
  excludeAbove: "",
}

export const FREE_SHIPPING_COUNTRY_OPTIONS = [
  { code: "DK", label: "Denmark" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "FI", label: "Finland" },
  { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
] as const

export function isBuyGetOrFreeShippingType(type: DiscountFormType): boolean {
  return type === "buyget" || type === "free_shipping"
}
