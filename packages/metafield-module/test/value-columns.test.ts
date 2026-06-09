import { describe, expect, it } from "vitest"

import { buildStoredColumns, extractTypedValue, valueColumnForType } from "../src/modules/metafield/value-columns"
import type { ValueType } from "../src/modules/metafield/types"

describe("value-columns typed mapping", (): void => {
  const textTypes: ValueType[] = [
    "single_line_text",
    "multi_line_text",
    "url",
    "color",
    "date",
    "date_time",
  ]

  it.each(textTypes)("writes %s to value_text only", (type: ValueType): void => {
    expect(valueColumnForType(type)).toBe("value_text")
    const columns = buildStoredColumns(type, "hello")
    expect(columns.value_text).toBe("hello")
    expect(columns.value_json).toBeNull()
    expect(columns.value_number).toBeNull()
    expect(columns.value_boolean).toBeNull()
  })

  it("writes number_integer to value_number only", (): void => {
    const columns = buildStoredColumns("number_integer", 42)
    expect(columns.value_number).toBe(42)
    expect(columns.value_text).toBeNull()
    expect(columns.value_json).toBeNull()
    expect(columns.value_boolean).toBeNull()
    expect(extractTypedValue(columns, "number_integer")).toBe(42)
  })

  it("writes number_decimal to value_number only", (): void => {
    const columns = buildStoredColumns("number_decimal", 3.14)
    expect(columns.value_number).toBe(3.14)
    expect(extractTypedValue(columns, "number_decimal")).toBe(3.14)
  })

  it("writes boolean to value_boolean only", (): void => {
    const columns = buildStoredColumns("boolean", true)
    expect(columns.value_boolean).toBe(true)
    expect(columns.value_text).toBeNull()
    expect(extractTypedValue(columns, "boolean")).toBe(true)
  })

  it("writes list.single_line_text to value_json only", (): void => {
    const columns = buildStoredColumns("list.single_line_text", ["a", "b"])
    expect(columns.value_json).toEqual(["a", "b"])
    expect(columns.value_text).toBeNull()
    expect(extractTypedValue(columns, "list.single_line_text")).toEqual(["a", "b"])
  })

  it("writes json to value_json only", (): void => {
    const payload = { foo: "bar" }
    const columns = buildStoredColumns("json", payload)
    expect(columns.value_json).toEqual(payload)
    expect(extractTypedValue(columns, "json")).toEqual(payload)
  })
})
