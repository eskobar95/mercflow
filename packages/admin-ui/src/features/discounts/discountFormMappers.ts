import type {
  DiscountConditionsFormState,
  DiscountFormCoreState,
  OrderDiscountFormState,
  ProductDiscountFormState,
} from "./discountFormTypes"
import { createDefaultConditionsState } from "./discountFormTypes"
import type { AdminDiscountDetail } from "./types"

function isoToDateTimeLocal(value: string | null): string {
  if (value === null) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const pad = (part: number): string => String(part).padStart(2, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapConditionsFromDetail(detail: AdminDiscountDetail): DiscountConditionsFormState {
  const defaults = createDefaultConditionsState()
  return {
    ...defaults,
    usageLimitTotal:
      detail.usage_limit !== null && detail.usage_limit > 0
        ? String(detail.usage_limit)
        : "",
    startsAt: isoToDateTimeLocal(detail.starts_at),
    endsAt: isoToDateTimeLocal(detail.expires_at),
  }
}

export function mapDetailToProductFormState(detail: AdminDiscountDetail): ProductDiscountFormState {
  return {
    name: detail.name,
    method: detail.is_automatic ? "automatic" : "code",
    code: detail.code ?? "",
    valueType: detail.value_type ?? "percentage",
    value: detail.value !== null ? String(detail.value) : "10",
    appliesTo: "all",
    conditions: mapConditionsFromDetail(detail),
  }
}

export function mapDetailToOrderFormState(detail: AdminDiscountDetail): OrderDiscountFormState {
  return {
    name: detail.name,
    method: detail.is_automatic ? "automatic" : "code",
    code: detail.code ?? "",
    valueType: detail.value_type ?? "percentage",
    value: detail.value !== null ? String(detail.value) : "10",
    conditions: mapConditionsFromDetail(detail),
  }
}

export function mapDetailToCoreFormState(detail: AdminDiscountDetail): DiscountFormCoreState {
  return {
    name: detail.name,
    method: detail.is_automatic ? "automatic" : "code",
    code: detail.code ?? "",
    valueType: detail.value_type ?? "percentage",
    value: detail.value !== null ? String(detail.value) : "10",
    conditions: mapConditionsFromDetail(detail),
  }
}
