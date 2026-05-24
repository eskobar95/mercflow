import type { AdminProductCategoryHierarchyRow, AdminProductCategoryParsed } from "./types"

function compareSiblings(a: AdminProductCategoryParsed, b: AdminProductCategoryParsed): number {
  const rankA = a.rank
  const rankB = b.rank
  if (rankA !== null && rankB !== null && rankA !== rankB) {
    return rankA - rankB
  }
  if (rankA !== null && rankB === null) {
    return -1
  }
  if (rankA === null && rankB !== null) {
    return 1
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

/**
 * Categories whose parent is missing from this response are promoted to roots
 * so the tree stays renderable offline of a full catalog fetch.
 */
function normalizeParents(
  categories: AdminProductCategoryParsed[]
): AdminProductCategoryParsed[] {
  const idSet = new Set(categories.map((c) => c.id))
  return categories.map((c) => {
    if (c.parent_category_id !== null && !idSet.has(c.parent_category_id)) {
      return { ...c, parent_category_id: null }
    }
    return c
  })
}

function groupByParent(
  categories: AdminProductCategoryParsed[]
): Map<string | null, AdminProductCategoryParsed[]> {
  const map = new Map<string | null, AdminProductCategoryParsed[]>()
  for (const c of categories) {
    const key = c.parent_category_id
    const list = map.get(key) ?? []
    list.push(c)
    map.set(key, list)
  }
  for (const [, list] of map) {
    list.sort(compareSiblings)
  }
  return map
}

/**
 * Depth-first traversal: each parent followed by its nested descendants.
 */
export function buildHierarchyRowsFromCategories(
  categories: AdminProductCategoryParsed[]
): AdminProductCategoryHierarchyRow[] {
  const normalized = normalizeParents(categories)
  const byParent = groupByParent(normalized)
  const roots = byParent.get(null) ?? []
  const out: AdminProductCategoryHierarchyRow[] = []

  const walk = (nodes: AdminProductCategoryParsed[], depth: number): void => {
    for (const node of nodes) {
      out.push({
        id: node.id,
        name: node.name,
        handle: node.handle,
        description: node.description,
        productCount: node.productCount,
        is_active: node.is_active,
        updated_at: node.updated_at,
        depth,
      })
      const children = byParent.get(node.id) ?? []
      walk(children, depth + 1)
    }
  }

  walk(roots, 0)
  return out
}
