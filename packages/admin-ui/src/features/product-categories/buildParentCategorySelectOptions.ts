import type { SelectOption } from "@/components/ui/Select"

import type { AdminProductCategoryHierarchyRow } from "./types"

/** Radix Select value meaning “no parent” (must not collide with Medusa IDs). */
const PARENT_CATEGORY_NONE_VALUE = "__mercflow_parent_none__"

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

  const rest: SelectOption[] = []
  for (const row of hierarchyRows) {
    if (excludedIds.has(row.id)) {
      continue
    }
    rest.push({
      value: row.id,
      label: `${"— ".repeat(row.depth)}${row.name}`,
    })
  }

  return [base, ...rest]
}
