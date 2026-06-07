/** Operator options. Enum fields use is / is not; date fields use after / before. */
export type FilterOperator = "is" | "is not" | "after" | "before"

type FilterCategoryType = "enum" | "date"

export type FilterValueTone = "neutral" | "success" | "warning" | "danger" | "accent"

type FilterValue = {
  id: string
  label: string
  /** Optional status dot colour, Linear-style. */
  tone?: FilterValueTone
}

export type FilterCategory = {
  id: string
  label: string
  type: FilterCategoryType
  /** Operators shown in the chip's logic dropdown. */
  operators: FilterOperator[]
  values: FilterValue[]
}

export type ActiveFilter = {
  categoryId: string
  operator: FilterOperator
  valueIds: string[]
}
