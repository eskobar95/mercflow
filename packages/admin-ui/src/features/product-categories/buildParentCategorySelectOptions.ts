import type { SelectOption } from "@/components/ui/Select"

import type { AdminProductCategoryHierarchyRow } from "./types"

/** Radix Select value meaning “no parent” (must not collide with Medusa IDs). */
export const PARENT_CATEGORY_NONE_VALUE = "__mercflow_parent_none__"

export function parentCategoryIdToSelectValue(parentId: string | null): string {
  return parentId ?? PARENT_CATEGORY_NONE_VALUE
}

export function selectValueToParentCategoryId(value: string): string | null {
  return value === PARENT_CATEGORY_NONE_VALUE ? null : value
}

export function buildParentCategorySelectOptions(
  hierarchyRows: readonly AdminProductCategoryHierarchyRow[],
  excludedIds: ReadonlySet<string>
): SelectOption[] {
  const base: SelectOption = {
    value: PARENT_CATEGORY_NONE_VALUE,
    label: "No parent (top-level)",
  }

  const rest: SelectOption[] = hierarchyRows
    .filter((r) => !excludedIds.has(r.id))
    .map((r) => ({
      value: r.id,
      label: `${"— ".repeat(r.depth)}${r.name}`,
    }))

  return [base, ...rest]
}
