import { MedusaError } from "@medusajs/utils"

import type { StoredValueColumns, ValueType } from "./types"

export type ValueColumn = "value_text" | "value_json" | "value_number" | "value_boolean"

export function valueColumnForType(type: ValueType): ValueColumn {
  switch (type) {
    case "single_line_text":
    case "multi_line_text":
    case "url":
    case "color":
    case "date":
    case "date_time":
      return "value_text"
    case "json":
    case "list.single_line_text":
    case "list.number_integer":
    case "rich_text":
      return "value_json"
    case "number_integer":
    case "number_decimal":
      return "value_number"
    case "boolean":
      return "value_boolean"
    default: {
      const _exhaustive: never = type
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported value type: ${String(_exhaustive)}`
      )
    }
  }
}

function emptyStoredColumns(): StoredValueColumns {
  return {
    value_text: null,
    value_json: null,
    value_number: null,
    value_boolean: null,
  }
}

function assertSinglePopulatedColumn(columns: StoredValueColumns): void {
  const populated = [
    columns.value_text !== null,
    columns.value_json !== null,
    columns.value_number !== null,
    columns.value_boolean !== null,
  ].filter(Boolean).length

  if (populated !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Exactly one typed value column must be populated"
    )
  }
}

function parseTextValue(value: unknown, type: ValueType): string {
  if (typeof value !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${type} value must be a string`
    )
  }
  const trimmed = value.trim()
  if (trimmed === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${type} value cannot be empty`)
  }
  return trimmed
}

function parseJsonValue(value: unknown, type: ValueType): Record<string, unknown> | unknown[] {
  if (type === "list.single_line_text") {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "list.single_line_text value must be an array of strings"
      )
    }
    return value
  }
  if (type === "list.number_integer") {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === "number" && Number.isInteger(item))
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "list.number_integer value must be an array of integers"
      )
    }
    return value
  }
  if (value === null || typeof value !== "object") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `${type} value must be a JSON object or array`)
  }
  return value as Record<string, unknown> | unknown[]
}

function parseNumberValue(value: unknown, type: ValueType): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${type} value must be a finite number`
    )
  }
  if (type === "number_integer" && !Number.isInteger(value)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "number_integer value must be an integer"
    )
  }
  return value
}

export function buildStoredColumns(type: ValueType, value: unknown): StoredValueColumns {
  const columns = emptyStoredColumns()
  const column = valueColumnForType(type)

  switch (column) {
    case "value_text":
      columns.value_text = parseTextValue(value, type)
      break
    case "value_json":
      columns.value_json = parseJsonValue(value, type)
      break
    case "value_number":
      columns.value_number = parseNumberValue(value, type)
      break
    case "value_boolean":
      if (typeof value !== "boolean") {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "boolean value must be true or false")
      }
      columns.value_boolean = value
      break
    default: {
      const _exhaustive: never = column
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported column: ${String(_exhaustive)}`
      )
    }
  }

  assertSinglePopulatedColumn(columns)
  return columns
}

export function extractTypedValue(
  row: StoredValueColumns,
  type: ValueType
): unknown {
  const column = valueColumnForType(type)
  switch (column) {
    case "value_text":
      return row.value_text
    case "value_json":
      return row.value_json
    case "value_number":
      return row.value_number === null ? null : Number(row.value_number)
    case "value_boolean":
      return row.value_boolean
    default: {
      const _exhaustive: never = column
      return _exhaustive
    }
  }
}
