/**
 * Relation adapter — maps a product's `metadata` bag into display groups for the
 * Relations tab, and back. This is the clean contract a future generic
 * relation-table module can implement instead of `metadata`: the UI depends only
 * on `RelationGroup[]`, not on where the data lives.
 *
 * Supported shapes today: string / number / boolean (scalar) and arrays of those
 * (list). Nested objects are preserved untouched (passthrough) but not edited.
 */
export type RelationGroupKind = "scalar" | "list"

export type RelationGroup = {
  key: string
  label: string
  kind: RelationGroupKind
  values: string[]
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim()
  if (spaced === "") {
    return key
  }
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
}

export function metadataToRelationGroups(metadata: Record<string, unknown>): RelationGroup[] {
  const groups: RelationGroup[] = []

  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      if (value.every(isPrimitive)) {
        groups.push({
          key,
          label: humanizeKey(key),
          kind: "list",
          values: value.map((entry) => String(entry)),
        })
      }
      continue
    }

    if (isPrimitive(value)) {
      groups.push({ key, label: humanizeKey(key), kind: "scalar", values: [String(value)] })
    }
  }

  return groups.toSorted((a, b) => a.label.localeCompare(b.label))
}

export function setScalarValue(
  metadata: Record<string, unknown>,
  key: string,
  value: string,
): Record<string, unknown> {
  return { ...metadata, [key]: value }
}

export function setListValues(
  metadata: Record<string, unknown>,
  key: string,
  values: string[],
): Record<string, unknown> {
  return { ...metadata, [key]: values }
}

export function removeRelationKey(
  metadata: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const next = { ...metadata }
  delete next[key]
  return next
}
