import type { MetafieldValueType } from "./types"

export function sortMetafieldDefinitionsByPinned<
  T extends { pinned_position: number | null; name: string },
>(definitions: readonly T[]): T[] {
  return [...definitions].sort((a, b) => {
    const aPin = a.pinned_position ?? Number.MAX_SAFE_INTEGER
    const bPin = b.pinned_position ?? Number.MAX_SAFE_INTEGER
    if (aPin !== bPin) {
      return aPin - bPin
    }
    return a.name.localeCompare(b.name)
  })
}

export function metafieldValueToDraftString(type: MetafieldValueType, value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  switch (type) {
    case "single_line_text":
    case "multi_line_text":
    case "url":
    case "color":
    case "date":
    case "date_time":
      return typeof value === "string" ? value : ""
    case "number_integer":
    case "number_decimal":
      return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
    case "boolean":
      return typeof value === "boolean" ? (value ? "true" : "false") : ""
    case "list.single_line_text":
      return Array.isArray(value) ? value.filter((item) => typeof item === "string").join("\n") : ""
    case "list.number_integer":
      return Array.isArray(value)
        ? value.filter((item) => typeof item === "number").join(", ")
        : ""
    case "json":
    case "rich_text":
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return ""
      }
    default: {
      const _exhaustive: never = type
      return String(_exhaustive)
    }
  }
}

export function parseMetafieldDraftValue(
  type: MetafieldValueType,
  draft: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  const trimmed = draft.trim()
  if (trimmed === "") {
    return { ok: false, message: "Value cannot be empty" }
  }

  switch (type) {
    case "single_line_text":
    case "multi_line_text":
    case "url":
    case "color":
    case "date":
    case "date_time":
      return { ok: true, value: trimmed }
    case "number_integer": {
      const parsed = Number(trimmed)
      if (!Number.isInteger(parsed)) {
        return { ok: false, message: "Enter a whole number" }
      }
      return { ok: true, value: parsed }
    }
    case "number_decimal": {
      const parsed = Number(trimmed)
      if (!Number.isFinite(parsed)) {
        return { ok: false, message: "Enter a valid number" }
      }
      return { ok: true, value: parsed }
    }
    case "boolean": {
      if (trimmed === "true") {
        return { ok: true, value: true }
      }
      if (trimmed === "false") {
        return { ok: true, value: false }
      }
      return { ok: false, message: "Select true or false" }
    }
    case "list.single_line_text": {
      const items = trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
      if (items.length === 0) {
        return { ok: false, message: "Add at least one list item" }
      }
      return { ok: true, value: items }
    }
    case "list.number_integer": {
      const items = trimmed
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
      const numbers: number[] = []
      for (const part of items) {
        const parsed = Number(part)
        if (!Number.isInteger(parsed)) {
          return { ok: false, message: "List must contain whole numbers separated by commas" }
        }
        numbers.push(parsed)
      }
      if (numbers.length === 0) {
        return { ok: false, message: "Add at least one number" }
      }
      return { ok: true, value: numbers }
    }
    case "json":
    case "rich_text": {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (parsed === null || typeof parsed !== "object") {
          return { ok: false, message: "Value must be a JSON object or array" }
        }
        return { ok: true, value: parsed }
      } catch {
        return { ok: false, message: "Invalid JSON" }
      }
    }
    default: {
      const _exhaustive: never = type
      return { ok: false, message: `Unsupported type: ${String(_exhaustive)}` }
    }
  }
}
