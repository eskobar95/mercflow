import type { AdminProductCategoryParsed } from "./types"

/**
 * Returns `rootId` and every descendant category id (excluding siblings of `rootId`).
 */
export function collectSelfAndDescendantCategoryIds(
  categories: readonly AdminProductCategoryParsed[],
  rootId: string
): Set<string> {
  const childrenByParent = new Map<string | null, string[]>()
  for (const c of categories) {
    const p = c.parent_category_id
    const list = childrenByParent.get(p) ?? []
    list.push(c.id)
    childrenByParent.set(p, list)
  }
  const out = new Set<string>()
  const stack: string[] = [rootId]
  while (stack.length > 0) {
    const id = stack.pop()
    if (id === undefined) {
      continue
    }
    out.add(id)
    const kids = childrenByParent.get(id) ?? []
    for (const k of kids) {
      stack.push(k)
    }
  }
  return out
}
