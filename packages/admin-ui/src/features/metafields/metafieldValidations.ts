import type { MetafieldValueType } from "./types"

export type MetafieldValidationDraft = {
  max_length: string
  min: string
  max: string
  max_items: string
}

export const EMPTY_VALIDATION_DRAFT: MetafieldValidationDraft = {
  max_length: "",
  min: "",
  max: "",
  max_items: "",
}

function readOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === "") {
    return undefined
  }
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function readOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (trimmed === "") {
    return undefined
  }
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function supportsMetafieldValidations(type: MetafieldValueType): boolean {
  return (
    type === "single_line_text" ||
    type === "multi_line_text" ||
    type === "number_integer" ||
    type === "number_decimal" ||
    type === "list.single_line_text" ||
    type === "list.number_integer"
  )
}

export function validationDraftFromRecord(
  type: MetafieldValueType,
  validations: Record<string, unknown> | null
): MetafieldValidationDraft {
  if (validations === null) {
    return { ...EMPTY_VALIDATION_DRAFT }
  }

  const draft = { ...EMPTY_VALIDATION_DRAFT }
  if (type === "single_line_text" || type === "multi_line_text") {
    const maxLength = validations.max_length
    if (typeof maxLength === "number" && Number.isFinite(maxLength)) {
      draft.max_length = String(maxLength)
    }
  }
  if (type === "number_integer" || type === "number_decimal") {
    const min = validations.min
    const max = validations.max
    if (typeof min === "number" && Number.isFinite(min)) {
      draft.min = String(min)
    }
    if (typeof max === "number" && Number.isFinite(max)) {
      draft.max = String(max)
    }
  }
  if (type === "list.single_line_text" || type === "list.number_integer") {
    const maxItems = validations.max_items
    if (typeof maxItems === "number" && Number.isFinite(maxItems)) {
      draft.max_items = String(maxItems)
    }
  }
  return draft
}

export function buildValidationsPayload(
  type: MetafieldValueType,
  draft: MetafieldValidationDraft
): Record<string, unknown> | null {
  if (!supportsMetafieldValidations(type)) {
    return null
  }

  const payload: Record<string, unknown> = {}

  if (type === "single_line_text" || type === "multi_line_text") {
    const maxLength = readOptionalInt(draft.max_length)
    if (maxLength !== undefined) {
      payload.max_length = maxLength
    }
  }

  if (type === "number_integer" || type === "number_decimal") {
    const min = readOptionalNumber(draft.min)
    const max = readOptionalNumber(draft.max)
    if (min !== undefined) {
      payload.min = min
    }
    if (max !== undefined) {
      payload.max = max
    }
  }

  if (type === "list.single_line_text" || type === "list.number_integer") {
    const maxItems = readOptionalInt(draft.max_items)
    if (maxItems !== undefined) {
      payload.max_items = maxItems
    }
  }

  return Object.keys(payload).length > 0 ? payload : null
}
