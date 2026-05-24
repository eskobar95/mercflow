const MAX_CHARS = 220

/** Short plain-text excerpt for overview cards — Medusa exposes description as plain string. */
export function formatCategoryDescriptionPreview(description: string | null): string | null {
  if (description === null) {
    return null
  }
  const trimmed = description.trim()
  if (trimmed === "") {
    return null
  }
  if (trimmed.length <= MAX_CHARS) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_CHARS).trim()}…`
}
