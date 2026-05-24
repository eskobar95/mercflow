/** Operator options — enum fields use is/is-not; date fields use after/before. */
export type FilterOperator = "is" | "is not" | "after" | "before"

export type FilterCategoryType = "enum" | "date"

export type FilterCategory = {
  id: string
  label: string
  type: FilterCategoryType
  /** Operators shown in the chip's logic dropdown. */
  operators: FilterOperator[]
  values: Array<{ id: string; label: string }>
}

export type ActiveFilter = {
  categoryId: string
  operator: FilterOperator
  valueIds: string[]
}
