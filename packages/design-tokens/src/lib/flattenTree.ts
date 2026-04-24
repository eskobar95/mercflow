/**
 * Flattens nested string leaf objects into key paths joined by kebab segments.
 * `default` keys collapse so `group.primary.default` becomes `group-primary` (not `group-primary-default`).
 */
export function flattenStringTree(
  value: unknown,
  segments: string[]
): Array<[string, string]> {
  if (typeof value === "string") {
    return [[`${segments.join("-")}`, value]]
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return []
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) => {
    if (key === "default" && typeof v === "string") {
      // e.g. `surface.default` → `surface-default`; `interactive.primary.default` (segments length ≥2) → `interactive-primary`
      const name =
        segments.length >= 2
          ? segments.join("-")
          : [...segments, "default"].join("-")
      return [[name, v] as [string, string]]
    }
    return flattenStringTree(v, [...segments, key])
  })
}

export function flattenRootStringTree(
  root: Record<string, unknown>
): Array<[string, string]> {
  return Object.entries(root).flatMap(([key, v]) => flattenStringTree(v, [key]))
}
